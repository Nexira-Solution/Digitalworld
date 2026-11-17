export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Coupon from '@/models/Coupon';

// Feature 14 Architectural Feature Flag
const ENABLE_COUPONS = false;

export async function GET() {
  try {
    if (!ENABLE_COUPONS) {
      return NextResponse.json({ success: true, coupons: [] });
    }

    await dbConnect();
    const now = new Date();

    const coupons = await Coupon.find({
      isActive: true,
      $or: [
        { expiryDate: null, expiresAt: null },
        { expiryDate: { $gte: now } },
        { expiresAt: { $gte: now } },
      ],
    })
      .select('code description discountType discountValue minimumOrderValue maximumDiscount minOrderValue maxDiscount value type')
      .sort({ minimumOrderValue: 1, minOrderValue: 1 })
      .lean();

    const shaped = coupons.map((c) => {
      const type = c.discountType || (c.type === 'percent' ? 'percentage' : 'fixed');
      const val = c.discountValue ?? c.value ?? 0;
      const minOrder = c.minimumOrderValue ?? c.minOrderValue ?? 0;
      const maxDisc = c.maximumDiscount ?? c.maxDiscount ?? 0;

      return {
        code: c.code,
        description: c.description || (type === 'percentage' ? `${val}% Instant Discount` : `Flat ₹${val} OFF`),
        discountType: type,
        discountValue: val,
        minimumOrderValue: minOrder,
        maximumDiscount: maxDisc,
      };
    });

    return NextResponse.json({ success: true, coupons: shaped });
  } catch (err) {
    console.error('GET /api/coupons/active error:', err);
    return NextResponse.json({ error: 'Failed to fetch active coupons' }, { status: 500 });
  }
}

