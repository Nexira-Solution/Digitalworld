import mongoose from 'mongoose';
import Product from '@/models/Product';
import Combo from '@/models/Combo';
import Coupon from '@/models/Coupon';
import Settings from '@/models/Settings';
import { genCouponCheck } from '@/lib/utils';
import { calculateShipping, calculateMultiSellerDelivery } from '@/lib/shipping';

export class OrderError extends Error {}

// Feature 14 Architectural Feature Flag
export const ENABLE_COUPONS = false;

// Pure read-only pricing + validation. Does NOT touch stock or coupon usage —
// safe to call twice (once for the Razorpay amount, once at final order creation).
export async function buildOrderItemsAndTotals(items, couponCode) {
  let subtotal = 0;
  const orderItems = [];
  const stockUpdateItems = [];

  for (const item of items) {
    if (item.isCombo === true && item.comboId) {
      if (!mongoose.Types.ObjectId.isValid(item.comboId)) continue;

      const combo = await Combo.findById(item.comboId);
      if (!combo || !combo.isActive) {
        throw new OrderError(`This combo is no longer available`);
      }

      for (const sub of combo.products) {
        const subProduct = await Product.findById(sub.product);
        const subVariant = subProduct?.variants.id(sub.variantId);
        const subSizeEntry = subVariant?.sizes.find((s) => s.size === sub.size);
        if (!subProduct || !subVariant || !subSizeEntry || subSizeEntry.stock < item.qty) {
          throw new OrderError(`Combo "${combo.name}" is out of stock`);
        }
      }

      subtotal += combo.comboPrice * item.qty;
      orderItems.push({
        product: null,
        comboId: combo._id,
        // A combo can bundle products from different sellers, so there's
        // no single owning seller to attribute this line item to — it's
        // left null and won't appear in any individual seller's order
        // dashboard (only a superadmin sees it, via the full order list).
        // If combos are always single-seller in practice, this can be
        // changed to look up the first sub-product's seller instead.
        seller: null,
        name: combo.name,
        sku: combo.sku || '',
        image: combo.image || '',
        color: '',
        size: '',
        sleeveType: '',
        zipType: '',
        pantOption: null,
        shawlOption: null,
        price: combo.comboPrice,
        qty: item.qty,
        isCombo: true
      });
      stockUpdateItems.push({ isCombo: true, comboProducts: combo.products, qty: item.qty });
      continue;
    }

    if (!mongoose.Types.ObjectId.isValid(item.productId) || !mongoose.Types.ObjectId.isValid(item.variantId)) {
      continue;
    }

    const product = await Product.findById(item.productId);
    if (!product) continue;
    const variant = product.variants.id(item.variantId);
    if (!variant) continue;
    const sizeEntry = variant.sizes.find((s) => s.size === item.size);
    if (!sizeEntry || sizeEntry.stock < item.qty) {
      throw new OrderError(`${product.name} (${variant.color}, ${item.size}) is out of stock`);
    }

    const sleeveType = item.sleeveType || '';
    const zipType = item.zipType || '';

    if (product.sleeveOptions?.length) {
      if (!sleeveType || !product.sleeveOptions.includes(sleeveType)) {
        throw new OrderError(`${product.name} — please select a valid sleeve type`);
      }
    }
    if (product.zipOptions?.length) {
      if (!zipType || !product.zipOptions.includes(zipType)) {
        throw new OrderError(`${product.name} — please select a valid zip type`);
      }
    }

    let pantOption = null;
    if (item.pantOption?.id) {
      const opt = product.pantOptions?.id(item.pantOption.id);
      if (!opt) {
        throw new OrderError(`${product.name} — selected pant option is no longer available`);
      }
      if (opt.stock < item.qty) {
        throw new OrderError(`${product.name} — ${opt.name} (pant) is out of stock`);
      }
      pantOption = opt;
    }

    let shawlOption = null;
    if (item.shawlOption?.id) {
      const opt = product.shawlOptions?.id(item.shawlOption.id);
      if (!opt) {
        throw new OrderError(`${product.name} — selected shawl option is no longer available`);
      }
      if (opt.stock < item.qty) {
        throw new OrderError(`${product.name} — ${opt.name} (shawl) is out of stock`);
      }
      shawlOption = opt;
    }

    const addonPrice = (pantOption?.price || 0) + (shawlOption?.price || 0);
    const unitPrice = (sizeEntry.price && sizeEntry.price > 0 ? sizeEntry.price : variant.price) + addonPrice;

    subtotal += unitPrice * item.qty;
    orderItems.push({
      product: product._id,
      // Snapshot of which seller owned this product at order time — this
      // is what routes the line item into that seller's order dashboard
      // and gates whether they're allowed to update the order's status.
      seller: product.seller || null,
      name: product.name,
      sku: sizeEntry.sku || product.sku || '',
      image: variant.images?.[0] || '',
      color: variant.color,
      size: item.size,
      sleeveType,
      zipType,
      pantOption: pantOption
        ? { optionId: pantOption._id, name: pantOption.name, image: pantOption.image || '', price: pantOption.price, sku: pantOption.sku || '' }
        : null,
      shawlOption: shawlOption
        ? { optionId: shawlOption._id, name: shawlOption.name, image: shawlOption.image || '', price: shawlOption.price, sku: shawlOption.sku || '' }
        : null,
      price: unitPrice,
      qty: item.qty
    });
    stockUpdateItems.push({
      isCombo: false,
      productId: item.productId,
      variantId: item.variantId,
      size: item.size,
      pantOptionId: pantOption?._id || null,
      shawlOptionId: shawlOption?._id || null,
      qty: item.qty
    });
  }

  if (!orderItems.length) throw new OrderError('No valid items in cart');

  let discount = 0;
  let appliedCoupon = '';
  if (ENABLE_COUPONS && couponCode) {
    const coupon = await Coupon.findOne({ code: genCouponCheck(couponCode), isActive: true });
    const minOrder = Number(coupon?.minimumOrderValue ?? coupon?.minOrderValue ?? 0);
    if (coupon && subtotal >= minOrder) {
      const expiry = coupon.expiryDate || coupon.expiresAt;
      if (!expiry || new Date(expiry) > new Date()) {
        const limit = Number(coupon.usageLimit || 0);
        const used = Number(coupon.usedCount || 0);
        if (!limit || used < limit) {
          const isPercent = coupon.discountType === 'percentage' || coupon.discountType === 'percent' || coupon.type === 'percent';
          const discountVal = Number(coupon.discountValue ?? coupon.value ?? 0);
          const maxDisc = Number(coupon.maximumDiscount ?? coupon.maxDiscount ?? 0);

          discount = isPercent ? (subtotal * discountVal) / 100 : discountVal;
          if (maxDisc > 0) discount = Math.min(discount, maxDisc);
          discount = Math.min(discount, subtotal); // cannot exceed subtotal
          appliedCoupon = coupon.code;
        }
      }
    }
  }

  const discountedSubtotal = subtotal - discount;
  const { totalDeliveryFee: shippingFee, breakdown: deliveryBreakdown } =
    await calculateMultiSellerDelivery(orderItems);
  const total = Math.round(discountedSubtotal + shippingFee);

  return {
    orderItems,
    stockUpdateItems,
    subtotal,
    discount,
    appliedCoupon,
    shippingFee,
    deliveryBreakdown,
    total,
  };
}