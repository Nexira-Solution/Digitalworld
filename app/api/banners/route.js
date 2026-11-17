export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Banner from '@/models/Banner';
import { requireSuperAdmin } from '@/lib/apiAuth';

// Superadmin-only: every banner (pending, rejected, seller-owned, scheduled)
const listAll = requireSuperAdmin(async () => {
  await dbConnect();
  const banners = await Banner.find({})
    .populate('seller', 'name businessName sellerSlug')
    .sort({ sortOrder: 1, createdAt: -1 });
  return NextResponse.json({ banners });
});

export async function GET(req, ctx) {
  const { searchParams } = new URL(req.url);

  // ?all=true is superadmin-only
  if (searchParams.get('all')) return listAll(req, ctx);

  // Public: only active, approved homepage banners within scheduled dates (Admin-managed only)
  await dbConnect();
  const now = new Date();
  const query = {
    isActive: true,
    approval: 'approved',
    seller: null,
    bannerType: { $ne: 'storefront' },
    $and: [
      { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
      { $or: [{ endDate: null }, { endDate: { $gte: now } }] },
    ],
  };

  const banners = await Banner.find(query).sort({ sortOrder: 1, createdAt: -1 }).lean();
  return NextResponse.json({ banners });
}

export const POST = requireSuperAdmin(async (req) => {
  await dbConnect();
  const body = await req.json();
  if (!body.image) {
    return NextResponse.json({ error: 'Desktop banner image URL is required' }, { status: 400 });
  }

  // Admin banners are exclusively homepage hero banners (bannerType: 'homepage', seller: null) and approved immediately
  const banner = await Banner.create({
    title: body.title || '',
    subtitle: body.subtitle || '',
    description: body.description || '',
    image: body.image,
    mobileImage: body.mobileImage || '',
    link: body.link || '',
    buttonText: body.buttonText || 'Shop Now',
    sortOrder: Number(body.sortOrder) || 0,
    isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
    startDate: body.startDate ? new Date(body.startDate) : null,
    endDate: body.endDate ? new Date(body.endDate) : null,
    bannerType: 'homepage',
    seller: null,
    approval: 'approved',
  });
  return NextResponse.json({ banner }, { status: 201 });
});
