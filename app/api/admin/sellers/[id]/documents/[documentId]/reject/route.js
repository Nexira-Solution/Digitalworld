export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import SellerDocument from '@/models/SellerDocument';
import { requireSuperAdmin } from '@/lib/apiAuth';

async function handleReject(req, { params }, superadmin) {
  try {
    const { id, documentId } = await params;
    await dbConnect();

    const body = await req.json().catch(() => ({}));
    const remarks = String(body.remarks || body.reason || '').trim();

    if (!remarks) {
      return NextResponse.json(
        { error: 'Please provide remarks explaining why this document was rejected.' },
        { status: 400 }
      );
    }

    const doc = await SellerDocument.findOne({ _id: documentId, seller: id });
    if (!doc) {
      return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
    }

    doc.verificationStatus = 'rejected';
    doc.reviewedBy = superadmin.id;
    doc.reviewedAt = new Date();
    doc.remarks = remarks;
    await doc.save();

    return NextResponse.json({
      ok: true,
      message: `${doc.documentName} rejected with remarks.`,
      document: doc,
    });
  } catch (err) {
    console.error('Reject document error:', err);
    return NextResponse.json({ error: 'Failed to reject document.' }, { status: 500 });
  }
}

export const PATCH = requireSuperAdmin(handleReject);
export const POST = requireSuperAdmin(handleReject);

