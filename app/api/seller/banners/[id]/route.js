import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Banner from '@/models/Banner';
import { requireApprovedSeller } from '@/lib/apiAuth';

const CONTENT_FIELDS = ['title', 'subtitle', 'image', 'mobileImage', 'link', 'buttonText'];

export const PUT = requireApprovedSeller(async (req, { params }, admin) => {
  const { id } = await params;
  await dbConnect();

  // Scoped to this seller, so they can never touch another seller's or admin's banner
  const banner = await Banner.findOne({ _id: id, seller: admin.id });
  if (!banner) return NextResponse.json({ error: 'Banner not found.' }, { status: 404 });

  const body = await req.json();
  let contentChanged = false;

  for (const k of CONTENT_FIELDS) {
    if (body[k] !== undefined && body[k] !== banner[k]) {
      banner[k] = body[k];
      contentChanged = true;
    }
  }

  // Hiding or showing doesn't need re-approval
  if (body.isActive !== undefined) banner.isActive = !!body.isActive;

  // Any content edit needs fresh approval
  if (contentChanged) {
    banner.approval = 'pending';
    banner.rejectionReason = '';
  }

  await banner.save();
  return NextResponse.json({ banner });
});

export const DELETE = requireApprovedSeller(async (req, { params }, admin) => {
  const { id } = await params;
  await dbConnect();

  const banner = await Banner.findOne({ _id: id, seller: admin.id });
  if (!banner) return NextResponse.json({ error: 'Banner not found.' }, { status: 404 });

  await banner.deleteOne();
  return NextResponse.json({ success: true });
});