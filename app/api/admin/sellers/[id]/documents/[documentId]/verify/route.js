export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import SellerDocument from '@/models/SellerDocument';
import { requireSuperAdmin } from '@/lib/apiAuth';

async function handleVerify(req, { params }, superadmin) {
  try {
    const { id, documentId } = await params;
    await dbConnect();

    const doc = await SellerDocument.findOne({ _id: documentId, seller: id });
    if (!doc) {
      return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
    }

    doc.verificationStatus = 'verified';
    doc.reviewedBy = superadmin.id;
    doc.reviewedAt = new Date();
    doc.remarks = 'Verified by administrator';
    await doc.save();

    return NextResponse.json({
      ok: true,
      message: `${doc.documentName} verified successfully.`,
      document: doc,
    });
  } catch (err) {
    console.error('Verify document error:', err);
    return NextResponse.json({ error: 'Failed to verify document.' }, { status: 500 });
  }
}

export const PATCH = requireSuperAdmin(handleVerify);
export const POST = requireSuperAdmin(handleVerify);

