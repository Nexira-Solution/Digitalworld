import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Banner from '@/models/Banner';
import { requireSuperAdmin } from '@/lib/apiAuth';

const ALLOWED_FIELDS = [
  'title', 'subtitle', 'image', 'mobileImage', 'link',
  'buttonText', 'sortOrder', 'isActive', 'approval', 'rejectionReason',
];
const APPROVAL_VALUES = ['pending', 'approved', 'rejected'];

export const PUT = requireSuperAdmin(async (req, { params }) => {
  const { id } = await params;
  await dbConnect();
  const body = await req.json();

  // Only known fields; `seller` can never be changed from the client
  const update = {};
  for (const k of ALLOWED_FIELDS) {
    if (body[k] !== undefined) update[k] = body[k];
  }

  if (update.approval !== undefined) {
    if (!APPROVAL_VALUES.includes(update.approval)) {
      return NextResponse.json({ error: 'Invalid approval value.' }, { status: 400 });
    }
    // Approving clears any old rejection reason
    if (update.approval === 'approved') update.rejectionReason = '';
  }

  const banner = await Banner.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  });
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