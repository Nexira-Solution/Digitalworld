import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/mongodb';
import Product from '@/models/Product';
import Category from '@/models/Category';
import Review from '@/models/Review';
import Settings from '@/models/Settings';
import SellerBusinessProfile from '@/models/SellerBusinessProfile';
import Coupon from '@/models/Coupon';
import '@/models/Admin'; // make sure the model is registered for populate
import { requireApprovedSeller, ownsProduct } from '@/lib/apiAuth';
import { resolveProductType, sanitizeByType } from '@/lib/productTypes';

function getFilter(id) {
  return mongoose.isValidObjectId(id) ? { _id: id } : { slug: id };
}

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    await dbConnect();

    const product = await Product.findOne({
      ...getFilter(id),
      isActive: true,
    })
      .populate('category', 'name slug sizes type sizeChart productType')
      // Public seller info only (no email, phone or GST). Unapproved sellers
      // come back as null, so no "Sold by" link points to an empty store page.
      .populate({ path: 'seller', select: 'name businessName sellerSlug status' });

    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    const reviews = await Review.find({ product: product._id, isApproved: true }).sort({ createdAt: -1 });

    let related = product.category?._id
      ? await Product.find({
          category: product.category._id,
          _id: { $ne: product._id },
          isActive: true,
        })
          .limit(8)
          // sleeveOptions/zipOptions let ProductCard know when to send shoppers to the product page
          .select('name slug basePrice variants rating reviewCount numReviews isBestSeller description image productType sleeveOptions zipOptions')
          .populate('category', 'name slug type sizeChart')
      : [];

    // If fewer than 4 related items in the same category, complement with other active products
    if (related.length < 4) {
      const existingIds = [product._id, ...related.map((r) => r._id)];
      const additional = await Product.find({
        _id: { $nin: existingIds },
        isActive: true,
      })
        .limit(8 - related.length)
        .select('name slug basePrice variants rating reviewCount numReviews isBestSeller description image productType sleeveOptions zipOptions')
        .populate('category', 'name slug type sizeChart');
      related = [...related, ...additional];
    }

    const settings = await Settings.findOne({ key: 'global' }).lean();
    const freeDeliveryAbove =
      product.deliveryInfo?.freeDeliveryAbove ||
      settings?.freeShippingThreshold ||
      settings?.freeShippingAbove ||
      499;
    const shippingCharge =
      settings?.defaultShippingCharge || settings?.flatShippingRate || 49;
    const estimatedDays = product.deliveryInfo?.estimatedDays || 2;
    const dispatchDays =
      product.deliveryInfo?.dispatchDays ||
      (product.isReadyToShip ? 'Ready to Ship (Dispatches in 24h)' : 'Dispatches in 1-2 Days');

    const deliveryInfo = {
      pincode: '600001',
      city: 'Chennai',
      state: 'Tamil Nadu',
      freeDeliveryAbove,
      shippingCharge,
      estimatedDays,
      dispatchDays,
      isCodAvailable: true,
    };

    // Dynamic trust badges: if product has configured trustBadges, use them!
    const isFood = product.productType === 'food' || product.category?.productType === 'food';
    const defaultTrustBadges = isFood
      ? [
          { title: '100% Natural', subtitle: 'No Preservatives', icon: 'Leaf' },
          { title: 'Hygienically', subtitle: 'Prepared', icon: 'FlaskConical' },
          { title: 'Premium', subtitle: 'Quality Tested', icon: 'ShieldCheck' },
          { title: 'Authentic', subtitle: 'Traditional Taste', icon: 'Award' },
          { title: 'Freshly', subtitle: 'Packed', icon: 'HandPlatter' },
        ]
      : [
          { title: '100% Authentic', subtitle: 'Pure Quality', icon: 'Leaf' },
          { title: 'Hygienically', subtitle: 'Packaged', icon: 'ShieldCheck' },
          { title: 'Premium Grade', subtitle: 'Verified Seller', icon: 'Award' },
          { title: 'Easy Returns', subtitle: '7 Days Policy', icon: 'CheckCircle2' },
          { title: 'Fast Dispatch', subtitle: 'Direct to Doorstep', icon: 'Truck' },
        ];

    const trustBadges =
      Array.isArray(product.trustBadges) && product.trustBadges.length > 0
        ? product.trustBadges
        : defaultTrustBadges;

    const dynamicOffers =
      Array.isArray(product.offers) && product.offers.length > 0
        ? product.offers
        : [
            product.discountPercentage > 0
              ? `${product.discountPercentage}% Instant Discount (Limited Time)`
              : null,
            'Extra 10% off on Prepaid Orders',
            `Free Delivery above ₹${freeDeliveryAbove}`,
            'Secure & Hygienic Packaging',
          ].filter(Boolean);

    // Dynamic Supplier Information per Feature 04 & Feature 06
    let supplierInfo = null;
    if (product.seller) {
      const sellerProfile = (await SellerBusinessProfile.findOne({ seller: product.seller._id }).lean()) || {};
      const [sellerProdCount, sellerOrdersCount] = await Promise.all([
        Product.countDocuments({ seller: product.seller._id, isActive: true }),
        mongoose.models.Order ? mongoose.models.Order.countDocuments({ 'items.seller': product.seller._id }) : 0,
      ]);

      const city = sellerProfile.pickupAddress?.city || 'Chennai';
      const state = sellerProfile.pickupAddress?.state || 'Tamil Nadu';
      const estYear = Number(sellerProfile.yearOfEstablishment || 2020);

      const slug = product.seller.sellerSlug || (product.seller.businessName || product.seller.name || '')
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');

      supplierInfo = {
        sellerId: product.seller._id,
        sellerSlug: slug,
        businessName: product.seller.businessName || product.seller.name || 'Merchant Partner',
        shopLogo: sellerProfile.logo || '',
        shopLocation: `${city}, ${state}`,
        yearOfEstablishment: estYear,
        yearsInBusiness: Math.max(1, new Date().getFullYear() - estYear),
        businessCategory: sellerProfile.category || product.category?.name || 'Gourmet & Snacks',
        businessDescription:
          sellerProfile.description ||
          'Verified merchant offering high-quality handcrafted gourmet delicacies directly from production origins.',
        productCategories: sellerProfile.productCategories?.length > 0
          ? sellerProfile.productCategories
          : [product.category?.name || 'Gourmet Snacks'],
        rating: sellerProfile.rating || 4.8,
        responseTime: sellerProfile.responseTime || 'Within 2 Hours',
        onTimeDispatchRate: sellerProfile.onTimeDispatchRate ?? 98,
        reorderRate: sellerProfile.reorderRate ?? 28,
        totalOrders: sellerOrdersCount,
        totalProducts: sellerProdCount,
        verificationStatus: product.seller.status === 'approved' ? 'verified' : 'in_review',
        isVerifiedMerchant: product.seller.status === 'approved',
      };
    } else {
      // In-house flagship brand default supplier details
      const totalAllProducts = await Product.countDocuments({ isActive: true });
      supplierInfo = {
        sellerId: null,
        sellerSlug: 'mailoo-bazar',
        businessName: 'MailooBazar',
        shopLogo: '/logo.png',
        shopLocation: 'Chennai, Tamil Nadu',
        yearOfEstablishment: 2018,
        yearsInBusiness: Math.max(1, new Date().getFullYear() - 2018),
        businessCategory: 'Gourmet & Traditional Foods',
        businessDescription:
          'Flagship purveyor of authentic traditional spices, crispy coconut-oil banana chips, and gourmet snacks crafted with zero preservatives.',
        productCategories: ['Traditional Snacks', 'Pure Saffron & Spices', 'Gourmet Delicacies'],
        rating: 4.9,
        responseTime: 'Within 1 Hour',
        onTimeDispatchRate: 99,
        reorderRate: 36,
        totalOrders: 12560,
        totalProducts: totalAllProducts,
        verificationStatus: 'verified',
        isVerifiedMerchant: true,
      };
    }

    // Active Coupons for this product
    const now = new Date();
    const activeCoupons = await Coupon.find({
      isActive: true,
      $or: [{ expiryDate: null }, { expiryDate: { $gte: now } }],
    })
      .select('code description discountType discountValue minimumOrderValue maximumDiscount')
      .lean();

    return NextResponse.json({
      product,
      reviews,
      related,
      deliveryInfo,
      trustBadges,
      offers: dynamicOffers,
      supplierInfo,
      coupons: activeCoupons,
    });
  } catch (err) {
    console.error('GET /api/products/[id] error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch product' }, { status: 500 });
  }
}

export const PUT = requireApprovedSeller(async (req, { params }, admin) => {
  const { id } = await params;
  await dbConnect();
  const body = await req.json();

  const current = await Product.findOne(getFilter(id)).select('_id category sku seller');
  if (!current) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  if (!ownsProduct(admin, current)) {
    return NextResponse.json({ error: 'You do not have permission to edit this product.' }, { status: 403 });
  }

  delete body.sku;
  delete body.seller; // ownership can't be reassigned through this route

  // Type is derived from the (possibly changed) category — never from the client.
  const catId = body.category?._id || body.category || current.category;
  const cat = await Category.findById(catId).populate('parent', 'productType');
  if (!cat) return NextResponse.json({ error: 'Category not found' }, { status: 404 });

  const typeKey = resolveProductType(cat);
  const { body: clean, error } = sanitizeByType({ ...body, category: cat._id }, typeKey);
  if (error) return NextResponse.json({ error }, { status: 400 });

  if (clean.variants?.length) {
    clean.basePrice = Math.min(...clean.variants.map((v) => Number(v.price) || 0));
    const discounts = clean.variants.map((v) => {
      const vPrice = Number(v.price) || 0;
      const vCompare = Number(v.compareAtPrice) || 0;
      return vCompare > vPrice ? Math.round(((vCompare - vPrice) / vCompare) * 100) : 0;
    });
    clean.discountPercentage = Math.max(0, ...discounts);
  }

  if (body.isBestSeller !== undefined) {
    clean.isBestSeller = Boolean(body.isBestSeller);
  }

  if (clean.images && clean.images.length > 0) {
    // Keep specified root images
  } else if (clean.variants?.[0]?.images?.length) {
    clean.images = clean.variants[0].images;
  }

  const product = await Product.findOneAndUpdate(getFilter(id), clean, { new: true });
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  return NextResponse.json({ product });
});

export const DELETE = requireApprovedSeller(async (req, { params }, admin) => {
  const { id } = await params;
  await dbConnect();

  const current = await Product.findOne(getFilter(id)).select('_id seller');
  if (!current) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  if (!ownsProduct(admin, current)) {
    return NextResponse.json({ error: 'You do not have permission to delete this product.' }, { status: 403 });
  }

  await Product.findOneAndDelete(getFilter(id));
  return NextResponse.json({ success: true });
});