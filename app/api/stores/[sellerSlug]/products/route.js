export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/mongodb';
import Admin from '@/models/Admin';
import Product from '@/models/Product';
import Category from '@/models/Category';

export async function GET(req, { params }) {
  try {
    await dbConnect();
    const { sellerSlug } = await params;
    const { searchParams } = new URL(req.url);

    // Resolve seller ID
    let seller = null;
    if (mongoose.isValidObjectId(sellerSlug)) {
      seller = await Admin.findOne({ _id: sellerSlug, role: 'seller' }).select('_id').lean();
    }
    if (!seller) {
      seller = await Admin.findOne({ role: 'seller', sellerSlug: sellerSlug.toLowerCase() }).select('_id').lean();
    }
    if (!seller) {
      const regex = new RegExp(`^${sellerSlug.replace(/-/g, ' ')}$`, 'i');
      seller = await Admin.findOne({ role: 'seller', businessName: regex }).select('_id').lean();
    }

    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    const query = {
      seller: seller._id,
      isActive: true,
    };

    const search = searchParams.get('q') || searchParams.get('search');
    if (search && search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
        { tags: { $in: [new RegExp(search.trim(), 'i')] } },
      ];
    }

    const categorySlug = searchParams.get('category');
    if (categorySlug && categorySlug !== 'all') {
      const cat = await Category.findOne({ slug: categorySlug }).select('_id').lean();
      if (cat) query.category = cat._id;
    }

    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const limit = Math.max(1, Math.min(50, Number(searchParams.get('limit') || 12)));

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug')
        .sort({ isBestSeller: -1, createdAt: -1 })
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

