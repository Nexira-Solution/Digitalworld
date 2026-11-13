export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { dbConnect } from '@/lib/mongodb';
import Admin from '@/models/Admin';
import SellerBusinessProfile from '@/models/SellerBusinessProfile';

// Email validation regex (RFC 5322 standard compliant)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/;
// Indian Phone / Mobile validation (10 digits, optionally starting with +91)
const PHONE_REGEX = /^(?:\+91|91)?[6-9]\d{9}$/;
// Indian GSTIN regex (15 alphanumeric characters)
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json().catch(() => ({}));

    const fullName = String(body.fullName || body.name || '').trim();
    const email = String(body.email || '').toLowerCase().trim();
    const password = String(body.password || '');
    const businessName = String(body.businessName || '').trim();
    const businessPhone = String(body.businessPhone || '').replace(/\s+/g, '');
    const whatsappNumber = String(body.whatsappNumber || body.businessPhone || '').replace(/\s+/g, '');
    const shopAddress = String(body.shopAddress || body.businessAddress || '').trim();
    const gstNumber = String(body.gstNumber || '').toUpperCase().trim();

    // 1. Validate required fields
    if (!fullName) {
      return NextResponse.json({ error: 'Full name is required.' }, { status: 400 });
    }
    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }
    if (!businessName) {
      return NextResponse.json({ error: 'Business / Shop name is required.' }, { status: 400 });
    }
    if (!businessPhone || !PHONE_REGEX.test(businessPhone)) {
      return NextResponse.json(
        { error: 'Please enter a valid 10-digit Indian mobile number for Business Phone.' },
        { status: 400 }
      );
    }
    if (whatsappNumber && !PHONE_REGEX.test(whatsappNumber)) {
      return NextResponse.json(
        { error: 'Please enter a valid 10-digit mobile number for WhatsApp.' },
        { status: 400 }
      );
    }
    if (!shopAddress) {
      return NextResponse.json({ error: 'Shop / Business address is required.' }, { status: 400 });
    }
    if (gstNumber && !GSTIN_REGEX.test(gstNumber)) {
      return NextResponse.json(
        { error: 'Invalid GSTIN format. Expected 15 characters (e.g. 22AAAAA0000A1Z5).' },
        { status: 400 }
      );
    }

    // 2. Prevent duplicate accounts (Check email)
    const existingEmail = await Admin.findOne({ email });
    if (existingEmail) {
      return NextResponse.json(
        { error: 'An account with this email address is already registered.' },
        { status: 409 }
      );
    }

    // Check duplicate business phone if provided
    const cleanPhone = businessPhone.replace(/^(\+91|91)/, '');
    const existingPhone = await Admin.findOne({
      businessPhone: { $regex: cleanPhone + '$' },
    });
    if (existingPhone) {
      return NextResponse.json(
        { error: 'A seller with this phone number is already registered.' },
        { status: 409 }
      );
    }

    // 3. Hash password securely
    const passwordHash = await bcrypt.hash(password, 10);

    // 4. Create Seller in MongoDB with status: 'pending'
    const seller = await Admin.create({
      name: fullName,
      email,
      passwordHash,
      role: 'seller',
      status: 'pending',
      businessName,
      businessPhone: cleanPhone,
      whatsappNumber: whatsappNumber.replace(/^(\+91|91)/, ''),
      businessAddress: shopAddress,
      shopAddress,
      gstNumber,
      profileVerificationStatus: 'not_submitted',
      profileCompletion: 25, // Basic details registered
    });

    // 5. Initialize SellerBusinessProfile
    await SellerBusinessProfile.create({
      seller: seller._id,
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
          'Your seller registration has been submitted successfully! Your application is under admin review.',
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

