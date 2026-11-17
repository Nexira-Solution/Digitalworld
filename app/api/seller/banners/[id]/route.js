export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Banner from '@/models/Banner';
import { requireAdmin } from '@/lib/apiAuth';

export const PUT = requireAdmin(async (req, { params }, admin) => {
  const { id } = await params;
  await dbConnect();

  const banner = await Banner.findOne({ _id: id, seller: admin.id });
  if (!banner) {
    return NextResponse.json({ error: 'Banner not found or unauthorized' }, { status: 404 });
  }

  const body = await req.json();
  const allowed = ['title', 'subtitle', 'description', 'image', 'mobileImage', 'link', 'buttonText', 'isActive'];

  allowed.forEach((field) => {
    if (body[field] !== undefined) {
      banner[field] = body[field];
    }
  });

  // If seller changed image or critical text, reset approval to pending
  if (body.image && body.image !== banner.image) {
    banner.approval = 'pending';
    banner.rejectionReason = '';
  }

  await banner.save();
  return NextResponse.json({ success: true, banner });
});

export const DELETE = requireAdmin(async (req, { params }, admin) => {
  const { id } = await params;
  await dbConnect();

  const banner = await Banner.findOneAndDelete({ _id: id, seller: admin.id });
  if (!banner) {
    return NextResponse.json({ error: 'Banner not found or unauthorized' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
});
