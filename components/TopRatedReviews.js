'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Star, CheckCircle2, ArrowRight, X, PenSquare, MessageSquare } from 'lucide-react';
import { LotusOrnament } from './RelatedProductsCarousel';
import toast from 'react-hot-toast';

const FONT_OUTFIT = "'Outfit', sans-serif";

/**
 * Format ISO date string into 'DD MMM YYYY'
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Calculate rating percentage distribution from real reviews
 */
function calculateDistribution(reviews) {
  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const total = reviews?.length || 0;

  if (total > 0) {
    reviews.forEach((r) => {
      const rounded = Math.round(Number(r.rating) || 5);
      const key = Math.max(1, Math.min(5, rounded));
      counts[key] = (counts[key] || 0) + 1;
    });
  }

  return [5, 4, 3, 2, 1].map((star) => ({
    star,
    pct: total > 0 ? Math.round(((counts[star] || 0) / total) * 100) : 0,
    count: counts[star] || 0,
  }));
}

export default function TopRatedReviews({
  productId,
  reviews = [],
  productRating,
  reviewCount,
  onOpenLightbox,
  onReviewAdded,
}) {
  const [allReviewsModalOpen, setAllReviewsModalOpen] = useState(false);
  const [writeModalOpen, setWriteModalOpen] = useState(false);

  // Review Form state
  const [reviewerName, setReviewerName] = useState('');
  const [ratingScore, setRatingScore] = useState(5);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const realReviews = Array.isArray(reviews) ? reviews : [];
  const displayCount = realReviews.length || Number(reviewCount || 0);

  // Calculate live average if reviews exist, else fall back to productRating or 5.0
  const averageRating =
    realReviews.length > 0
      ? realReviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0) / realReviews.length
      : Number(productRating || 5.0);

  // Sort real reviews: highest rating first, then newest first
  const sortedReal = [...realReviews].sort((a, b) => {
    if ((b.rating || 0) !== (a.rating || 0)) return (b.rating || 0) - (a.rating || 0);
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

  const topReviews = sortedReal.slice(0, 3);
  const distribution = calculateDistribution(realReviews);

  async function handleSubmitReview(e) {
    e.preventDefault();
    if (!reviewerName.trim() || !commentText.trim()) {
      toast.error('Please enter your name and comments.');
      return;
    }
    if (!productId) {
      toast.error('Unable to submit review: product ID missing.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: productId,
          customerName: reviewerName.trim(),
          rating: ratingScore,
          comment: commentText.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      toast.success(data.message || 'Thank you! Your review has been submitted.');
      setReviewerName('');
      setCommentText('');
      setRatingScore(5);
      setWriteModalOpen(false);
      if (onReviewAdded) onReviewAdded();
    } catch (err) {
      toast.error(err.message || 'Error submitting review');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-16 sm:mt-24 pt-4" style={{ fontFamily: FONT_OUTFIT }}>
      {/* Section Header with Centered Title & Action Buttons */}
      <div className="relative mb-8">
        {/* Centered Title with Gold Accent */}
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#000000]">
            Top Rated <span className="text-[#C9A227]">Reviews</span>
          </h2>
          <LotusOrnament />
        </div>

        {/* Action Pills (Top Right) */}
        <div className="sm:absolute sm:right-0 sm:top-1 flex items-center justify-center sm:justify-end gap-2 mt-2 sm:mt-0 flex-wrap">
          <button
            type="button"
            onClick={() => setWriteModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-full bg-[#000000] text-white hover:bg-neutral-800 transition-all shadow-sm"
          >
            <PenSquare size={13} className="text-[#C9A227]" />
            <span>Write a Review</span>
          </button>

          {realReviews.length > 0 && (
            <button
              type="button"
              onClick={() => setAllReviewsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-full bg-[#FFFFFF] border border-[#C9A227] text-[#000000] hover:bg-[#F6EFD9] transition-all shadow-sm"
            >
              <span>View All ({displayCount.toLocaleString()})</span>
              <ArrowRight size={13} className="text-[#000000]" />
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Rating Summary + Top Reviews */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
        {/* Column 1: Rating Summary Card */}
        <div className="bg-[#FFFFFF] rounded-[20px] border border-[#C9A227] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            {/* Overall Rating Big Number */}
            <div className="text-center pt-1">
              <span className="text-4xl sm:text-5xl font-bold text-[#000000] tracking-tight">
                {averageRating.toFixed(1)}
              </span>
              <span className="text-2xl sm:text-3xl font-medium text-[#6B6B6B]"> / 5</span>
            </div>

            {/* Centered Stars Row */}
            <div className="flex items-center justify-center gap-1 mt-2.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={18}
                  className={
                    s <= Math.round(averageRating)
                      ? 'fill-[#C9A227] text-[#C9A227]'
                      : 'text-[#E8E8E8]'
                  }
                  strokeWidth={1.5}
                />
              ))}
            </div>

            {/* Reviews Count Text */}
            <p className="text-xs text-[#6B6B6B] text-center mt-1.5 mb-6">
              Based on {displayCount.toLocaleString()} {displayCount === 1 ? 'Review' : 'Reviews'}
            </p>
          </div>

          {/* 5-Star Distribution Progress Bars */}
          <div className="space-y-2.5 pt-2 border-t border-[#E8E8E8]/70">
            {distribution.map((row) => (
              <div key={row.star} className="flex items-center gap-2.5 text-xs">
                <span className="w-7 text-xs font-bold text-[#000000] shrink-0 flex items-center gap-0.5">
                  {row.star}{' '}
                  <Star size={10} className="fill-[#C9A227] text-[#C9A227]" />
                </span>
                <div className="h-2 flex-1 bg-[#EEEEEE] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#C9A227] rounded-full transition-all duration-500"
                    style={{ width: `${row.pct}%` }}
                  />
                </div>
                <span className="w-8 text-right text-xs font-semibold text-[#1A1A1A] shrink-0">
                  {row.pct}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Empty State when no reviews are found */}
        {topReviews.length === 0 ? (
          <div className="col-span-1 md:col-span-1 lg:col-span-3 bg-[#FFFFFF] rounded-[20px] border border-[#E8E8E8] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-full bg-[#FAF7F0] flex items-center justify-center text-[#C9A227] mb-3">
              <MessageSquare size={26} />
            </div>
            <h4 className="text-base sm:text-lg font-bold text-[#000000]">No reviews yet</h4>
            <p className="text-xs sm:text-sm text-[#6B6B6B] max-w-sm mt-1 mb-5">
              Be the first verified customer to share your thoughts and experience with this product.
            </p>
            <button
              type="button"
              onClick={() => setWriteModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-[#000000] text-white hover:bg-neutral-800 transition-all shadow-sm"
            >
              <PenSquare size={14} className="text-[#C9A227]" />
              <span>Write the First Review</span>
            </button>
          </div>
        ) : (
          /* Columns 2, 3, 4: Real Top Review Cards */
          topReviews.map((rev) => {
            const avatarSrc = rev.avatar || rev.customerAvatar || null;
            const name = rev.customerName || 'Verified Customer';
            const initials = name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();
            const reviewDate = rev.date || formatDate(rev.createdAt);

            return (
              <div
                key={rev._id}
                className="bg-[#FFFFFF] rounded-[20px] border border-[#E8E8E8] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Header: Customer Avatar & Name (Left) + Rating (Right) */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 border border-[#E8E8E8] bg-[#F6EFD9]">
                        {avatarSrc ? (
                          <Image
                            src={avatarSrc}
                            alt={name}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-xs text-[#1A1A1A]">
                            {initials}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-[#000000] truncate">
                          {name}
                        </h4>
                        {rev.isVerifiedPurchase && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#C9A227]">
                            <CheckCircle2 size={12} className="fill-[#C9A227] text-white" />
                            <span>Verified Buyer</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Rating Score */}
                    <div className="shrink-0 flex items-center gap-1 bg-[#F6EFD9] text-[#1A1A1A] font-bold text-xs px-2 py-0.5 rounded-full">
                      <span>{Number(rev.rating || 5).toFixed(1)}</span>
                      <Star size={11} className="fill-[#C9A227] text-[#C9A227]" />
                    </div>
                  </div>

                  {/* Review Date */}
                  {reviewDate && (
                    <p className="text-[11.5px] text-[#6B6B6B] mt-2.5">{reviewDate}</p>
                  )}

                  {/* Comment Text */}
                  <p className="text-[13.5px] text-[#1A1A1A] leading-relaxed line-clamp-4 mt-2 font-normal">
                    {rev.comment}
                  </p>
                </div>

                {/* Photo Thumbnails */}
                {rev.images && rev.images.length > 0 && (
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#E8E8E8]/60 overflow-x-auto pb-1 no-scrollbar">
                    {rev.images.map((img, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => onOpenLightbox && onOpenLightbox(img)}
                        className="relative w-16 h-13 sm:w-20 sm:h-16 rounded-lg overflow-hidden border border-[#E8E8E8] shrink-0 hover:scale-105 transition-transform"
                        title="View review photo"
                      >
                        <Image
                          src={img}
                          alt="Customer review photo"
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Write a Review Modal */}
      {writeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] rounded-2xl max-w-lg w-full shadow-2xl border border-[#E8E8E8] overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-[#E8E8E8]">
              <div>
                <h3 className="text-lg font-bold text-[#000000]">Write a Review</h3>
                <p className="text-xs text-[#6B6B6B]">Share your honest feedback with other shoppers</p>
              </div>
              <button
                type="button"
                onClick={() => setWriteModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#FAFAFA] text-[#6B6B6B] hover:text-[#000000] flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="p-5 space-y-4">
              {/* Star Rating Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#000000] mb-2">
                  Overall Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingScore(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        size={28}
                        className={
                          star <= ratingScore
                            ? 'fill-[#C9A227] text-[#C9A227]'
                            : 'text-[#D6D6D6]'
                        }
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-[#000000] ml-2">
                    {ratingScore} out of 5 Stars
                  </span>
                </div>
              </div>

              {/* Customer Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#000000] mb-1.5">
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Arun Kumar"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D6D6D6] outline-none focus:border-[#000000] transition-colors"
                />
              </div>

              {/* Review Comment */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#000000] mb-1.5">
                  Your Review
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="What did you like or dislike? How was the taste, packaging, and freshness?"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D6D6D6] outline-none focus:border-[#000000] transition-colors"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setWriteModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-[#D6D6D6] text-[#6B6B6B] hover:text-[#000000]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#000000] text-white hover:bg-neutral-800 disabled:opacity-50 transition-all shadow-sm"
                >
                  {submitting ? 'Submitting…' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View All Reviews Modal */}
      {allReviewsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-[#E8E8E8] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#E8E8E8]">
              <div>
                <h3 className="text-lg font-bold text-[#000000]">
                  Customer Reviews ({displayCount.toLocaleString()})
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-[#6B6B6B] mt-0.5">
                  <Star size={13} className="fill-[#C9A227] text-[#C9A227]" />
                  <span className="font-bold text-[#000000]">{averageRating.toFixed(1)} out of 5</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAllReviewsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#FAFAFA] text-[#6B6B6B] hover:text-[#000000] flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content - Scrollable List of All Reviews */}
            <div className="p-5 overflow-y-auto space-y-4">
              {sortedReal.map((r, idx) => (
                <div key={r._id || idx} className="p-4 rounded-xl border border-[#E8E8E8] bg-[#FAFAFA]">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-sm text-[#000000]">{r.customerName}</span>
                      {r.isVerifiedPurchase && (
                        <span className="ml-2 text-xs text-[#C9A227] font-semibold">✓ Verified Buyer</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold text-[#000000] bg-[#F6EFD9] px-2 py-0.5 rounded-full">
                      <span>{Number(r.rating || 5).toFixed(1)}</span>
                      <Star size={11} className="fill-[#C9A227] text-[#C9A227]" />
                    </div>
                  </div>
                  {r.createdAt && (
                    <p className="text-xs text-[#6B6B6B] mt-1">{formatDate(r.createdAt)}</p>
                  )}
                  <p className="text-sm text-[#1A1A1A] mt-2 leading-relaxed">{r.comment}</p>
                  {r.images?.length > 0 && (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {r.images.map((img, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setAllReviewsModalOpen(false);
                            onOpenLightbox && onOpenLightbox(img);
                          }}
                          className="relative w-14 h-14 rounded-md overflow-hidden border border-[#E8E8E8] shrink-0"
                        >
                          <Image src={img} alt="" fill unoptimized className="object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
