export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/auth';
import { dbConnect } from '@/lib/mongodb';
import Admin from '@/models/Admin';
import SellerBusinessProfile from '@/models/SellerBusinessProfile';
import SellerDocument from '@/models/SellerDocument';
import {
  validatePhone,
  validateGSTIN,
  validatePincode,
  validateBankAccount,
  validateIFSC,
  validateFSSAI,
  isFoodCategory,
} from '@/lib/sellerValidation';

function calculateCompletion(seller, profile, docsCount = 0) {
  let score = 0;
  // 1. Basic business info (25%)
  if (seller.name) score += 5;
  if (seller.email) score += 5;
  if (seller.businessName) score += 5;
  if (seller.businessPhone) score += 5;
  if (seller.businessAddress || seller.shopAddress) score += 5;

  // 2. Profile description, category & FSSAI (15%)
  if (profile?.description && profile.description.length >= 20) score += 5;
  if (profile?.category) score += 5;
  if (profile?.fssaiNumber || !isFoodCategory(profile?.category)) score += 5;

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
  if (docsCount >= 3) {
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

    // --- Strict Validations (Feature 8) ---
    // 1. Phone validation
    if (body.businessPhone) {
      const phoneErr = validatePhone(body.businessPhone);
      if (phoneErr) return NextResponse.json({ error: phoneErr }, { status: 400 });
    }
    if (body.whatsappNumber) {
      const waErr = validatePhone(body.whatsappNumber);
      if (waErr) return NextResponse.json({ error: `WhatsApp: ${waErr}` }, { status: 400 });
    }

    // 2. GSTIN validation
    if (body.gstNumber) {
      const gstErr = validateGSTIN(body.gstNumber);
      if (gstErr) return NextResponse.json({ error: gstErr }, { status: 400 });
    }

    // 3. Pincode validation
    if (body.pickupAddress?.pincode) {
      const pinErr = validatePincode(body.pickupAddress.pincode);
      if (pinErr) return NextResponse.json({ error: `Pickup Pincode: ${pinErr}` }, { status: 400 });
    }
    if (body.returnAddress?.pincode && !body.returnAddress?.sameAsPickup) {
      const pinErr = validatePincode(body.returnAddress.pincode);
      if (pinErr) return NextResponse.json({ error: `Return Pincode: ${pinErr}` }, { status: 400 });
    }

    // 4. Bank account & IFSC validation
    if (body.bankDetails) {
      if (body.bankDetails.accountNumber) {
        const bankErr = validateBankAccount(
          body.bankDetails.accountNumber,
          body.bankDetails.confirmAccountNumber
        );
        if (bankErr) return NextResponse.json({ error: bankErr }, { status: 400 });
      }
      if (body.bankDetails.ifscCode) {
        const ifscErr = validateIFSC(body.bankDetails.ifscCode);
        if (ifscErr) return NextResponse.json({ error: ifscErr }, { status: 400 });
      }
    }

    // 5. FSSAI validation for food categories
    const category = body.category || '';
    if (body.fssaiNumber || isFoodCategory(category)) {
      const fssaiErr = validateFSSAI(body.fssaiNumber, category);
      if (fssaiErr) return NextResponse.json({ error: fssaiErr }, { status: 400 });
    }

    // Update basic seller info in Admin
    const sellerUpdate = {};
    if (body.name !== undefined) sellerUpdate.name = String(body.name).trim();
    if (body.businessName !== undefined) sellerUpdate.businessName = String(body.businessName).trim();
    if (body.businessPhone !== undefined) {
      sellerUpdate.businessPhone = String(body.businessPhone).replace(/\s+/g, '').replace(/^(\+91|91)/, '');
    }
    if (body.whatsappNumber !== undefined) {
      sellerUpdate.whatsappNumber = String(body.whatsappNumber).replace(/\s+/g, '').replace(/^(\+91|91)/, '');
    }
    if (body.shopAddress !== undefined) {
      sellerUpdate.shopAddress = String(body.shopAddress).trim();
      sellerUpdate.businessAddress = String(body.shopAddress).trim();
    }
    if (body.gstNumber !== undefined) {
      sellerUpdate.gstNumber = String(body.gstNumber).toUpperCase().trim();
    }

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
    if (body.fssaiNumber !== undefined) profileUpdate.fssaiNumber = String(body.fssaiNumber).trim();
    if (body.panNumber !== undefined) profileUpdate.panNumber = String(body.panNumber).toUpperCase().trim();
    if (body.website !== undefined) profileUpdate.website = String(body.website).trim();

    // Delivery charges (Feature 11)
    if (body.deliveryCharge !== undefined) profileUpdate.deliveryCharge = Number(body.deliveryCharge) || 0;
    if (body.freeDeliveryThreshold !== undefined) profileUpdate.freeDeliveryThreshold = Number(body.freeDeliveryThreshold) || 0;
    if (body.minOrderValue !== undefined) profileUpdate.minOrderValue = Number(body.minOrderValue) || 0;

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
      message: 'Seller profile saved successfully with verified standards.',
      seller: { ...seller, profileCompletion: completion },
      profile,
      completion,
    });
  } catch (err) {
    console.error('PUT /api/seller/profile error:', err);
    return NextResponse.json({ error: err.message || 'Failed to update seller profile.' }, { status: 500 });
  }
}
