export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/mongodb';
import Admin from '@/models/Admin';
import SellerBusinessProfile from '@/models/SellerBusinessProfile';
import Product from '@/models/Product';
import Order from '@/models/Order';
import Review from '@/models/Review';

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function GET(req, { params }) {
  try {
    await dbConnect();
    const { sellerSlug } = await params;
    if (!sellerSlug) {
      return NextResponse.json({ error: 'Seller identifier is required' }, { status: 400 });
    }

    // Try finding by sellerSlug, or by _id if valid ObjectId, or regex match on businessName
    let seller = null;
    if (mongoose.isValidObjectId(sellerSlug)) {
      seller = await Admin.findOne({ _id: sellerSlug, role: 'seller' }).lean();
    }
    if (!seller) {
      seller = await Admin.findOne({
        role: 'seller',
        sellerSlug: sellerSlug.toLowerCase(),
      }).lean();
    }
    if (!seller) {
      // Fallback search by regex match on businessName
      const regex = new RegExp(`^${sellerSlug.replace(/-/g, ' ')}$`, 'i');
      seller = await Admin.findOne({ role: 'seller', businessName: regex }).lean();
    }

    if (!seller) {
      return NextResponse.json({ error: 'Seller not found or inactive' }, { status: 404 });
    }

    // Fetch seller business profile
    const profile =
      (await SellerBusinessProfile.findOne({ seller: seller._id }).lean()) || {};

    // Dynamic stats from real MongoDB collections
    const [totalProducts, totalOrders, sellerProducts] = await Promise.all([
      Product.countDocuments({ seller: seller._id, isActive: true }),
      Order.countDocuments({ 'items.seller': seller._id }),
      Product.find({ seller: seller._id, isActive: true }).select('_id category').populate('category', 'name').lean(),
    ]);

    // Unique product categories
    const categoriesSet = new Set();
    sellerProducts.forEach((p) => {
      if (p.category?.name) categoriesSet.add(p.category.name);
    });
    const productCategories =
      profile.productCategories?.length > 0
        ? profile.productCategories
        : Array.from(categoriesSet);

    // Reviews and rating
    const productIds = sellerProducts.map((p) => p._id);
    const reviews = await Review.find({ product: { $in: productIds } }).select('rating').lean();
    const reviewCount = reviews.length;
    const storeRating =
      reviewCount > 0
        ? Number((reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / reviewCount).toFixed(1))
        : Number(profile.rating || 4.8);

    // Years in business
    const estYear = Number(profile.yearOfEstablishment || 2020);
    const currentYear = new Date().getFullYear();
    const yearsInBusiness = Math.max(1, currentYear - estYear);

    // Location formatting from pickupAddress or shopAddress
    const city = profile.pickupAddress?.city || seller.shopAddress?.split(',')[0] || 'Chennai';
    const state = profile.pickupAddress?.state || 'Tamil Nadu';
    const shopLocation = `${city}, ${state}`;

    // Sanitized public store profile — no sensitive bank or private credentials
    const storeData = {
      _id: seller._id,
      sellerSlug: seller.sellerSlug || slugify(seller.businessName || seller.name),
      businessName: seller.businessName || seller.name || 'Merchant Store',
      shopLogo: profile.logo || '/images/store-placeholder.png',
      shopBanner: profile.banner || '',
      shopLocation,
      city,
      state,
      yearOfEstablishment: estYear,
      yearsInBusiness,
      businessCategory: profile.category || profile.businessCategory || 'Gourmet & Snacks',
      businessDescription:
        profile.description ||
        `Authentic gourmet and snack manufacturer crafting premium traditional delicacies with pure ingredients.`,
      productCategories,
      rating: storeRating,
      reviewCount,
      responseTime: profile.responseTime || 'Within 2 Hours',
      onTimeDispatchRate: profile.onTimeDispatchRate ?? 98,
      reorderRate: profile.reorderRate ?? 28,
      totalOrders,
      totalProducts,
      verificationStatus: seller.status === 'approved' ? 'verified' : seller.profileVerificationStatus || 'pending',
      isVerifiedMerchant: seller.status === 'approved',
    };

    return NextResponse.json({ success: true, store: storeData });
  } catch (err) {
    console.error('GET /api/stores/[sellerSlug] error:', err);
    return NextResponse.json({ error: err.message || 'Failed to load store profile' }, { status: 500 });
  }
}

