export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/auth';
import { dbConnect } from '@/lib/mongodb';
import Admin from '@/models/Admin';
import SellerBusinessProfile from '@/models/SellerBusinessProfile';
import SellerDocument from '@/models/SellerDocument';

export async function POST(req) {
  try {
    const tokenAdmin = getAdminFromRequest(req);
    if (!tokenAdmin) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    await dbConnect();
    const seller = await Admin.findById(tokenAdmin.id);
    if (!seller) {
      return NextResponse.json({ error: 'Seller account not found.' }, { status: 404 });
    }

    const profile = await SellerBusinessProfile.findOne({ seller: seller._id });
    if (!profile) {
      return NextResponse.json(
        { error: 'Please fill out your business profile details before submitting.' },
        { status: 400 }
      );
    }

    // 1. Validation checks
    const missing = [];
    if (!profile.pickupAddress?.street || !profile.pickupAddress?.city || !profile.pickupAddress?.pincode) {
      missing.push('Pickup Address');
    }
    if (!profile.bankDetails?.accountNumber || !profile.bankDetails?.ifscCode) {
      missing.push('Bank Account & IFSC code');
    }

    const docsCount = await SellerDocument.countDocuments({ seller: seller._id });
    if (docsCount === 0) {
      missing.push('At least one business verification document (GST, PAN, or Shop License)');
    }

    if (missing.length > 0) {
      return NextResponse.json(
        {
          error: `Please complete the following required sections before submitting: ${missing.join(', ')}.`,
        },
        { status: 400 }
      );
    }

    // Update status
    seller.profileVerificationStatus = 'in_review';
    await seller.save();

    profile.submittedForVerification = true;
    profile.submittedAt = new Date();
    await profile.save();

    return NextResponse.json({
      ok: true,
      message: 'Your profile and verification documents have been submitted for admin review.',
      seller: {
        id: String(seller._id),
        profileVerificationStatus: seller.profileVerificationStatus,
      },
    });
  } catch (err) {
    console.error('POST /api/seller/profile/submit error:', err);
    return NextResponse.json({ error: 'Failed to submit profile for review.' }, { status: 500 });
  }
}

