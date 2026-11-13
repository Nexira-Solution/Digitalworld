export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Settings from '@/models/Settings';

// Pincode prefix to major Indian cities/states mapping
const PINCODE_MAP = [
  { prefix: '600', city: 'Chennai', state: 'Tamil Nadu', minDays: 3, maxDays: 4 },
  { prefix: '601', city: 'Tiruvallur', state: 'Tamil Nadu', minDays: 3, maxDays: 4 },
  { prefix: '602', city: 'Kanchipuram', state: 'Tamil Nadu', minDays: 3, maxDays: 4 },
  { prefix: '603', city: 'Chengalpattu', state: 'Tamil Nadu', minDays: 3, maxDays: 4 },
  { prefix: '641', city: 'Coimbatore', state: 'Tamil Nadu', minDays: 3, maxDays: 4 },
  { prefix: '625', city: 'Madurai', state: 'Tamil Nadu', minDays: 3, maxDays: 4 },
  { prefix: '620', city: 'Tiruchirappalli', state: 'Tamil Nadu', minDays: 3, maxDays: 4 },
  { prefix: '636', city: 'Salem', state: 'Tamil Nadu', minDays: 3, maxDays: 4 },
  { prefix: '638', city: 'Erode', state: 'Tamil Nadu', minDays: 3, maxDays: 4 },
  { prefix: '627', city: 'Tirunelveli', state: 'Tamil Nadu', minDays: 4, maxDays: 5 },
  { prefix: '629', city: 'Kanyakumari', state: 'Tamil Nadu', minDays: 4, maxDays: 5 },
  { prefix: '682', city: 'Kochi', state: 'Kerala', minDays: 4, maxDays: 5 },
  { prefix: '695', city: 'Thiruvananthapuram', state: 'Kerala', minDays: 4, maxDays: 5 },
  { prefix: '673', city: 'Kozhikode', state: 'Kerala', minDays: 4, maxDays: 5 },
  { prefix: '560', city: 'Bengaluru', state: 'Karnataka', minDays: 4, maxDays: 5 },
  { prefix: '500', city: 'Hyderabad', state: 'Telangana', minDays: 4, maxDays: 5 },
  { prefix: '400', city: 'Mumbai', state: 'Maharashtra', minDays: 5, maxDays: 6 },
  { prefix: '411', city: 'Pune', state: 'Maharashtra', minDays: 5, maxDays: 6 },
  { prefix: '110', city: 'New Delhi', state: 'Delhi', minDays: 5, maxDays: 6 },
  { prefix: '700', city: 'Kolkata', state: 'West Bengal', minDays: 5, maxDays: 6 },
  { prefix: '380', city: 'Ahmedabad', state: 'Gujarat', minDays: 5, maxDays: 6 },
  { prefix: '302', city: 'Jaipur', state: 'Rajasthan', minDays: 5, maxDays: 6 },
];

function resolveLocation(pincode) {
  const pin = String(pincode || '').trim();
  const match = PINCODE_MAP.find((m) => pin.startsWith(m.prefix));
  if (match) return match;

  const firstDigit = pin[0];
  switch (firstDigit) {
    case '6':
      return { city: 'Tamil Nadu / Kerala', state: 'South Region', minDays: 4, maxDays: 5 };
    case '5':
      return { city: 'Karnataka / AP / Telangana', state: 'South Region', minDays: 4, maxDays: 5 };
    case '4':
      return { city: 'Maharashtra / Goa', state: 'West Region', minDays: 5, maxDays: 6 };
    case '3':
      return { city: 'Gujarat / Rajasthan', state: 'West Region', minDays: 5, maxDays: 6 };
    case '1':
    case '2':
      return { city: 'Delhi / NCR / North India', state: 'North Region', minDays: 5, maxDays: 6 };
    case '7':
    case '8':
      return { city: 'East & North-East India', state: 'East Region', minDays: 6, maxDays: 7 };
    default:
      return { city: 'India', state: 'All India', minDays: 5, maxDays: 6 };
  }
}

function formatDateRange(minDays, maxDays) {
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + minDays);

  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + maxDays);

  const formatShort = (d) =>
    d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  return `${formatShort(minDate)} - ${formatShort(maxDate)}`;
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
    // Rule: Free shipping on subtotal STRICTLY greater than Rs. 499
    const freeDeliveryAbove =
      settings?.freeShippingThreshold || settings?.freeShippingAbove || 499;
    const shippingCharge =
      settings?.defaultShippingCharge || settings?.flatShippingRate || 49;

    const minDays = loc.minDays || 5;
    const maxDays = loc.maxDays || 6;
    const estimatedRange = `${minDays}-${maxDays} days`;
    const formattedDateRange = formatDateRange(minDays, maxDays);

    return NextResponse.json({
      success: true,
      pincode: rawPin,
      city,
      state,
      minDays,
      maxDays,
      estimatedRange,
      estimatedDays: maxDays,
      formattedDate: formattedDateRange,
      formattedDateRange,
      freeDeliveryAbove,
      shippingCharge,
      isCodAvailable: true,
      isDeliverable: true,
      message: `Delivery available to ${city}, ${state} in ${estimatedRange}`,
    });
  } catch (err) {
    console.error('POST /api/delivery/check error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to verify delivery address' },
      { status: 500 }
    );
  }
}
