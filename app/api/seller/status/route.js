export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/auth';
import { dbConnect } from '@/lib/mongodb';
import Admin from '@/models/Admin';

export async function GET(req) {
  try {
    const tokenAdmin = getAdminFromRequest(req);
    if (!tokenAdmin) {
      return NextResponse.json({ authenticated: false, status: 'unauthenticated' }, { status: 401 });
    }

    await dbConnect();
    const seller = await Admin.findById(tokenAdmin.id)
      .select('name email role status businessName rejectionReason suspensionReason profileVerificationStatus profileCompletion')
      .lean();

    if (!seller) {
      return NextResponse.json({ authenticated: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      authenticated: true,
      seller: {
        id: String(seller._id),
        name: seller.name,
        email: seller.email,
        role: seller.role,
        status: seller.role === 'superadmin' ? 'approved' : seller.status,
        businessName: seller.businessName,
        rejectionReason: seller.rejectionReason || '',
        suspensionReason: seller.suspensionReason || '',
        profileVerificationStatus: seller.profileVerificationStatus || 'not_submitted',
        profileCompletion: seller.profileCompletion || 0,
      },
    });
  } catch (err) {
    console.error('GET /api/seller/status error:', err);
    return NextResponse.json({ error: 'Server error checking status' }, { status: 500 });
  }
}

