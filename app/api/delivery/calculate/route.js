export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { calculateMultiSellerDelivery } from '@/lib/shipping';

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json().catch(() => ({}));
    const items = Array.isArray(body.items) ? body.items : [];

    const deliveryResult = await calculateMultiSellerDelivery(items);

    return NextResponse.json({
      success: true,
      ...deliveryResult,
    });
  } catch (err) {
    console.error('POST /api/delivery/calculate error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to calculate delivery fee' },
      { status: 500 }
    );
  }
}
