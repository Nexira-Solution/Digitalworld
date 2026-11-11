export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Settings from '@/models/Settings';

// Pincode prefix to major Indian cities/states mapping
const PINCODE_MAP = [
  { prefix: '600', city: 'Chennai', state: 'Tamil Nadu', days: 1 },
  { prefix: '601', city: 'Tiruvallur', state: 'Tamil Nadu', days: 1 },
  { prefix: '602', city: 'Kanchipuram', state: 'Tamil Nadu', days: 1 },
  { prefix: '603', city: 'Chengalpattu', state: 'Tamil Nadu', days: 1 },
  { prefix: '641', city: 'Coimbatore', state: 'Tamil Nadu', days: 1 },
  { prefix: '625', city: 'Madurai', state: 'Tamil Nadu', days: 1 },
  { prefix: '620', city: 'Tiruchirappalli', state: 'Tamil Nadu', days: 1 },
  { prefix: '636', city: 'Salem', state: 'Tamil Nadu', days: 1 },
  { prefix: '638', city: 'Erode', state: 'Tamil Nadu', days: 1 },
  { prefix: '627', city: 'Tirunelveli', state: 'Tamil Nadu', days: 2 },
  { prefix: '629', city: 'Kanyakumari', state: 'Tamil Nadu', days: 2 },
  { prefix: '682', city: 'Kochi', state: 'Kerala', days: 1 },
  { prefix: '695', city: 'Thiruvananthapuram', state: 'Kerala', days: 2 },
  { prefix: '673', city: 'Kozhikode', state: 'Kerala', days: 2 },
  { prefix: '680', city: 'Thrissur', state: 'Kerala', days: 2 },
  { prefix: '560', city: 'Bengaluru', state: 'Karnataka', days: 2 },
  { prefix: '570', city: 'Mysuru', state: 'Karnataka', days: 2 },
  { prefix: '500', city: 'Hyderabad', state: 'Telangana', days: 2 },
  { prefix: '400', city: 'Mumbai', state: 'Maharashtra', days: 2 },
  { prefix: '411', city: 'Pune', state: 'Maharashtra', days: 2 },
  { prefix: '110', city: 'New Delhi', state: 'Delhi', days: 2 },
  { prefix: '700', city: 'Kolkata', state: 'West Bengal', days: 3 },
  { prefix: '380', city: 'Ahmedabad', state: 'Gujarat', days: 3 },
  { prefix: '302', city: 'Jaipur', state: 'Rajasthan', days: 3 },
];

function resolveLocation(pincode) {
  const pin = String(pincode || '').trim();
  const match = PINCODE_MAP.find((m) => pin.startsWith(m.prefix));
  if (match) return match;

  const firstDigit = pin[0];
  switch (firstDigit) {
    case '6':
      return { city: 'South Region', state: 'Tamil Nadu / Kerala', days: 2 };
    case '5':
      return { city: 'South Region', state: 'Karnataka / AP / Telangana', days: 2 };
    case '4':
      return { city: 'West Region', state: 'Maharashtra / Goa', days: 3 };
    case '3':
      return { city: 'West Region', state: 'Gujarat / Rajasthan', days: 3 };
    case '1':
    case '2':
      return { city: 'North Region', state: 'Delhi / NCR / North India', days: 3 };
    case '7':
    case '8':
      return { city: 'East Region', state: 'East India', days: 4 };
    default:
      return { city: 'India', state: 'India', days: 3 };
  }
}

function calculateEstimatedDate(days) {
  const target = new Date();
  target.setDate(target.getDate() + days);
  return target.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const rawPin = String(body.pincode || '').trim();

    if (!/^\d{6}$/.test(rawPin)) {
      return NextResponse.json(
        { error: 'Please enter a valid 6-digit Indian postal pincode' },
        { status: 400 }
      );
    }

    const loc = resolveLocation(rawPin);
    const city = body.city ? String(body.city).trim() : loc.city;
    const state = body.state ? String(body.state).trim() : loc.state;

    // Fetch dynamic store shipping settings
    const settings = await Settings.findOne({ key: 'global' }).lean();
    const freeDeliveryAbove =
      settings?.freeShippingThreshold || settings?.freeShippingAbove || 499;
    const shippingCharge =
      settings?.defaultShippingCharge || settings?.flatShippingRate || 49;

    const days = loc.days || 2;
    const formattedDate = calculateEstimatedDate(days);

    return NextResponse.json({
      success: true,
      pincode: rawPin,
      city,
      state,
      estimatedDays: days,
      formattedDate,
      freeDeliveryAbove,
      shippingCharge,
      isCodAvailable: true,
      message: `Delivery available to ${city}, ${state}`,
    });
  } catch (err) {
    console.error('POST /api/delivery/check error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to verify delivery address' },
      { status: 500 }
    );
  }
}

