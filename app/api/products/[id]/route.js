import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/mongodb';
import Product from '@/models/Product';
import Category from '@/models/Category';
import Review from '@/models/Review';
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
      .populate({ path: 'seller', select: 'name businessName', match: { status: 'approved' } });

    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    const reviews = await Review.find({ product: product._id, isApproved: true }).sort({ createdAt: -1 });

    const related = product.category?._id
      ? await Product.find({
          category: product.category._id,
          _id: { $ne: product._id },
          isActive: true,
        })
          .limit(8)
          // sleeveOptions/zipOptions let ProductCard know when to send shoppers to the product page
          .select('name slug basePrice variants rating productType sleeveOptions zipOptions')
          .populate('category', 'name slug type sizeChart')
      : [];

    return NextResponse.json({ product, reviews, related });
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
    clean.basePrice = Math.min(...clean.variants.map((v) => v.price));
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