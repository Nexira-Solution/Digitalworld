export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/mongodb';
import Order from '@/models/Order';
import { getServerAdmin } from '@/lib/getServerAdmin';

// Tracking lifecycle stages in chronological order
const ALL_STAGES = [
  { key: 'placed', label: 'Order Placed', desc: 'Order received and logged in system' },
  { key: 'confirmed', label: 'Payment Confirmed', desc: 'Payment verified and confirmed' },
  { key: 'processing', label: 'Processing', desc: 'Order being prepared at supplier fulfillment center' },
  { key: 'packed', label: 'Packed', desc: 'Secure & hygienic packaging completed' },
  { key: 'shipped', label: 'Shipped', desc: 'Handed over to courier partner' },
  { key: 'out_for_delivery', label: 'Out for Delivery', desc: 'Package out for doorstep delivery' },
  { key: 'delivered', label: 'Delivered', desc: 'Package successfully delivered to customer' },
];

export async function GET(req, { params }) {
  try {
    await dbConnect();
    const { id } = await params;

    const query = mongoose.isValidObjectId(id)
      ? { $or: [{ _id: id }, { orderNumber: id }] }
      : { orderNumber: id };

    const order = await Order.findOne(query).lean();
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Determine completed and active stages
    const currentStatus = order.status || 'placed';
    const currentStageIndex = ALL_STAGES.findIndex((s) => s.key === currentStatus);
    const activeIndex = currentStageIndex >= 0 ? currentStageIndex : 0;

    // Build timeline stages
    const stages = ALL_STAGES.map((s, idx) => ({
      ...s,
      isCompleted: idx < activeIndex,
      isCurrent: idx === activeIndex,
      isPending: idx > activeIndex,
    }));

    return NextResponse.json({
      success: true,
      orderId: order._id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      currentStatus,
      paymentStatus: order.paymentStatus || 'pending',
      paymentMethod: order.paymentMethod || 'razorpay',
      total: order.total,
      subtotal: order.subtotal,
      shippingFee: order.shippingFee,
      items: order.items || [],
      customer: {
        name: order.customer?.name,
        city: order.shippingAddress?.city,
        state: order.shippingAddress?.state,
        pincode: order.shippingAddress?.pincode,
        line1: order.shippingAddress?.line1,
      },
      courier: order.courier || { partner: '', trackingId: '', awbNumber: '' },
      estimatedDelivery: order.estimatedDelivery || {
        minDays: 5,
        maxDays: 6,
        formattedRange: '5 - 6 Days',
      },
      trackingEvents: order.trackingEvents || [],
      stages,
    });
  } catch (err) {
    console.error('GET /api/orders/[id]/tracking error:', err);
    return NextResponse.json({ error: 'Failed to fetch tracking details' }, { status: 500 });
  }
}

// POST /api/orders/:id/tracking -> add tracking event (admin or seller)
export async function POST(req, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    const admin = await getServerAdmin();

    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized. Staff or seller login required.' }, { status: 401 });
    }

    const query = mongoose.isValidObjectId(id)
      ? { $or: [{ _id: id }, { orderNumber: id }] }
      : { orderNumber: id };

    const order = await Order.findOne(query);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const body = await req.json();
    const { status, title, description, location, courierPartner, trackingId, awbNumber } = body;

    if (status) {
      order.status = status;
    }

    if (courierPartner) order.courier.partner = courierPartner;
    if (trackingId) order.courier.trackingId = trackingId;
    if (awbNumber) order.courier.awbNumber = awbNumber;

    if (title || status) {
      if (!order.trackingEvents) order.trackingEvents = [];
      order.trackingEvents.push({
        status: status || order.status,
        title: title || `Status updated to ${status}`,
        description: description || `Order stage transitioned by ${admin.name || 'fulfillment center'}`,
        location: location || order.shippingAddress?.city || 'Fulfillment Hub',
        timestamp: new Date(),
      });
    }

    await order.save();

    return NextResponse.json({
      success: true,
      message: 'Tracking event recorded successfully',
      order,
    });
  } catch (err) {
    console.error('POST /api/orders/[id]/tracking error:', err);
    return NextResponse.json({ error: err.message || 'Failed to update tracking' }, { status: 500 });
  }
}

