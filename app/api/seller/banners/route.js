export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Banner from '@/models/Banner';
import { requireAdmin, requireApprovedSeller } from '@/lib/apiAuth';

// Sellers can view their own banners even while pending approval
export const GET = requireAdmin(async (req, ctx, admin) => {
  await dbConnect();
  const banners = await Banner.find({ seller: admin.id }).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ banners });
});

// Only approved sellers can create banners
export const POST = requireApprovedSeller(async (req, ctx, admin) => {
  await dbConnect();
  const body = await req.json();
  if (!body.image) {
    return NextResponse.json({ error: 'Banner image is required' }, { status: 400 });
  }

  // Whitelist fields: sellers can't set sortOrder, approval, or seller themselves
  const banner = await Banner.create({
    title: body.title || '',
    subtitle: body.subtitle || '',
    image: body.image,
    mobileImage: body.mobileImage || '',
    link: body.link || '',
    buttonText: body.buttonText || 'Shop Now',
    isActive: true,
    sortOrder: 0,
    seller: admin.id,
    approval: 'pending',
  });
  return NextResponse.json({ banner }, { status: 201 });
});