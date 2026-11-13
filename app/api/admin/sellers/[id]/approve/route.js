export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Admin from '@/models/Admin';
import SellerApprovalHistory from '@/models/SellerApprovalHistory';
import { requireSuperAdmin } from '@/lib/apiAuth';

async function handleApprove(req, { params }, superadmin) {
  try {
    const { id } = await params;
    await dbConnect();

    const seller = await Admin.findById(id);
    if (!seller || seller.role !== 'seller') {
      return NextResponse.json({ error: 'Seller not found.' }, { status: 404 });
    }

    const previousStatus = seller.status;
    seller.status = 'approved';
    seller.rejectionReason = '';
    seller.suspensionReason = '';
    seller.approvedAt = new Date();
    seller.approvedBy = superadmin.id;
    await seller.save();

    // Create approval history entry
    await SellerApprovalHistory.create({
      seller: seller._id,
      admin: superadmin.id,
      action: 'approved',
      previousStatus,
      newStatus: 'approved',
      reason: 'Seller account approved by administrator',
    });

    return NextResponse.json({
      ok: true,
      message: 'Seller has been approved successfully.',
      seller: {
        id: String(seller._id),
        email: seller.email,
        businessName: seller.businessName,
        status: seller.status,
        approvedAt: seller.approvedAt,
      },
    });
  } catch (err) {
    console.error('Approve seller error:', err);
    return NextResponse.json({ error: err.message || 'Failed to approve seller' }, { status: 500 });
  }
}

export const PATCH = requireSuperAdmin(handleApprove);
export const POST = requireSuperAdmin(handleApprove);
