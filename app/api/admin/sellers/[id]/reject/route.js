export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Admin from '@/models/Admin';
import SellerApprovalHistory from '@/models/SellerApprovalHistory';
import { requireSuperAdmin } from '@/lib/apiAuth';

async function handleReject(req, { params }, superadmin) {
  try {
    const { id } = await params;
    await dbConnect();

    const body = await req.json().catch(() => ({}));
    const reason = String(body.reason || '').trim();

    if (!reason) {
      return NextResponse.json(
        { error: 'A rejection reason is required so the seller understands why their application was not accepted.' },
        { status: 400 }
      );
    }

    const seller = await Admin.findById(id);
    if (!seller || seller.role !== 'seller') {
      return NextResponse.json({ error: 'Seller not found.' }, { status: 404 });
    }

    const previousStatus = seller.status;
    seller.status = 'rejected';
    seller.rejectionReason = reason;
    seller.rejectedAt = new Date();
    seller.rejectedBy = superadmin.id;
    await seller.save();

    // Create approval history entry
    await SellerApprovalHistory.create({
      seller: seller._id,
      admin: superadmin.id,
      action: 'rejected',
      previousStatus,
      newStatus: 'rejected',
      reason,
    });

    return NextResponse.json({
      ok: true,
      message: 'Seller application has been rejected.',
      seller: {
        id: String(seller._id),
        email: seller.email,
        businessName: seller.businessName,
        status: seller.status,
        rejectionReason: seller.rejectionReason,
      },
    });
  } catch (err) {
    console.error('Reject seller error:', err);
    return NextResponse.json({ error: err.message || 'Failed to reject seller' }, { status: 500 });
  }
}

export const PATCH = requireSuperAdmin(handleReject);
export const POST = requireSuperAdmin(handleReject);
