export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Category from '@/models/Category';
import slugify from 'slugify';
import { requireAdmin } from '@/lib/apiAuth';
import { PRODUCT_TYPE_KEYS } from '@/lib/productTypes';

// GET /api/categories
//   categories — flat sorted list (now includes `productType` on each)
//   topLevel   — parent-less categories each with a `subcategories` array
export async function GET() {
  await dbConnect();
  const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });

  const byParent = {};
  for (const c of categories) {
    const key = c.parent ? String(c.parent) : 'root';
    if (!byParent[key]) byParent[key] = [];
    byParent[key].push(c);
  }

  const topLevel = (byParent.root || []).map((c) => ({
    ...c.toObject(),
    subcategories: byParent[String(c._id)] || [],
  }));

  return NextResponse.json({ categories, topLevel });
}

export const POST = requireAdmin(async (req) => {
  await dbConnect();
  const body = await req.json();
  if (!body.name) return NextResponse.json({ error: 'Category name is required' }, { status: 400 });

  let baseSlug = body.slug
    ? slugify(body.slug, { lower: true, strict: true })
    : slugify(body.name, { lower: true, strict: true });
  if (!baseSlug) baseSlug = 'category';

  let slug = baseSlug;
  let count = 1;
  while (await Category.findOne({ slug })) {
    slug = `${baseSlug}-${count}`;
    count++;
  }

  // A subcategory always uses its parent's product type; a main category uses
  // whatever the admin picked (default: food/apparel).
  let productType = body.productType || 'food';
  if (body.parent) {
    const parent = await Category.findById(body.parent).select('productType');
    if (!parent) return NextResponse.json({ error: 'Parent category not found' }, { status: 400 });
    productType = parent.productType || 'food';
  }
  if (!PRODUCT_TYPE_KEYS.includes(productType)) {
    return NextResponse.json({ error: 'Invalid product type' }, { status: 400 });
  }

  const maxOrder = await Category.findOne({ parent: body.parent || null }).sort({ sortOrder: -1 }).select('sortOrder');
  const sortOrder = body.sortOrder !== undefined ? Number(body.sortOrder) : (maxOrder?.sortOrder !== undefined ? maxOrder.sortOrder + 1 : 0);

  const category = await Category.create({
    ...body,
    slug,
    parent: body.parent || null,
    productType,
    sortOrder,
    isActive: true,
  });
  return NextResponse.json({ category }, { status: 201 });
});