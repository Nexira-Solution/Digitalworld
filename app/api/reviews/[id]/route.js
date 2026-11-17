export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Review from '@/models/Review';
import Product from '@/models/Product';
import { requireAdmin } from '@/lib/apiAuth';

export const PUT = requireAdmin(async (req, { params }, admin) => {
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
    if (body.title !== undefined) review.title = String(body.title);
    if (body.comment !== undefined) review.comment = String(body.comment);
    if (body.reviewText !== undefined) review.comment = String(body.reviewText);
    if (body.recommends !== undefined) review.recommends = Boolean(body.recommends);
    if (body.isFeatured !== undefined) review.isFeatured = Boolean(body.isFeatured);

    // Approval / Rejection logic
    if (body.reviewStatus !== undefined || body.isApproved !== undefined) {
      const targetStatus = body.reviewStatus || (body.isApproved ? 'approved' : 'rejected');
      review.reviewStatus = targetStatus;
      review.isApproved = targetStatus === 'approved';
      review.reviewedBy = admin.id;
      review.reviewedAt = new Date();

      if (targetStatus === 'approved') {
        review.rejectionReason = '';
      } else if (targetStatus === 'rejected' && body.rejectionReason) {
        review.rejectionReason = String(body.rejectionReason).trim();
      }
    }

    await review.save();

    // Recalculate product rating only on approved reviews
    const approvedReviews = await Review.find({
      product: review.product,
      isApproved: true,
      reviewStatus: 'approved',
    }).select('rating').lean();

    const count = approvedReviews.length;
    const avg = count > 0
      ? Number((approvedReviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / count).toFixed(1))
      : 0;

    await Product.findByIdAndUpdate(review.product, {
      rating: avg,
      reviewCount: count,
      numReviews: count,
    });

    return NextResponse.json({
      success: true,
      review,
      message: `Review marked as ${review.reviewStatus}`,
    });
  } catch (err) {
    console.error('PUT /api/reviews/[id] error:', err);
    return NextResponse.json({ error: err.message || 'Failed to update review' }, { status: 500 });
  }
});

export const DELETE = requireAdmin(async (req, { params }) => {
  try {
    await dbConnect();
    const resolvedParams = await params;
    const id = resolvedParams?.id || resolvedParams?.reviewId;

    const review = await Review.findByIdAndDelete(id);
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Recalculate product rating
    const approvedReviews = await Review.find({
      product: review.product,
      isApproved: true,
      reviewStatus: 'approved',
    }).select('rating').lean();

    const count = approvedReviews.length;
    const avg = count > 0
      ? Number((approvedReviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / count).toFixed(1))
      : 0;

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
});
