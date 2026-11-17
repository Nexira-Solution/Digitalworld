export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/mongodb';
import Admin from '@/models/Admin';
import SellerBusinessProfile from '@/models/SellerBusinessProfile';
import Product from '@/models/Product';
import Order from '@/models/Order';
import Review from '@/models/Review';
import Banner from '@/models/Banner';
import Settings from '@/models/Settings';

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const PLATFORM_SLUGS = ['digital-world', 'mailoo-bazar', 'official', 'platform', 'admin'];

export async function GET(req, { params }) {
  try {
    await dbConnect();
    const { sellerSlug } = await params;
    if (!sellerSlug) {
      return NextResponse.json({ error: 'Seller identifier is required' }, { status: 400 });
    }

    const lowerSlug = sellerSlug.toLowerCase();
    const isPlatform = PLATFORM_SLUGS.includes(lowerSlug);

    // 1. Official Platform Storefront (Admin-owned products)
    if (isPlatform) {
      const [settings, superadmin, adminProducts, adminReviews] = await Promise.all([
        Settings.findOne({ key: 'global' }).lean(),
        Admin.findOne({ role: 'superadmin' }).select('name email businessName').lean(),
        Product.find({ seller: null, isActive: true }).select('_id category variants').populate('category', 'name').lean(),
        Review.find({ seller: null, isApproved: true }).select('rating').lean(),
      ]);

      const totalProducts = adminProducts.length;
      let inStockCount = 0;
      let outOfStockCount = 0;

      adminProducts.forEach((p) => {
        const hasStock = p.variants?.some((v) => v.sizes?.some((s) => Number(s.stock) > 0));
        if (hasStock) inStockCount++;
        else outOfStockCount++;
      });

      const categoriesSet = new Set();
      adminProducts.forEach((p) => {
        if (p.category?.name) categoriesSet.add(p.category.name);
      });

      const reviewCount = adminReviews.length;
      const storeRating = reviewCount > 0
        ? Number((adminReviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / reviewCount).toFixed(1))
        : 4.9;

      const storeData = {
        _id: superadmin?._id || 'platform-official',
        sellerSlug: 'digital-world',
        businessName: settings?.storeName || 'Digital World Official Store',
        shopLogo: settings?.logo || '/images/store-placeholder.png',
        shopBanner: '',
        shopLocation: settings?.address || 'Chennai, Tamil Nadu, India',
        city: 'Chennai',
        state: 'Tamil Nadu',
        yearOfEstablishment: 2020,
        yearsInBusiness: Math.max(1, new Date().getFullYear() - 2020),
        businessCategory: 'Electronics, Gourmet, Fashion & General Essentials',
        businessDescription: settings?.seoDescription ||
          'Official Digital World flagship storefront offering certified authentic products with direct platform warranty and verified delivery.',
        productCategories: Array.from(categoriesSet).length > 0
          ? Array.from(categoriesSet)
          : ['Electronics', 'Clothing', 'Snacks', 'Sweets', 'Groceries'],
        rating: storeRating,
        reviewCount,
        responseTime: 'Within 1 Hour',
        onTimeDispatchRate: 99,
        reorderRate: 35,
        totalOrders: await Order.countDocuments({ 'items.seller': null }),
        totalProducts,
        availableProducts: inStockCount,
        outOfStockProducts: outOfStockCount,
        isPlatformStore: true,
        verificationStatus: 'verified',
        isVerifiedMerchant: true,
      };

      return NextResponse.json({ success: true, store: storeData });
    }

    // 2. Individual Seller Storefront
    let seller = null;
    if (mongoose.isValidObjectId(sellerSlug)) {
      seller = await Admin.findOne({ _id: sellerSlug, role: 'seller' }).lean();
    }
    if (!seller) {
      seller = await Admin.findOne({
        role: 'seller',
        sellerSlug: lowerSlug,
      }).lean();
    }
    if (!seller) {
      const regex = new RegExp(`^${sellerSlug.replace(/-/g, ' ')}$`, 'i');
      seller = await Admin.findOne({ role: 'seller', businessName: regex }).lean();
    }

    if (!seller) {
      return NextResponse.json({ error: 'Seller not found or inactive' }, { status: 404 });
    }

    // Fetch seller business profile
    const profile = (await SellerBusinessProfile.findOne({ seller: seller._id }).lean()) || {};

    // Dynamic stats from real MongoDB collections
    const [totalOrders, sellerProducts] = await Promise.all([
      Order.countDocuments({ 'items.seller': seller._id }),
      Product.find({ seller: seller._id, isActive: true })
        .select('_id category variants')
        .populate('category', 'name')
        .lean(),
    ]);

    const totalProducts = sellerProducts.length;
    let inStockCount = 0;
    let outOfStockCount = 0;

    sellerProducts.forEach((p) => {
      const hasStock = p.variants?.some((v) => v.sizes?.some((s) => Number(s.stock) > 0));
      if (hasStock) inStockCount++;
      else outOfStockCount++;
    });

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
    const reviews = await Review.find({
      $or: [{ product: { $in: productIds } }, { seller: seller._id }],
      isApproved: true,
    }).select('rating').lean();
    const reviewCount = reviews.length;
    const storeRating =
      reviewCount > 0
        ? Number((reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / reviewCount).toFixed(1))
        : Number(profile.rating || 4.8);

    // Years in business
    const estYear = Number(profile.yearOfEstablishment || 2020);
    const currentYear = new Date().getFullYear();
    const yearsInBusiness = Math.max(1, currentYear - estYear);

    // Location formatting
    const city = profile.pickupAddress?.city || seller.shopAddress?.split(',')?.[0] || 'Chennai';
    const state = profile.pickupAddress?.state || 'Tamil Nadu';
    const shopLocation = `${city}, ${state}`;

    // ONLY approved storefront banners for this specific seller appear on their storefront
    const approvedBanner = await Banner.findOne({
      seller: seller._id,
      bannerType: { $ne: 'homepage' },
      approval: 'approved',
      isActive: true,
    }).sort({ sortOrder: 1, createdAt: -1 }).lean();

    const bannerImage = approvedBanner?.image || profile.banner || '';

    // Sanitized public store profile — no sensitive bank or private credentials
    const storeData = {
      _id: seller._id,
      sellerSlug: seller.sellerSlug || slugify(seller.businessName || seller.name),
      businessName: seller.businessName || seller.name || 'Merchant Store',
      shopLogo: profile.logo || '/images/store-placeholder.png',
      shopBanner: bannerImage,
      shopLocation,
      city,
      state,
      yearOfEstablishment: estYear,
      yearsInBusiness,
      businessCategory: profile.category || profile.businessCategory || 'Multi-Vendor Supplier',
      businessDescription:
        profile.description ||
        `Verified partner merchant crafting and supplying authentic products directly from origin.`,
      productCategories,
      rating: storeRating,
      reviewCount,
      responseTime: profile.responseTime || 'Within 2 Hours',
      onTimeDispatchRate: profile.onTimeDispatchRate ?? 98,
      reorderRate: profile.reorderRate ?? 28,
      totalOrders,
      totalProducts,
      availableProducts: inStockCount,
      outOfStockProducts: outOfStockCount,
      isPlatformStore: false,
      verificationStatus: seller.status === 'approved' ? 'verified' : seller.profileVerificationStatus || 'pending',
      isVerifiedMerchant: seller.status === 'approved',
    };

    return NextResponse.json({ success: true, store: storeData });
  } catch (err) {
    console.error('GET /api/stores/[sellerSlug] error:', err);
    return NextResponse.json({ error: err.message || 'Failed to load store profile' }, { status: 500 });
  }
}
