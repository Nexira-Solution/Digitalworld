export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Review from '@/models/Review';
import Order from '@/models/Order';
import Product from '@/models/Product';

// GET /api/reviews
export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);

    const orderId = searchParams.get('orderId');
    if (orderId) {
      const reviews = await Review.find({ order: orderId }).select('product').lean();
      return NextResponse.json({ reviewedProductIds: reviews.map((r) => String(r.product)) });
    }

    const all = searchParams.get('all') === 'true';
    const status = searchParams.get('status');
    const productId = searchParams.get('productId') || searchParams.get('product');
    const sellerId = searchParams.get('sellerId') || searchParams.get('seller');
    const rating = searchParams.get('rating');
    const featured = searchParams.get('featured') === 'true';

    const query = {};

    if (!all) {
      // Public view: ONLY approved reviews
      query.isApproved = true;
      query.reviewStatus = 'approved';
    } else if (status && status !== 'all') {
      if (status === 'pending') {
        query.reviewStatus = 'pending';
      } else if (status === 'approved') {
        query.reviewStatus = 'approved';
      } else if (status === 'rejected') {
        query.reviewStatus = 'rejected';
      }
    }

    if (productId && productId !== 'all') {
      query.product = productId;
    }

    if (sellerId && sellerId !== 'all') {
      query.seller = sellerId;
    }

    if (rating && rating !== 'all') {
      query.rating = Number(rating);
    }

    if (featured) {
      query.isFeatured = true;
    }

    const reviews = await Review.find(query)
      .populate('product', 'name slug images brand price sellingPrice')
      .populate('seller', 'name businessName sellerSlug')
      .populate('order', 'orderNumber status createdAt')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, reviews, total: reviews.length });
  } catch (err) {
    console.error('GET /api/reviews error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch reviews' }, { status: 500 });
  }
}

// POST /api/reviews - Customer Review Submission with Verified Purchase Validation
export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();

    const {
      orderId,
      product: productId,
      customerName,
      customerEmail,
      rating,
      title,
      comment,
      images,
      recommends,
    } = body;

    if (!productId || !customerName || !rating) {
      return NextResponse.json(
        { error: 'Product, customer name, and star rating are required.' },
        { status: 400 }
      );
    }

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order reference is required. Reviews can only be submitted for verified delivered purchases.' },
        { status: 400 }
      );
    }

    // 1. Verify that order exists and status is 'Delivered'
    const order = await Order.findById(orderId).lean();
    if (!order) {
      return NextResponse.json({ error: 'Order not found in records.' }, { status: 404 });
    }

    const orderStatus = String(order.status || '').toLowerCase();
    if (orderStatus !== 'delivered') {
      return NextResponse.json(
        { error: `Reviews can only be written after the order has been delivered. Current status: ${order.status}` },
        { status: 400 }
      );
    }

    // 2. Verify customer actually purchased this specific product in that order
    const orderedItem = order.items?.find((it) => String(it.product) === String(productId));
    if (!orderedItem) {
      return NextResponse.json(
        { error: 'This specific product was not part of the delivered order.' },
        { status: 400 }
      );
    }

    // 3. Prevent duplicate reviews: One review per customer per purchased product
    const duplicateQuery = {
      product: productId,
      $or: [
        { order: order._id },
        ...(order.customerEmail ? [{ customerEmail: order.customerEmail.toLowerCase() }] : []),
        ...(customerEmail ? [{ customerEmail: customerEmail.toLowerCase() }] : []),
      ],
    };

    const existing = await Review.findOne(duplicateQuery).lean();
    if (existing) {
      return NextResponse.json(
        { error: 'You have already submitted a review for this purchased product. Duplicate reviews are not permitted.' },
        { status: 409 }
      );
    }

    // 4. Resolve product & seller
    const product = await Product.findById(productId).select('seller').lean();
    const sellerId = product?.seller || orderedItem?.seller || null;

    // 5. Create new review with Pending Approval status
    const numRating = Math.max(1, Math.min(5, Number(rating)));
    const photoList = Array.isArray(images) ? images.slice(0, 5) : [];

    const newReview = await Review.create({
      product: productId,
      seller: sellerId,
      customer: order.customer || null,
      order: order._id,
      orderItemId: orderedItem._id || '',
      customerName: String(customerName).trim(),
      customerEmail: String(customerEmail || order.customerEmail || '').toLowerCase(),
      rating: numRating,
      title: String(title || '').trim(),
      comment: String(comment || '').trim(),
      images: photoList,
      recommends: recommends !== false,
      isVerifiedPurchase: true,
      reviewStatus: 'pending',
      isApproved: false,
      verifiedAt: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        review: newReview,
        message: 'Thank you! Your verified purchase review has been submitted and will appear on the product page following admin moderation.',
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('POST /api/reviews error:', err);
    return NextResponse.json({ error: err.message || 'Failed to submit review' }, { status: 500 });
  }
}
