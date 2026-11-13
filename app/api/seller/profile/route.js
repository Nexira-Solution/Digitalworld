export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/auth';
import { dbConnect } from '@/lib/mongodb';
import Admin from '@/models/Admin';
import SellerBusinessProfile from '@/models/SellerBusinessProfile';
import SellerDocument from '@/models/SellerDocument';

function calculateCompletion(seller, profile, docsCount = 0) {
  let score = 0;
  // 1. Basic business info (25%)
  if (seller.name) score += 5;
  if (seller.email) score += 5;
  if (seller.businessName) score += 5;
  if (seller.businessPhone) score += 5;
  if (seller.businessAddress || seller.shopAddress) score += 5;

  // 2. Profile description & category (15%)
  if (profile?.description && profile.description.length >= 20) score += 10;
  if (profile?.category) score += 5;

  // 3. Pickup address (20%)
  const pickup = profile?.pickupAddress;
  if (pickup?.street && pickup?.city && pickup?.state && pickup?.pincode) {
    score += 20;
  } else if (pickup?.city || pickup?.pincode) {
    score += 10;
  }

  // 4. Bank details (25%)
  const bank = profile?.bankDetails;
  if (bank?.accountHolderName && bank?.bankName && bank?.accountNumber && bank?.ifscCode) {
    score += 25;
  } else if (bank?.accountNumber || bank?.ifscCode) {
    score += 10;
  }

  // 5. Verification documents uploaded (15%)
  if (docsCount >= 2) {
    score += 15;
  } else if (docsCount >= 1) {
    score += 10;
  }

  return Math.min(100, Math.max(0, score));
}

export async function GET(req) {
  try {
    const tokenAdmin = getAdminFromRequest(req);
    if (!tokenAdmin) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    await dbConnect();
    const seller = await Admin.findById(tokenAdmin.id).select('-passwordHash').lean();
    if (!seller) {
      return NextResponse.json({ error: 'Seller account not found.' }, { status: 404 });
    }

    let profile = await SellerBusinessProfile.findOne({ seller: seller._id }).lean();
    if (!profile) {
      profile = await SellerBusinessProfile.create({
        seller: seller._id,
        pickupAddress: {
          doorNo: '',
          street: seller.shopAddress || seller.businessAddress || '',
          city: '',
          state: '',
          pincode: '',
          country: 'India',
          contactPhone: seller.businessPhone || '',
        },
        returnAddress: {
          doorNo: '',
          street: seller.shopAddress || seller.businessAddress || '',
          city: '',
          state: '',
          pincode: '',
          country: 'India',
          contactPhone: seller.businessPhone || '',
          sameAsPickup: true,
        },
      });
      profile = profile.toObject();
    }

    const documents = await SellerDocument.find({ seller: seller._id }).sort({ createdAt: -1 }).lean();
    const completion = calculateCompletion(seller, profile, documents.length);

    if (seller.profileCompletion !== completion) {
      await Admin.updateOne({ _id: seller._id }, { $set: { profileCompletion: completion } });
    }

    return NextResponse.json({
      seller: { ...seller, profileCompletion: completion },
      profile,
      documents,
      completion,
    });
  } catch (err) {
    console.error('GET /api/seller/profile error:', err);
    return NextResponse.json({ error: 'Failed to load seller profile.' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const tokenAdmin = getAdminFromRequest(req);
    if (!tokenAdmin) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json().catch(() => ({}));

    // Update basic seller info in Admin
    const sellerUpdate = {};
    if (body.name !== undefined) sellerUpdate.name = String(body.name).trim();
    if (body.businessName !== undefined) sellerUpdate.businessName = String(body.businessName).trim();
    if (body.businessPhone !== undefined) sellerUpdate.businessPhone = String(body.businessPhone).trim();
    if (body.whatsappNumber !== undefined) sellerUpdate.whatsappNumber = String(body.whatsappNumber).trim();
    if (body.shopAddress !== undefined) {
      sellerUpdate.shopAddress = String(body.shopAddress).trim();
      sellerUpdate.businessAddress = String(body.shopAddress).trim();
    }
    if (body.gstNumber !== undefined) sellerUpdate.gstNumber = String(body.gstNumber).toUpperCase().trim();

    const seller = await Admin.findByIdAndUpdate(tokenAdmin.id, { $set: sellerUpdate }, { new: true })
      .select('-passwordHash')
      .lean();

    if (!seller) {
      return NextResponse.json({ error: 'Seller not found.' }, { status: 404 });
    }

    // Update SellerBusinessProfile
    const profileUpdate = {};
    if (body.description !== undefined) profileUpdate.description = String(body.description).trim();
    if (body.category !== undefined) profileUpdate.category = String(body.category).trim();
    if (body.website !== undefined) profileUpdate.website = String(body.website).trim();
    if (body.socialLinks) {
      profileUpdate.socialLinks = {
        instagram: String(body.socialLinks.instagram || '').trim(),
        whatsapp: String(body.socialLinks.whatsapp || '').trim(),
        facebook: String(body.socialLinks.facebook || '').trim(),
      };
    }
    if (body.pickupAddress) {
      profileUpdate.pickupAddress = {
        doorNo: String(body.pickupAddress.doorNo || '').trim(),
        street: String(body.pickupAddress.street || '').trim(),
        city: String(body.pickupAddress.city || '').trim(),
        state: String(body.pickupAddress.state || '').trim(),
        pincode: String(body.pickupAddress.pincode || '').trim(),
        country: String(body.pickupAddress.country || 'India').trim(),
        contactPhone: String(body.pickupAddress.contactPhone || seller.businessPhone || '').trim(),
      };
    }
    if (body.returnAddress) {
      profileUpdate.returnAddress = {
        doorNo: String(body.returnAddress.doorNo || '').trim(),
        street: String(body.returnAddress.street || '').trim(),
        city: String(body.returnAddress.city || '').trim(),
        state: String(body.returnAddress.state || '').trim(),
        pincode: String(body.returnAddress.pincode || '').trim(),
        country: String(body.returnAddress.country || 'India').trim(),
        contactPhone: String(body.returnAddress.contactPhone || '').trim(),
        sameAsPickup: Boolean(body.returnAddress.sameAsPickup),
      };
    }
    if (body.bankDetails) {
      profileUpdate.bankDetails = {
        accountHolderName: String(body.bankDetails.accountHolderName || '').trim(),
        bankName: String(body.bankDetails.bankName || '').trim(),
        accountNumber: String(body.bankDetails.accountNumber || '').trim(),
        ifscCode: String(body.bankDetails.ifscCode || '').toUpperCase().trim(),
        accountType: body.bankDetails.accountType === 'Savings' ? 'Savings' : 'Current',
      };
    }

    const docsCount = await SellerDocument.countDocuments({ seller: seller._id });
    const completion = calculateCompletion(seller, { ...profileUpdate }, docsCount);
    profileUpdate.completionPercentage = completion;

    const profile = await SellerBusinessProfile.findOneAndUpdate(
      { seller: seller._id },
      { $set: profileUpdate },
      { new: true, upsert: true }
    ).lean();

    await Admin.updateOne({ _id: seller._id }, { $set: { profileCompletion: completion } });

    return NextResponse.json({
      ok: true,
      message: 'Seller profile saved successfully.',
      seller: { ...seller, profileCompletion: completion },
      profile,
      completion,
    });
  } catch (err) {
    console.error('PUT /api/seller/profile error:', err);
    return NextResponse.json({ error: 'Failed to update seller profile.' }, { status: 500 });
  }
}

