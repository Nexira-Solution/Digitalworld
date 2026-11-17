import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Order from '@/models/Order';
import { requireApprovedSeller, ownsOrder } from '@/lib/apiAuth';

export async function GET(req, { params }) {
  await dbConnect();
  const order = await Order.findOne({ $or: [{ _id: params.id }, { orderNumber: params.id }] })
    .populate('items.seller', 'name email storeName')
    .lean();

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  return NextResponse.json({ order });
}

export const PUT = requireApprovedSeller(async (req, { params }, admin) => {
  await dbConnect();

  const existing = await Order.findById(params.id);
  if (!existing) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  if (admin.role !== 'superadmin' && !ownsOrder(admin, existing)) {
    return NextResponse.json(
      { error: 'You can only update orders made up entirely of your own products.' },
      { status: 403 }
    );
  }

  const body = await req.json();
  const updateDoc = {};
  const pushDoc = {};

  if (body.status && body.status !== existing.status) {
    updateDoc.status = body.status;
    pushDoc.statusHistory = {
      status: body.status,
      timestamp: new Date(),
      updatedBy: admin.id,
      updaterRole: admin.role === 'superadmin' ? 'admin' : 'seller',
      notes: body.notes || `Order status updated to ${body.status}`,
    };
  }

  if (body.courier) {
    updateDoc.courier = body.courier;
  }

  if (body.paymentStatus && admin.role === 'superadmin') {
    updateDoc.paymentStatus = body.paymentStatus;
  }

  const finalUpdate = { ...updateDoc };
  if (Object.keys(pushDoc).length > 0) {
    finalUpdate.$push = pushDoc;
  }

  const order = await Order.findByIdAndUpdate(params.id, finalUpdate, { new: true })
    .populate('items.seller', 'name email storeName');

  return NextResponse.json({ order });
});
