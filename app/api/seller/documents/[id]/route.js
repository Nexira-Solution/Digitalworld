export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/auth';
import { dbConnect } from '@/lib/mongodb';
import SellerDocument from '@/models/SellerDocument';

export async function DELETE(req, { params }) {
  try {
    const tokenAdmin = getAdminFromRequest(req);
    if (!tokenAdmin) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    const doc = await SellerDocument.findById(id);
    if (!doc) {
      return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
    }

    // Only allow document deletion by owner or superadmin
    if (tokenAdmin.role !== 'superadmin' && String(doc.seller) !== String(tokenAdmin.id)) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    await SellerDocument.findByIdAndDelete(id);

    return NextResponse.json({ ok: true, message: 'Document removed successfully.' });
  } catch (err) {
    console.error('DELETE /api/seller/documents/[id] error:', err);
    return NextResponse.json({ error: 'Failed to delete document.' }, { status: 500 });
  }
}

