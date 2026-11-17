export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Banner from '@/models/Banner';
import { requireSuperAdmin } from '@/lib/apiAuth';

const ALLOWED_FIELDS = [
  'title', 'subtitle', 'description', 'image', 'mobileImage', 'link',
  'buttonText', 'sortOrder', 'isActive', 'approval', 'rejectionReason',
  'startDate', 'endDate',
];
const APPROVAL_VALUES = ['pending', 'approved', 'rejected'];

export const PUT = requireSuperAdmin(async (req, { params }, admin) => {
  const { id } = await params;
  await dbConnect();
  const body = await req.json();

  const update = {};
  for (const k of ALLOWED_FIELDS) {
    if (body[k] !== undefined) {
      if (k === 'startDate' || k === 'endDate') {
        update[k] = body[k] ? new Date(body[k]) : null;
      } else if (k === 'sortOrder') {
        update[k] = Number(body[k]) || 0;
      } else {
        update[k] = body[k];
      }
    }
  }

  if (update.approval !== undefined) {
    if (!APPROVAL_VALUES.includes(update.approval)) {
      return NextResponse.json({ error: 'Invalid approval value.' }, { status: 400 });
    }
    if (update.approval === 'approved') {
      update.rejectionReason = '';
    }
    update.reviewedAt = new Date();
    update.reviewedBy = admin.id;
  }

  const existing = await Banner.findById(id);
  if (!existing) return NextResponse.json({ error: 'Banner not found.' }, { status: 404 });

  // Guarantee strict classification: Seller banners always remain storefront-only
  if (existing.seller) {
    update.bannerType = 'storefront';
    update.seller = existing.seller;
  } else {
    update.bannerType = 'homepage';
    update.seller = null;
  }

  const banner = await Banner.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  }).populate('seller', 'name businessName sellerSlug');

  if (!banner) return NextResponse.json({ error: 'Banner not found.' }, { status: 404 });

  return NextResponse.json({ banner });
});

export const DELETE = requireSuperAdmin(async (req, { params }) => {
  const { id } = await params;
  await dbConnect();
  const banner = await Banner.findByIdAndDelete(id);
  if (!banner) return NextResponse.json({ error: 'Banner not found.' }, { status: 404 });
  return NextResponse.json({ success: true });
});
