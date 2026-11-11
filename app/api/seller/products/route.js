import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Product from '@/models/Product';
import { requireAdmin } from '@/lib/apiAuth';

// Any logged-in seller can VIEW their own inventory even while pending —
// they just can't create/edit/delete until approved (enforced elsewhere).
export const GET = requireAdmin(async (req, ctx, admin) => {
  await dbConnect();
  const { searchParams } = new URL(req.url);

  const query = admin.role === 'superadmin' ? {} : { seller: admin.id };

  const search = searchParams.get('search');
  if (search && search.trim()) {
    query.$or = [
      { name: { $regex: search.trim(), $options: 'i' } },
      { sku: { $regex: search.trim(), $options: 'i' } },
    ];
  }

  const category = searchParams.get('category');
  if (category) {
    query.category = category;
  }

  const isBestSeller = searchParams.get('isBestSeller');
  if (isBestSeller === 'true') {
    query.isBestSeller = true;
  }

  const page = Number(searchParams.get('page') || 1);
  const limit = Number(searchParams.get('limit') || 20);

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments(query),
  ]);

  return NextResponse.json({ products, total, page, pages: Math.ceil(total / limit) });
});