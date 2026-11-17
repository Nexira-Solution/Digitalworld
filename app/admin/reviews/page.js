'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Check,
  X,
  Star,
  Trash2,
  Plus,
  Loader2,
  ImagePlus,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  ThumbsUp,
  ThumbsDown,
  Store,
  Package,
} from 'lucide-react';

const STATUS_FILTERS = [
  { key: 'all', label: 'All Reviews' },
  { key: 'pending', label: 'Pending Approval' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [products, setProducts] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');
  const [sellerFilter, setSellerFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');

  // Rejection modal
  const [rejectingReview, setRejectingReview] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ all: 'true' });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (productFilter !== 'all') params.set('productId', productFilter);
      if (sellerFilter !== 'all') params.set('sellerId', sellerFilter);
      if (ratingFilter !== 'all') params.set('rating', ratingFilter);

      const res = await fetch(`/api/reviews?${params}`);
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }

  async function loadMetadata() {
    try {
      const [prodRes, sellRes] = await Promise.all([
        fetch('/api/products?limit=200'),
        fetch('/api/admin/sellers'),
      ]);
      const [prodData, sellData] = await Promise.all([prodRes.json(), sellRes.json()]);
      setProducts(prodData.products || []);
      setSellers(sellData.sellers || []);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadMetadata();
  }, []);

  useEffect(() => {
    load();
  }, [statusFilter, productFilter, sellerFilter, ratingFilter]);

  async function updateStatus(id, reviewStatus, rejectionReason = '') {
    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewStatus, rejectionReason }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(
          reviewStatus === 'approved' ? 'Review approved and published' : 'Review rejected'
        );
        load();
      } else {
        toast.error(data.error || 'Failed to update review status');
      }
    } catch {
      toast.error('Network error');
    }
  }

  function handleRejectSubmit(e) {
    e.preventDefault();
    if (!rejectingReview) return;
    if (!rejectionReason.trim()) {
      toast.error('Please enter a rejection reason.');
      return;
    }
    updateStatus(rejectingReview._id, 'rejected', rejectionReason.trim());
    setRejectingReview(null);
    setRejectionReason('');
  }

  async function toggleFeatured(r) {
    try {
      const res = await fetch(`/api/reviews/${r._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: !r.isFeatured }),
      });
      if (res.ok) {
        toast.success(r.isFeatured ? 'Removed from featured' : 'Featured on homepage');
        load();
      }
    } catch {
      toast.error('Failed to toggle featured status');
    }
  }

  async function removeReview(id) {
    if (!confirm('Are you sure you want to permanently delete this review?')) return;
    try {
      const res = await fetch(`/api/reviews/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Review permanently deleted');
        load();
      }
    } catch {
      toast.error('Failed to delete review');
    }
  }

  const pendingCount = reviews.filter((r) => r.reviewStatus === 'pending').length;

  return (
    <div className="space-y-6 pb-20">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E7E2D6]">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
            Customer Reviews & Moderation
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Verify authentic customer purchase feedback, moderate pending submissions, and manage ratings.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E7E2D6] shadow-xs space-y-4">
        {/* Status Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {STATUS_FILTERS.map((f) => {
            const active = statusFilter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setStatusFilter(f.key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  active
                    ? 'bg-[#0F172A] text-white shadow-xs'
                    : 'bg-[#FAF9F5] text-[#64748B] hover:text-[#0F172A] border border-[#E7E2D6]'
                }`}
              >
                {f.label}
                {f.key === 'pending' && pendingCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-[#C9A227] text-black text-[10px] font-black">
                    {pendingCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#F0EFE9]">
          {/* Product Filter */}
          <div>
            <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
              Filter by Product
            </label>
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#D6D6D6] outline-none focus:border-[#0F172A] bg-white"
            >
              <option value="all">All Products ({products.length})</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Supplier Filter */}
          <div>
            <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
              Filter by Supplier
            </label>
            <select
              value={sellerFilter}
              onChange={(e) => setSellerFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#D6D6D6] outline-none focus:border-[#0F172A] bg-white"
            >
              <option value="all">All Suppliers</option>
              <option value="null">Official Platform Store</option>
              {sellers.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.businessName || s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Rating Filter */}
          <div>
            <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
              Filter by Star Rating
            </label>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#D6D6D6] outline-none focus:border-[#0F172A] bg-white"
            >
              <option value="all">All Ratings (1 - 5 Stars)</option>
              <option value="5">5 Stars Only</option>
              <option value="4">4 Stars Only</option>
              <option value="3">3 Stars Only</option>
              <option value="2">2 Stars Only</option>
              <option value="1">1 Star Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="min-h-[250px] flex flex-col items-center justify-center gap-2 bg-white rounded-3xl border border-[#E7E2D6]">
            <Loader2 size={24} className="animate-spin text-[#C9A227]" />
            <p className="text-xs text-[#64748B]">Loading customer reviews…</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#E7E2D6] p-12 text-center space-y-2">
            <Star size={24} className="mx-auto text-[#64748B]" />
            <p className="text-xs font-bold text-[#0F172A]">No reviews found matching the filters.</p>
          </div>
        ) : (
          reviews.map((r) => {
            const status = r.reviewStatus || (r.isApproved ? 'approved' : 'pending');
            const isApproved = status === 'approved';
            const isRejected = status === 'rejected';
            const isPending = status === 'pending';

            return (
              <div
                key={r._id}
                className="bg-white rounded-3xl border border-[#E7E2D6] p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-start justify-between gap-5 transition-all"
              >
                {/* Left: Review Content */}
                <div className="flex-1 space-y-3">
                  {/* Product & Supplier Context */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-[#FAF9F5] border border-[#E7E2D6] text-[#0F172A]">
                      <Package size={13} className="text-[#C9A227]" />
                      <span>{r.product?.name || 'Product'}</span>
                    </span>

                    {r.seller ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-neutral-100 text-[#64748B]">
                        <Store size={12} />
                        <span>Supplier: {r.seller.businessName || r.seller.name}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-[#FAF7EE] text-[#C9A227]">
                        Platform Official
                      </span>
                    )}

                    {r.order && (
                      <span className="text-[11px] text-[#64748B]">
                        Order #{r.order.orderNumber || r.order._id?.slice(-8)}
                      </span>
                    )}
                  </div>

                  {/* Rating & Verified Badge */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={15}
                          className={
                            i < r.rating ? 'fill-[#C9A227] text-[#C9A227]' : 'text-neutral-200'
                          }
                        />
                      ))}
                    </div>

                    {r.isVerifiedPurchase && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <ShieldCheck size={12} />
                        <span>Verified Buyer</span>
                      </span>
                    )}

                    {r.recommends !== undefined && (
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          r.recommends
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                        }`}
                      >
                        {r.recommends ? <ThumbsUp size={11} /> : <ThumbsDown size={11} />}
                        <span>{r.recommends ? 'Recommends Product' : 'Does not recommend'}</span>
                      </span>
                    )}
                  </div>

                  {/* Title & Comment */}
                  <div>
                    {r.title && (
                      <h4 className="font-bold text-sm text-[#0F172A] mb-1">{r.title}</h4>
                    )}
                    <p className="text-xs sm:text-sm text-[#334155] leading-relaxed">
                      {r.comment || 'No textual feedback provided.'}
                    </p>
                  </div>

                  {/* Customer Photos */}
                  {r.images?.length > 0 && (
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      {r.images.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          className="w-14 h-14 rounded-xl overflow-hidden border border-[#E7E2D6] shadow-xs cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(imgUrl, '_blank')}
                        >
                          <img
                            src={imgUrl}
                            alt={`Review photo ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Customer & Timestamp */}
                  <div className="text-[11px] text-[#64748B] flex items-center gap-2 pt-1">
                    <span className="font-bold text-[#0F172A]">{r.customerName}</span>
                    {r.customerEmail && <span>({r.customerEmail})</span>}
                    <span>•</span>
                    <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>

                  {/* Rejection Notice */}
                  {isRejected && r.rejectionReason && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                      <strong className="block font-bold">Admin Rejection Remarks:</strong>
                      <span>{r.rejectionReason}</span>
                    </div>
                  )}
                </div>

                {/* Right: Moderation Controls */}
                <div className="flex md:flex-col items-center md:items-end justify-between md:justify-start gap-3 border-t md:border-t-0 pt-3 md:pt-0 shrink-0">
                  {/* Status Badge */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                      isApproved
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : isRejected
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : 'bg-[#FAF7EE] text-[#C9A227] border-[#E7E2D6]'
                    }`}
                  >
                    {isApproved ? (
                      <CheckCircle2 size={13} />
                    ) : isRejected ? (
                      <AlertCircle size={13} />
                    ) : (
                      <Clock size={13} />
                    )}
                    <span className="capitalize">{status}</span>
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {!isApproved && (
                      <button
                        type="button"
                        onClick={() => updateStatus(r._id, 'approved')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition-colors"
                        title="Approve review"
                      >
                        <Check size={14} />
                        <span>Approve</span>
                      </button>
                    )}

                    {!isRejected && (
                      <button
                        type="button"
                        onClick={() => {
                          setRejectingReview(r);
                          setRejectionReason('');
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 shadow-xs transition-colors"
                        title="Reject review"
                      >
                        <X size={14} />
                        <span>Reject</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => toggleFeatured(r)}
                      className={`p-2 rounded-xl border transition-colors ${
                        r.isFeatured
                          ? 'bg-[#FAF7EE] text-[#C9A227] border-[#E7E2D6]'
                          : 'bg-white text-neutral-400 hover:text-black border-[#D6D6D6]'
                      }`}
                      title={r.isFeatured ? 'Featured on Homepage' : 'Mark as Featured'}
                    >
                      <Star size={15} className={r.isFeatured ? 'fill-[#C9A227]' : ''} />
                    </button>

                    <button
                      type="button"
                      onClick={() => removeReview(r._id)}
                      className="p-2 text-neutral-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors"
                      title="Permanently Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Rejection Modal */}
      {rejectingReview && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setRejectingReview(null)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-md w-full border border-[#E7E2D6] shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#F0EFE9] pb-3">
              <h3 className="font-bold text-sm text-[#0F172A]">Reject Review</h3>
              <button
                type="button"
                onClick={() => setRejectingReview(null)}
                className="p-1 text-neutral-400 hover:text-black"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-[#64748B]">
              Provide rejection remarks explaining why this review was declined. The review will remain hidden from the storefront.
            </p>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">
                  Rejection Remarks *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Inappropriate language, unrelated feedback, or violates community guidelines."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#D6D6D6] outline-none focus:border-[#0F172A] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingReview(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-[#D6D6D6] text-[#64748B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
