export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Review from '@/models/Review';
import Product from '@/models/Product';

export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const resolvedParams = await params;
    const id = resolvedParams?.id || resolvedParams?.reviewId;
    const body = await req.json();

    const review = await Review.findById(id);
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    if (body.rating !== undefined) {
      const num = Number(body.rating);
      if (num >= 1 && num <= 5) review.rating = num;
    }
    if (body.comment !== undefined) review.comment = String(body.comment);
    if (body.reviewText !== undefined) review.comment = String(body.reviewText);
    if (Array.isArray(body.images)) review.images = body.images;
    if (Array.isArray(body.reviewImages)) review.images = body.reviewImages;
    if (body.isApproved !== undefined) {
      review.isApproved = Boolean(body.isApproved);
      review.reviewStatus = body.isApproved ? 'approved' : 'rejected';
    }
    if (body.reviewStatus !== undefined) {
      review.reviewStatus = body.reviewStatus;
      review.isApproved = body.reviewStatus === 'approved';
    }

    await review.save();

    // Recalculate product rating
    const allReviews = await Review.find({
      product: review.product,
      $or: [{ reviewStatus: 'approved' }, { isApproved: true }],
    }).select('rating').lean();

    const count = allReviews.length;
    if (count > 0) {
      const avg = Number((allReviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / count).toFixed(1));
      await Product.findByIdAndUpdate(review.product, {
        rating: avg,
        reviewCount: count,
        numReviews: count,
      });
    }

    return NextResponse.json({ success: true, review, message: 'Review updated successfully' });
  } catch (err) {
    console.error('PUT /api/reviews/[id] error:', err);
    return NextResponse.json({ error: err.message || 'Failed to update review' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const resolvedParams = await params;
    const id = resolvedParams?.id || resolvedParams?.reviewId;

    const review = await Review.findByIdAndDelete(id);
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Recalculate product reviews
    const allReviews = await Review.find({
      product: review.product,
      $or: [{ reviewStatus: 'approved' }, { isApproved: true }],
    }).select('rating').lean();

    const count = allReviews.length;
    const avg = count > 0 ? Number((allReviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / count).toFixed(1)) : 4.8;

    await Product.findByIdAndUpdate(review.product, {
      rating: avg,
      reviewCount: count,
      numReviews: count,
    });

    return NextResponse.json({ success: true, message: 'Review deleted successfully' });
  } catch (err) {
    console.error('DELETE /api/reviews/[id] error:', err);
    return NextResponse.json({ error: err.message || 'Failed to delete review' }, { status: 500 });
  }
}
