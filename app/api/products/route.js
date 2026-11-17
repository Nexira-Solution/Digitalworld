export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/mongodb';
import Product from '@/models/Product';
import Category from '@/models/Category';
import slugify from 'slugify';
import { requireApprovedSeller } from '@/lib/apiAuth';
import { generateSku } from '@/lib/sku';
import { resolveProductType, sanitizeByType, PRODUCT_TYPE_KEYS } from '@/lib/productTypes';
import { getPrefixForCategory, getNextProductId } from '@/lib/productId';

async function generateUniqueSlug(baseName, preferredSlug, excludeId = null) {
  let base = slugify(preferredSlug || baseName || 'product', { lower: true, strict: true }) || 'product';
  let slug = base;
  let count = 1;
  while (true) {
    const existing = await Product.findOne({ slug });
    if (!existing || (excludeId && String(existing._id) === String(excludeId))) {
      break;
    }
    slug = `${base}-${count}`;
    count++;
  }
  return slug;
}

export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const query = { isActive: true };

    // 1. Category filter — supports slug or ObjectId
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      let cat = null;
      if (mongoose.isValidObjectId(categoryParam)) {
        cat = await Category.findById(categoryParam);
      } else {
        cat = await Category.findOne({ slug: categoryParam });
      }
      if (!cat) return NextResponse.json({ products: [], total: 0 });

      if (cat.parent) {
        query.category = cat._id;
      } else {
        const subcats = await Category.find({ parent: cat._id }).select('_id');
        const categoryIds = [cat._id, ...subcats.map((c) => c._id)];
        query.category = { $in: categoryIds };
      }
    }

    // 2. Bestseller filter — supports ?isBestSeller=true or ?flag=bestseller
    const isBestSeller = searchParams.get('isBestSeller') || searchParams.get('bestseller');
    if (isBestSeller === 'true' || searchParams.get('flag') === 'bestseller') {
      query.isBestSeller = true;
    }

    // 3. Search query — supports ?search= or ?q=
    const search = searchParams.get('search') || searchParams.get('q');
    if (search && search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
        { tags: { $regex: search.trim(), $options: 'i' } },
        { sku: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    // 4. Product Type filter
    const productType = searchParams.get('productType');
    if (productType && PRODUCT_TYPE_KEYS.includes(productType)) {
      query.productType = productType === 'apparel' ? { $in: ['apparel', null] } : productType;
    }

    // 5. Subcategory filter
    const subcategoryParam = searchParams.get('subcategory');
    if (subcategoryParam) {
      if (mongoose.isValidObjectId(subcategoryParam)) {
        query.subcategory = subcategoryParam;
      } else {
        const sub = await Category.findOne({ slug: subcategoryParam });
        if (sub) query.subcategory = sub._id;
      }
    }

    // 6. Brand filter
    const brand = searchParams.get('brand');
    if (brand && brand.trim()) {
      query['attributes.brand'] = { $regex: brand.trim(), $options: 'i' };
    }

    // 7. Stock status filter (Requirement 09)
    const stockParam = searchParams.get('stock') || searchParams.get('stockStatus');
    if (stockParam === 'in_stock' || stockParam === 'inStock' || stockParam === 'true') {
      query.$or = [{ totalStock: { $gt: 0 } }, { 'variants.sizes.stock': { $gt: 0 } }];
    } else if (stockParam === 'out_of_stock' || stockParam === 'outOfStock') {
      query.totalStock = { $lte: 0 };
    }

    // 8. Rating filter (Requirement 09)
    const ratingParam = searchParams.get('rating') || searchParams.get('minRating');
    if (ratingParam && Number(ratingParam) > 0) {
      query.rating = { $gte: Number(ratingParam) };
    }

    // 9. Discount percentage filter (Requirement 09)
    const discountParam = searchParams.get('discount') || searchParams.get('minDiscount');
    if (discountParam && Number(discountParam) > 0) {
      query.discountPercentage = { $gte: Number(discountParam) };
    }

    // 10. Size filter
    const size = searchParams.get('size');
    if (size) query['variants.sizes.size'] = size;

    // 11. Price range filter
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    if (minPrice || maxPrice) {
      query.basePrice = {};
      if (minPrice) query.basePrice.$gte = Number(minPrice);
      if (maxPrice) query.basePrice.$lte = Number(maxPrice);
    }

    const flag = searchParams.get('flag');
    if (flag === 'topseller') query.isTopSeller = true;
    if (flag === 'active') query.isActiveSeller = true;
    if (flag === 'featured') query.isFeatured = true;

    if (flag === 'newarrival') {
      const cutoff30 = new Date();
      cutoff30.setDate(cutoff30.getDate() - 30);
      const cutoff90 = new Date();
      cutoff90.setDate(cutoff90.getDate() - 90);

      const [count30, count90] = await Promise.all([
        Product.countDocuments({ ...query, createdAt: { $gte: cutoff30 } }),
        Product.countDocuments({ ...query, createdAt: { $gte: cutoff90 } }),
      ]);

      if (count30 > 0) query.createdAt = { $gte: cutoff30 };
      else if (count90 > 0) query.createdAt = { $gte: cutoff90 };
    }

    const sort = searchParams.get('sort') || 'newest';
    const sortMap = {
      newest: { createdAt: -1 },
      priceLow: { basePrice: 1 },
      'price-low-to-high': { basePrice: 1 },
      priceHigh: { basePrice: -1 },
      'price-high-to-low': { basePrice: -1 },
      popular: { soldCount: -1 },
      rating: { rating: -1 },
    };

    const limitParam = searchParams.get('limit');
    const fetchAll = limitParam === 'all';
    const page = Number(searchParams.get('page') || 1);
    const limit = Number(limitParam || 24);

    let productsQuery = Product.find(query)
      .populate('category', 'name slug type sizeChart productType')
      .sort(sortMap[sort] || sortMap.newest);

    if (!fetchAll) productsQuery = productsQuery.skip((page - 1) * limit).limit(limit);

    const [products, total] = await Promise.all([productsQuery, Product.countDocuments(query)]);

    return NextResponse.json({
      products,
      total,
      page: fetchAll ? 1 : page,
      pages: fetchAll ? 1 : Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('GET /api/products error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch products' }, { status: 500 });
  }
}

export const POST = requireApprovedSeller(async (req, ctx, admin) => {
  try {
    await dbConnect();
    const body = await req.json();
    if (!body.name || !body.category) {
      return NextResponse.json({ error: 'Product name and category are required' }, { status: 400 });
    }

    // Requirement 02: Strict category existence & active validation
    const catId = body.category?._id || body.category;
    if (!mongoose.isValidObjectId(catId)) {
      return NextResponse.json(
        { error: 'Selected category does not exist. Please select an available category.' },
        { status: 400 }
      );
    }

    const cat = await Category.findById(catId).populate('parent', 'productType');
    if (!cat) {
      return NextResponse.json(
        { error: 'Selected category does not exist. Please select an available category.' },
        { status: 400 }
      );
    }
    if (cat.isActive === false) {
      return NextResponse.json(
        { error: 'Selected category is inactive. Please select an active category.' },
        { status: 400 }
      );
    }

    // Optional subcategory existence & active validation
    let validSubcategoryId = null;
    if (body.subcategory) {
      const subId = body.subcategory?._id || body.subcategory;
      if (!mongoose.isValidObjectId(subId)) {
        return NextResponse.json({ error: 'Selected subcategory is invalid.' }, { status: 400 });
      }
      const subcat = await Category.findById(subId);
      if (!subcat) {
        return NextResponse.json({ error: 'Selected subcategory does not exist.' }, { status: 400 });
      }
      if (subcat.isActive === false) {
        return NextResponse.json({ error: 'Selected subcategory is inactive.' }, { status: 400 });
      }
      validSubcategoryId = subcat._id;
    }

    const typeKey = resolveProductType(cat);
    const { body: clean, error } = sanitizeByType({ ...body, category: cat._id }, typeKey);
    if (error) return NextResponse.json({ error }, { status: 400 });

    const sku = clean.sku || (await generateSku(cat._id));
    const slug = await generateUniqueSlug(clean.name, clean.slug);

    // Requirement 05: Atomic category-based Product ID generation
    const prefix = await getPrefixForCategory(cat._id, validSubcategoryId);
    const productId = await getNextProductId(prefix);

    // Calculate basePrice, discountPercentage, and totalStock
    let basePrice = 0;
    let discountPercentage = 0;
    let totalStock = 0;

    if (clean.variants?.length) {
      basePrice = Math.min(...clean.variants.map((v) => Number(v.price) || 0));
      const discounts = clean.variants.map((v) => {
        const vPrice = Number(v.price) || 0;
        const vCompare = Number(v.compareAtPrice) || 0;
        return vCompare > vPrice ? Math.round(((vCompare - vPrice) / vCompare) * 100) : 0;
      });
      discountPercentage = Math.max(0, ...discounts);

      clean.variants.forEach((v) => {
        if (v.sizes?.length) {
          v.sizes.forEach((s) => {
            totalStock += Math.max(0, Number(s.stock) || 0);
          });
        } else {
          totalStock += Math.max(0, Number(v.stock) || 0);
        }
      });
    } else {
      basePrice = clean.basePrice || 0;
      discountPercentage = clean.discountPercentage || 0;
      totalStock = Math.max(0, Number(clean.stock) || 0);
    }

    // Resolve images array
    const images =
      clean.images && clean.images.length > 0
        ? clean.images
        : clean.variants?.[0]?.images || [];

    // Requirement 03: Strictly enforce ownership
    // Admin products are assigned to Admin ownership (null).
    // Seller products are automatically assigned to authenticated Seller ID.
    // Never trust a sellerId submitted by the frontend.
    const seller = admin.role === 'seller' ? admin.id : null;

    const product = await Product.create({
      ...clean,
      productId,
      slug,
      sku,
      category: cat._id,
      subcategory: validSubcategoryId,
      basePrice,
      discountPercentage,
      totalStock,
      images,
      isBestSeller: Boolean(body.isBestSeller ?? clean.isBestSeller),
      seller,
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (err) {
    console.error('POST /api/products error:', err);
    return NextResponse.json({ error: err.message || 'Failed to create product' }, { status: 500 });
  }
});