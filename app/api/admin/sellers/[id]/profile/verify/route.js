export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Admin from '@/models/Admin';
import SellerApprovalHistory from '@/models/SellerApprovalHistory';
import { requireSuperAdmin } from '@/lib/apiAuth';

async function handleProfileVerify(req, { params }, superadmin) {
  try {
    const { id } = await params;
    await dbConnect();

    const body = await req.json().catch(() => ({}));
    const status = body.status === 'verified' ? 'verified' : 'rejected';
    const remarks = String(body.remarks || '').trim();

    if (status === 'rejected' && !remarks) {
      return NextResponse.json(
        { error: 'Please provide remarks explaining why the profile was not verified.' },
        { status: 400 }
      );
    }

    const seller = await Admin.findById(id);
    if (!seller || seller.role !== 'seller') {
      return NextResponse.json({ error: 'Seller not found.' }, { status: 404 });
    }

    const previousStatus = seller.profileVerificationStatus;
    seller.profileVerificationStatus = status;
    seller.verificationRemarks = remarks;
    seller.verifiedAt = new Date();
    seller.verifiedBy = superadmin.id;
    await seller.save();

    await SellerApprovalHistory.create({
      seller: seller._id,
      admin: superadmin.id,
      action: status === 'verified' ? 'profile_verified' : 'profile_rejected',
      previousStatus,
      newStatus: status,
      reason: remarks || (status === 'verified' ? 'All documents and business details verified' : 'Profile verification rejected'),
    });

    return NextResponse.json({
      ok: true,
      message: `Seller profile status updated to ${status}.`,
      seller: {
        id: String(seller._id),
        profileVerificationStatus: seller.profileVerificationStatus,
        verificationRemarks: seller.verificationRemarks,
      },
    });
  } catch (err) {
    console.error('Verify seller profile error:', err);
    return NextResponse.json({ error: 'Failed to update profile verification status.' }, { status: 500 });
  }
}

export const PATCH = requireSuperAdmin(handleProfileVerify);
export const POST = requireSuperAdmin(handleProfileVerify);

