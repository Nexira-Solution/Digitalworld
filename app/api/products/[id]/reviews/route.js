export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/mongodb';
import Product from '@/models/Product';
import Order from '@/models/Order';
import Review from '@/models/Review';
import Admin from '@/models/Admin';
import SellerBusinessProfile from '@/models/SellerBusinessProfile';

function getFilter(id) {
  return mongoose.isValidObjectId(id) ? { _id: id } : { slug: id };
}

// GET /api/products/:id/reviews
export async function GET(req, { params }) {
  try {
    await dbConnect();
    const { id } = await params;

    const product = await Product.findOne(getFilter(id)).select('_id rating reviewCount numReviews').lean();
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const reviews = await Review.find({
      product: product._id,
      $or: [{ reviewStatus: 'approved' }, { isApproved: true }],
    })
      .sort({ createdAt: -1 })
      .lean();

    // Calculate rating distribution
    const totalReviews = reviews.length;
    const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let ratingSum = 0;

    reviews.forEach((r) => {
      const s = Math.max(1, Math.min(5, Math.round(Number(r.rating) || 5)));
      starCounts[s] = (starCounts[s] || 0) + 1;
      ratingSum += Number(r.rating) || 5;
    });

    const averageRating =
      totalReviews > 0 ? Number((ratingSum / totalReviews).toFixed(1)) : Number(product.rating || 4.8);

    const defaultPcts = { 5: 78, 4: 16, 3: 4, 2: 1, 1: 1 };
    const distribution = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: starCounts[star] || 0,
      percentage: totalReviews > 0 ? Math.round(((starCounts[star] || 0) / totalReviews) * 100) : defaultPcts[star],
    }));

    return NextResponse.json({
      success: true,
      reviews,
      totalReviews: totalReviews || Number(product.numReviews || product.reviewCount || 0),
      averageRating,
      distribution,
    });
  } catch (err) {
    console.error('GET /api/products/[id]/reviews error:', err);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

// POST /api/products/:id/reviews -> customer submits review with delivered order verification
export async function POST(req, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    const {
      orderId,
      orderNumber,
      phone,
      email,
      customerName,
      rating,
      comment,
      reviewText,
      images,
      reviewImages,
    } = body;

    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
      return NextResponse.json({ error: 'Rating must be a number between 1 and 5' }, { status: 400 });
    }

    const product = await Product.findOne(getFilter(id));
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Identify order
    let orderQuery = null;
    if (orderId && mongoose.isValidObjectId(orderId)) {
      orderQuery = { _id: orderId };
    } else if (orderNumber) {
      orderQuery = { orderNumber: String(orderNumber).trim() };
    }

    if (!orderQuery) {
      return NextResponse.json(
        { error: 'Order reference (order ID or order number) is required to verify purchase' },
        { status: 400 }
      );
    }

    const order = await Order.findOne(orderQuery);
    if (!order) {
      return NextResponse.json({ error: 'Order not found in our records' }, { status: 404 });
    }

    // Verify phone or email match
    if (phone) {
      const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
      const cleanOrderPhone = String(order.customer?.phone || '').replace(/\D/g, '').slice(-10);
      if (cleanPhone && cleanOrderPhone && cleanPhone !== cleanOrderPhone) {
        return NextResponse.json({ error: 'Phone number does not match order customer' }, { status: 403 });
      }
    }
    if (email && order.customer?.email) {
      if (email.trim().toLowerCase() !== order.customer.email.trim().toLowerCase()) {
        return NextResponse.json({ error: 'Email does not match order record' }, { status: 403 });
      }
    }

    // STRICT FEATURE 11 REQUIREMENT: Only delivered order items can receive customer reviews
    if (order.status !== 'delivered') {
      return NextResponse.json(
        {
          error: `Reviews can only be submitted after your order is delivered. Current status: ${order.status}`,
        },
        { status: 400 }
      );
    }

    // Verify that the product is actually part of this order
    const orderedItem = order.items.find(
      (it) => it.product && String(it.product) === String(product._id)
    );
    if (!orderedItem) {
      return NextResponse.json(
        { error: 'This product was not found in the specified order' },
        { status: 400 }
      );
    }

    // Prevent duplicate reviews for the same order and product
    const existing = await Review.findOne({ order: order._id, product: product._id });
    if (existing) {
      return NextResponse.json(
        { error: 'You have already submitted a review for this product on this order' },
        { status: 400 }
      );
    }

    const finalComment = comment || reviewText || '';
    const finalImages = Array.isArray(images) ? images : Array.isArray(reviewImages) ? reviewImages : [];
    const reviewerName = customerName || order.customer?.name || 'Verified Buyer';

    const review = await Review.create({
      product: product._id,
      seller: product.seller || orderedItem.seller || null,
      order: order._id,
      orderItemId: String(orderedItem._id || orderedItem.sku || ''),
      customerName: reviewerName,
      customerEmail: order.customer?.email || '',
      rating: numRating,
      comment: finalComment,
      images: finalImages,
      isVerifiedPurchase: true,
      reviewStatus: 'approved',
      isApproved: true,
      verifiedAt: new Date(),
    });

    // Recalculate product rating & reviewCount
    const allProdReviews = await Review.find({
      product: product._id,
      $or: [{ reviewStatus: 'approved' }, { isApproved: true }],
    }).select('rating').lean();

    const newReviewCount = allProdReviews.length;
    const newAvgRating =
      newReviewCount > 0
        ? Number((allProdReviews.reduce((sum, r) => sum + r.rating, 0) / newReviewCount).toFixed(1))
        : numRating;

    product.rating = newAvgRating;
    product.reviewCount = newReviewCount;
    product.numReviews = newReviewCount;
    await product.save();

    // If seller exists, recalculate seller rating
    if (product.seller) {
      const allSellerReviews = await Review.find({
        seller: product.seller,
        $or: [{ reviewStatus: 'approved' }, { isApproved: true }],
      }).select('rating').lean();

      if (allSellerReviews.length > 0) {
        const sellerAvg = Number(
          (allSellerReviews.reduce((s, r) => s + r.rating, 0) / allSellerReviews.length).toFixed(1)
        );
        await SellerBusinessProfile.findOneAndUpdate(
          { seller: product.seller },
          { rating: sellerAvg, reviewCount: allSellerReviews.length }
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        review,
        message: 'Thank you! Your verified customer review has been published.',
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('POST /api/products/[id]/reviews error:', err);
    return NextResponse.json({ error: err.message || 'Failed to submit review' }, { status: 500 });
  }
}

