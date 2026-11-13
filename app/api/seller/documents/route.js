export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/auth';
import { dbConnect } from '@/lib/mongodb';
import SellerDocument from '@/models/SellerDocument';

export async function GET(req) {
  try {
    const tokenAdmin = getAdminFromRequest(req);
    if (!tokenAdmin) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    await dbConnect();
    const documents = await SellerDocument.find({ seller: tokenAdmin.id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ documents });
  } catch (err) {
    console.error('GET /api/seller/documents error:', err);
    return NextResponse.json({ error: 'Failed to fetch documents.' }, { status: 500 });
  }
}

