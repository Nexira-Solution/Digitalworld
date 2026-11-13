export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Admin from '@/models/Admin';
import SellerApprovalHistory from '@/models/SellerApprovalHistory';
import { requireSuperAdmin } from '@/lib/apiAuth';

async function handleSuspend(req, { params }, superadmin) {
  try {
    const { id } = await params;
    await dbConnect();

    const body = await req.json().catch(() => ({}));
    const reason = String(body.reason || '').trim();

    if (!reason) {
      return NextResponse.json(
        { error: 'A suspension reason is required.' },
        { status: 400 }
      );
    }

    const seller = await Admin.findById(id);
    if (!seller || seller.role !== 'seller') {
      return NextResponse.json({ error: 'Seller not found.' }, { status: 404 });
    }

    const previousStatus = seller.status;
    seller.status = 'suspended';
    seller.suspensionReason = reason;
    seller.suspendedAt = new Date();
    seller.suspendedBy = superadmin.id;
    await seller.save();

    // Create approval history entry
    await SellerApprovalHistory.create({
      seller: seller._id,
      admin: superadmin.id,
      action: 'suspended',
      previousStatus,
      newStatus: 'suspended',
      reason,
    });

    return NextResponse.json({
      ok: true,
      message: 'Seller account has been suspended.',
      seller: {
        id: String(seller._id),
        email: seller.email,
        businessName: seller.businessName,
        status: seller.status,
        suspensionReason: seller.suspensionReason,
      },
    });
  } catch (err) {
    console.error('Suspend seller error:', err);
    return NextResponse.json({ error: err.message || 'Failed to suspend seller' }, { status: 500 });
  }
}

export const PATCH = requireSuperAdmin(handleSuspend);
export const POST = requireSuperAdmin(handleSuspend);

