export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { dbConnect } from '@/lib/mongodb';
import Admin from '@/models/Admin';
import SellerBusinessProfile from '@/models/SellerBusinessProfile';
import {
  validatePhone,
  validateGSTIN,
  validatePincode,
  validateFSSAI,
  isFoodCategory,
} from '@/lib/sellerValidation';

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/;

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json().catch(() => ({}));

    const fullName = String(body.fullName || body.name || '').trim();
    const email = String(body.email || '').toLowerCase().trim();
    const password = String(body.password || '');
    const businessName = String(body.businessName || '').trim();
    const businessPhone = String(body.businessPhone || '').trim();
    const whatsappNumber = String(body.whatsappNumber || body.businessPhone || '').trim();
    const shopAddress = String(body.shopAddress || body.businessAddress || '').trim();
    const gstNumber = String(body.gstNumber || '').toUpperCase().trim();
    const category = String(body.category || body.businessCategory || '').trim();
    const fssaiNumber = String(body.fssaiNumber || '').trim();

    // 1. Full Name
    if (!fullName) {
      return NextResponse.json({ error: 'Full name is required.' }, { status: 400 });
    }

    // 2. Email
    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    // 3. Password
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    // 4. Business Name
    if (!businessName) {
      return NextResponse.json({ error: 'Business / Shop name is required.' }, { status: 400 });
    }

    // 5. Phone Validation (Feature 8)
    const phoneErr = validatePhone(businessPhone);
    if (phoneErr) {
      return NextResponse.json({ error: phoneErr }, { status: 400 });
    }
    const cleanPhone = businessPhone.replace(/\s+/g, '').replace(/^(\+91|91)/, '');

    // Optional WhatsApp Phone Validation
    if (whatsappNumber) {
      const waErr = validatePhone(whatsappNumber);
      if (waErr) {
        return NextResponse.json({ error: `WhatsApp: ${waErr}` }, { status: 400 });
      }
    }
    const cleanWhatsApp = whatsappNumber
      ? whatsappNumber.replace(/\s+/g, '').replace(/^(\+91|91)/, '')
      : cleanPhone;

    // 6. Shop Address
    if (!shopAddress) {
      return NextResponse.json({ error: 'Shop / Business address is required.' }, { status: 400 });
    }

    // 7. GSTIN Validation (Feature 8)
    if (gstNumber) {
      const gstErr = validateGSTIN(gstNumber);
      if (gstErr) {
        return NextResponse.json({ error: gstErr }, { status: 400 });
      }
    }

    // 8. FSSAI Validation for Food Categories (Feature 8)
    const fssaiErr = validateFSSAI(fssaiNumber, category);
    if (fssaiErr) {
      return NextResponse.json({ error: fssaiErr }, { status: 400 });
    }

    // Check duplicate email
    const existingEmail = await Admin.findOne({ email });
    if (existingEmail) {
      return NextResponse.json(
        { error: 'An account with this email address is already registered.' },
        { status: 409 }
      );
    }

    // Check duplicate phone
    const existingPhone = await Admin.findOne({
      businessPhone: cleanPhone,
    });
    if (existingPhone) {
      return NextResponse.json(
        { error: 'A seller with this phone number is already registered.' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create Seller record
    const seller = await Admin.create({
      name: fullName,
      email,
      passwordHash,
      role: 'seller',
      status: 'pending',
      businessName,
      businessPhone: cleanPhone,
      whatsappNumber: cleanWhatsApp,
      businessAddress: shopAddress,
      shopAddress,
      gstNumber,
      profileVerificationStatus: 'not_submitted',
      profileCompletion: 25,
    });

    // Initialize SellerBusinessProfile
    await SellerBusinessProfile.create({
      seller: seller._id,
      category,
      fssaiNumber: fssaiNumber || '',
      pickupAddress: {
        doorNo: '',
        street: shopAddress,
        city: '',
        state: '',
        pincode: '',
        country: 'India',
        contactPhone: cleanPhone,
      },
      returnAddress: {
        doorNo: '',
        street: shopAddress,
        city: '',
        state: '',
        pincode: '',
        country: 'India',
        contactPhone: cleanPhone,
        sameAsPickup: true,
      },
      completionPercentage: 25,
    });

    return NextResponse.json(
      {
        ok: true,
        message:
          'Seller registered successfully! Your merchant account is under administrative review.',
        seller: {
          id: String(seller._id),
          name: seller.name,
          email: seller.email,
          businessName: seller.businessName,
          status: seller.status,
          createdAt: seller.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('POST /api/seller/register error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error while processing registration.' },
      { status: 500 }
    );
  }
}
