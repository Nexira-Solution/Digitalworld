export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Banner from '@/models/Banner';
import { requireSuperAdmin } from '@/lib/apiAuth';

// Superadmin-only: every banner (pending, rejected, seller-owned), pending first
const listAll = requireSuperAdmin(async () => {
  await dbConnect();
  const banners = await Banner.find({})
    .populate('seller', 'name businessName')
    .sort({ approval: 1, sortOrder: 1 });
  return NextResponse.json({ banners });
});

export async function GET(req, ctx) {
  const { searchParams } = new URL(req.url);

  // ?all=true is superadmin-only, so the public can't see pending banners
  if (searchParams.get('all')) return listAll(req, ctx);

  // Public: only live, approved banners
  await dbConnect();
  const banners = await Banner.find({
    isActive: true,
    approval: { $nin: ['pending', 'rejected'] },
  }).sort({ sortOrder: 1 });
  return NextResponse.json({ banners });
}

export const POST = requireSuperAdmin(async (req) => {
  await dbConnect();
  const body = await req.json();
  if (!body.image) {
    return NextResponse.json({ error: 'Banner image URL is required' }, { status: 400 });
  }
  // Admin banners are never owned by a seller and are approved immediately
  const banner = await Banner.create({ ...body, seller: null, approval: 'approved' });
  return NextResponse.json({ banner }, { status: 201 });
});