export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Coupon from '@/models/Coupon';

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const rawCode = String(body.code || '').trim().toUpperCase();
    const subtotal = Math.max(0, Number(body.subtotal || 0));

    if (!rawCode) {
      return NextResponse.json({ valid: false, message: 'Please enter a coupon code' }, { status: 400 });
    }

    const coupon = await Coupon.findOne({ code: rawCode, isActive: true });
    if (!coupon) {
      return NextResponse.json({ valid: false, message: 'Invalid or inactive coupon code' });
    }

    // Expiry check
    const now = new Date();
    const expiry = coupon.expiryDate || coupon.expiresAt;
    if (expiry && new Date(expiry) < now) {
      return NextResponse.json({ valid: false, message: 'This coupon has expired' });
    }

    // Usage limit check
    if (coupon.usageLimit && (coupon.usedCount || 0) >= coupon.usageLimit) {
      return NextResponse.json({ valid: false, message: 'This coupon has reached its total usage limit' });
    }

    // Minimum order value check
    const minOrder = Number(coupon.minimumOrderValue ?? coupon.minOrderValue ?? 0);
    if (subtotal < minOrder) {
      return NextResponse.json({
        valid: false,
        message: `Coupon requires a minimum purchase of ₹${minOrder.toLocaleString('en-IN')}`,
      });
    }

    // Discount calculation
    const type = coupon.discountType || (coupon.type === 'percent' ? 'percentage' : 'fixed');
    const val = Number(coupon.discountValue ?? coupon.value ?? 0);
    const maxDisc = Number(coupon.maximumDiscount ?? coupon.maxDiscount ?? 0);

    let calculatedDiscount = 0;
    if (type === 'percentage') {
      calculatedDiscount = (subtotal * val) / 100;
      if (maxDisc > 0) {
        calculatedDiscount = Math.min(calculatedDiscount, maxDisc);
      }
    } else {
      calculatedDiscount = Math.min(val, subtotal);
    }

    calculatedDiscount = Math.round(calculatedDiscount);

    return NextResponse.json({
      valid: true,
      success: true,
      code: coupon.code,
      discount: calculatedDiscount,
      discountType: type,
      discountValue: val,
      minimumOrderValue: minOrder,
      maximumDiscount: maxDisc,
      message: `Coupon "${coupon.code}" applied! You save ₹${calculatedDiscount.toLocaleString('en-IN')}`,
    });
  } catch (err) {
    console.error('POST /api/coupons/validate error:', err);
    return NextResponse.json({ valid: false, message: 'Coupon validation failed' }, { status: 500 });
  }
}
