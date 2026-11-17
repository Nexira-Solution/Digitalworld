import crypto from 'crypto';
import Order from '@/models/Order';
import Product from '@/models/Product';
import Coupon from '@/models/Coupon';
import { genOrderNumber } from '@/lib/utils';
import { buildOrderItemsAndTotals, OrderError } from '@/lib/orderCalc';

// Feature 10 & 14 Architectural Feature Flags
export const ENABLE_COD = false; // Online payment only; COD disabled but extensible
export const ENABLE_COUPONS = false; // Coupon entry disabled temporarily; extensible

// Shared by both the client-side "fast path" (/api/orders) and the
// Razorpay webhook. Idempotent on razorpayOrderId.
export async function createOrderIdempotent(payload, opts = {}) {
  const {
    items,
    customer,
    shippingAddress,
    couponCode,
    paymentMethod,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  } = payload;

  if (!items?.length) throw new OrderError('Cart is empty');
  if (!customer?.name || !customer?.phone) throw new OrderError('Name and phone are required');

  // Feature 10: Reject COD when flag is disabled
  if (paymentMethod === 'cod') {
    if (!ENABLE_COD) {
      throw new OrderError(
        'Cash on Delivery (COD) is temporarily unavailable. Please choose online payment (UPI, Credit/Debit Card, Net Banking).'
      );
    }
  }

  if (razorpayOrderId) {
    const existing = await Order.findOne({ razorpayOrderId });
    if (existing) return { order: existing, created: false };
  }

  if (paymentMethod === 'razorpay' || paymentMethod === 'online') {
    if (!razorpayOrderId || !razorpayPaymentId) {
      throw new OrderError('Missing payment gateway transaction identifiers');
    }
    if (!opts.skipSignatureVerification) {
      if (!razorpaySignature) throw new OrderError('Missing payment verification data');
      const expected = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');
      if (expected !== razorpaySignature) throw new OrderError('Payment verification signature failed');
    }
  }

  // Feature 14: Only pass couponCode if ENABLE_COUPONS is true
  const effectiveCoupon = ENABLE_COUPONS ? couponCode : null;

  const {
    orderItems,
    stockUpdateItems,
    subtotal,
    discount,
    appliedCoupon,
    shippingFee,
    deliveryBreakdown,
    total,
  } = await buildOrderItemsAndTotals(items, effectiveCoupon);

  let order;
  try {
    order = await Order.create({
      orderNumber: genOrderNumber(),
      items: orderItems,
      customer,
      shippingAddress,
      subtotal,
      discount,
      couponCode: appliedCoupon,
      shippingFee,
      deliveryBreakdown: deliveryBreakdown || [],
      total,
      paymentMethod: paymentMethod || 'razorpay',
      paymentStatus: paymentMethod === 'razorpay' || paymentMethod === 'online' ? 'paid' : 'pending',
      status: 'confirmed',
      statusHistory: [
        {
          status: 'confirmed',
          timestamp: new Date(),
          updaterRole: 'system',
          notes: 'Order placed and payment verified successfully.',
        },
      ],
      razorpayOrderId,
      razorpayPaymentId,
    });
  } catch (err) {
    if (err.code === 11000 && razorpayOrderId) {
      const existing = await Order.findOne({ razorpayOrderId });
      if (existing) return { order: existing, created: false };
    }
    throw err;
  }

  if (appliedCoupon) {
    await Coupon.updateOne({ code: appliedCoupon }, { $inc: { usedCount: 1 } });
  }

  for (const entry of stockUpdateItems) {
    if (entry.isCombo) {
      for (const sub of entry.comboProducts) {
        await Product.updateOne(
          { _id: sub.product, 'variants._id': sub.variantId, 'variants.sizes.size': sub.size },
          { $inc: { 'variants.$[v].sizes.$[s].stock': -entry.qty, soldCount: entry.qty } },
          { arrayFilters: [{ 'v._id': sub.variantId }, { 's.size': sub.size }] }
        );
      }
      continue;
    }

    await Product.updateOne(
      { _id: entry.productId, 'variants._id': entry.variantId, 'variants.sizes.size': entry.size },
      { $inc: { 'variants.$[v].sizes.$[s].stock': -entry.qty, soldCount: entry.qty } },
      { arrayFilters: [{ 'v._id': entry.variantId }, { 's.size': entry.size }] }
    );

    if (entry.pantOptionId) {
      await Product.updateOne(
        { _id: entry.productId, 'pantOptions._id': entry.pantOptionId },
        { $inc: { 'pantOptions.$.stock': -entry.qty } }
      );
    }
    if (entry.shawlOptionId) {
      await Product.updateOne(
        { _id: entry.productId, 'shawlOptions._id': entry.shawlOptionId },
        { $inc: { 'shawlOptions.$.stock': -entry.qty } }
      );
    }
  }

  return { order, created: true };
}
