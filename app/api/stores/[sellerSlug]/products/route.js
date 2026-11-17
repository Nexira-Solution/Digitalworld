export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/mongodb';
import Admin from '@/models/Admin';
import Product from '@/models/Product';
import Category from '@/models/Category';

const PLATFORM_SLUGS = ['digital-world', 'mailoo-bazar', 'official', 'platform', 'admin'];

export async function GET(req, { params }) {
  try {
    await dbConnect();
    const { sellerSlug } = await params;
    const { searchParams } = new URL(req.url);

    if (!sellerSlug) {
      return NextResponse.json({ error: 'Seller identifier is required' }, { status: 400 });
    }

    const lowerSlug = sellerSlug.toLowerCase();
    const isPlatform = PLATFORM_SLUGS.includes(lowerSlug);

    const query = { isActive: true };

    if (isPlatform) {
      query.seller = null;
    } else {
      let seller = null;
      if (mongoose.isValidObjectId(sellerSlug)) {
        seller = await Admin.findOne({ _id: sellerSlug, role: 'seller' }).select('_id').lean();
      }
      if (!seller) {
        seller = await Admin.findOne({ role: 'seller', sellerSlug: lowerSlug }).select('_id').lean();
      }
      if (!seller) {
        const regex = new RegExp(`^${sellerSlug.replace(/-/g, ' ')}$`, 'i');
        seller = await Admin.findOne({ role: 'seller', businessName: regex }).select('_id').lean();
      }

      if (!seller) {
        return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
      }
      query.seller = seller._id;
    }

    // Search filter
    const search = searchParams.get('q') || searchParams.get('search');
    if (search && search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
        { tags: { $in: [new RegExp(search.trim(), 'i')] } },
      ];
    }

    // Category filter
    const categorySlug = searchParams.get('category');
    if (categorySlug && categorySlug !== 'all') {
      if (mongoose.isValidObjectId(categorySlug)) {
        query.category = categorySlug;
      } else {
        const cat = await Category.findOne({ slug: categorySlug }).select('_id').lean();
        if (cat) query.category = cat._id;
      }
    }

    // Stock filter: all, in_stock, out_of_stock
    const stockFilter = searchParams.get('stock');
    if (stockFilter === 'in_stock') {
      query['variants.sizes.stock'] = { $gt: 0 };
    } else if (stockFilter === 'out_of_stock') {
      query['variants.sizes.stock'] = { $not: { $gt: 0 } };
    }

    // Price sort
    const sort = searchParams.get('sort') || 'default';
    let sortObj = { isBestSeller: -1, createdAt: -1 };
    if (sort === 'price_asc') sortObj = { sellingPrice: 1 };
    else if (sort === 'price_desc') sortObj = { sellingPrice: -1 };
    else if (sort === 'newest') sortObj = { createdAt: -1 };
    else if (sort === 'rating') sortObj = { rating: -1, reviewCount: -1 };

    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const limit = Math.max(1, Math.min(50, Number(searchParams.get('limit') || 24)));

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug')
        .sort(sortObj)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      products,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('GET /api/stores/[sellerSlug]/products error:', err);
    return NextResponse.json({ error: err.message || 'Failed to load seller products' }, { status: 500 });
  }
}
