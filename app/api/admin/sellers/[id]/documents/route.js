export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import SellerDocument from '@/models/SellerDocument';
import { requireSuperAdmin } from '@/lib/apiAuth';

export const GET = requireSuperAdmin(async (req, { params }) => {
  try {
    const { id } = await params;
    await dbConnect();

    const documents = await SellerDocument.find({ seller: id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ documents });
  } catch (err) {
    console.error('GET /api/admin/sellers/[id]/documents error:', err);
    return NextResponse.json({ error: 'Failed to fetch seller documents.' }, { status: 500 });
  }
});

