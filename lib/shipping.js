import mongoose from 'mongoose';
import SellerBusinessProfile from '@/models/SellerBusinessProfile';
import Admin from '@/models/Admin';
import Settings from '@/models/Settings';

/**
 * Standard Single-Store Shipping Calculator (Backward compatible)
 */
export function calculateShipping(settings, { subtotal, totalQty }) {
  const freeShippingAbove = Number(settings?.freeDeliveryThreshold ?? settings?.freeShippingAbove ?? 499);
  const defaultShippingCharge = Number(settings?.deliveryCharge ?? settings?.defaultShippingCharge ?? 49);

  const isFree = freeShippingAbove > 0 && Number(subtotal) >= freeShippingAbove;

  return {
    shippingCost: isFree ? 0 : defaultShippingCharge,
    freeShippingAbove,
    defaultShippingCharge,
  };
}

/**
 * Feature 11: Multi-Seller Delivery Fee Calculator
 * Groups cart items by supplier, calculates each supplier's delivery fee based on their
 * configured Delivery Charge and Free Delivery Threshold, and computes total delivery fee.
 */
export async function calculateMultiSellerDelivery(items = []) {
  if (!items.length) {
    return {
      totalDeliveryFee: 0,
      breakdown: [],
      hasItemsBelowMinOrder: false,
    };
  }

  // 1. Load Platform Global Delivery Settings
  const settings = (await Settings.findOne({ key: 'global' }).lean()) || {
    deliveryCharge: 49,
    freeDeliveryThreshold: 499,
    minOrderValue: 0,
    storeName: 'Digital World Official Store',
  };

  const platformCharge = Number(settings.deliveryCharge ?? 49);
  const platformThreshold = Number(settings.freeDeliveryThreshold ?? 499);
  const platformMinOrder = Number(settings.minOrderValue ?? 0);

  // 2. Group items by supplier ID ('platform' for admin/platform-owned items)
  const supplierGroups = {};

  items.forEach((item) => {
    const rawSeller = item.seller;
    const sellerKey = rawSeller && rawSeller !== 'null' && rawSeller !== 'undefined'
      ? String(rawSeller._id || rawSeller)
      : 'platform';

    if (!supplierGroups[sellerKey]) {
      supplierGroups[sellerKey] = {
        sellerKey,
        items: [],
        subtotal: 0,
      };
    }

    const itemPrice = Number(item.price || item.sellingPrice || 0);
    const itemQty = Number(item.qty || 1);
    supplierGroups[sellerKey].items.push(item);
    supplierGroups[sellerKey].subtotal += itemPrice * itemQty;
  });

  // 3. Resolve seller business profiles
  const sellerIds = Object.keys(supplierGroups).filter(
    (k) => k !== 'platform' && mongoose.isValidObjectId(k)
  );

  const [profiles, sellerAdmins] = await Promise.all([
    SellerBusinessProfile.find({ seller: { $in: sellerIds } }).lean(),
    Admin.find({ _id: { $in: sellerIds } }).select('businessName name sellerSlug').lean(),
  ]);

  const profileMap = new Map(profiles.map((p) => [String(p.seller), p]));
  const adminMap = new Map(sellerAdmins.map((a) => [String(a._id), a]));

  // 4. Calculate individual delivery fee per supplier
  let totalDeliveryFee = 0;
  let hasItemsBelowMinOrder = false;
  const breakdown = [];

  for (const key of Object.keys(supplierGroups)) {
    const group = supplierGroups[key];
    const isPlatform = key === 'platform';

    let supplierName = 'Digital World Official Store';
    let deliveryCharge = platformCharge;
    let freeThreshold = platformThreshold;
    let minOrderValue = platformMinOrder;

    if (!isPlatform) {
      const p = profileMap.get(key);
      const a = adminMap.get(key);
      supplierName = a?.businessName || a?.name || 'Partner Supplier';

      if (p) {
        deliveryCharge = p.deliveryCharge !== undefined ? Number(p.deliveryCharge) : platformCharge;
        freeThreshold = p.freeDeliveryThreshold !== undefined ? Number(p.freeDeliveryThreshold) : platformThreshold;
        minOrderValue = p.minOrderValue !== undefined ? Number(p.minOrderValue) : platformMinOrder;
      }
    }

    // Zero delivery fee (0) is a valid configured value
    const qualifiesForFree = freeThreshold > 0 && group.subtotal >= freeThreshold;
    const fee = qualifiesForFree ? 0 : Math.max(0, deliveryCharge);
    const isBelowMinOrder = minOrderValue > 0 && group.subtotal < minOrderValue;

    if (isBelowMinOrder) hasItemsBelowMinOrder = true;
    totalDeliveryFee += fee;

    breakdown.push({
      sellerId: isPlatform ? null : key,
      sellerName,
      isPlatform,
      subtotal: group.subtotal,
      deliveryFee: fee,
      deliveryCharge,
      freeThreshold,
      qualifiesForFree,
      minOrderValue,
      isBelowMinOrder,
      itemCount: group.items.length,
    });
  }

  return {
    totalDeliveryFee,
    breakdown,
    hasItemsBelowMinOrder,
  };
}
