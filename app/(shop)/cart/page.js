'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart, cartKey } from '@/components/CartContext';
import { formatINR } from '@/lib/utils';
import { Trash2, ShoppingBag, Truck, Tag, ArrowRight, CheckCircle2, Sparkles, X, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const FONT_OUTFIT = "'Outfit', sans-serif";

export default function CartPage() {
  const router = useRouter();
  const { items, updateQty, removeItem, subtotal } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);

  // Fetch active coupons on mount
  useEffect(() => {
    fetch('/api/coupons/active')
      .then((res) => res.json())
      .then((data) => {
        if (data.coupons && Array.isArray(data.coupons)) {
          setAvailableCoupons(data.coupons);
        }
      })
      .catch(() => {});

    // Restore previously applied coupon from sessionStorage if present
    try {
      const saved = sessionStorage.getItem('applied_coupon');
      if (saved) {
        setCouponCode(saved);
        handleApplyCoupon(saved, false);
      }
    } catch {}
  }, []);

  // Shipping Calculation Formula: Strictly FREE if subtotal > 499; if subtotal <= 499, charge Rs. 49
  const isFreeShipping = subtotal > 499;
  const shippingCharge = isFreeShipping ? 0 : 49;
  const amountNeededForFreeShipping = isFreeShipping ? 0 : 500 - subtotal;
  const freeShippingProgress = Math.min(100, Math.round((subtotal / 500) * 100));

  const total = Math.max(0, subtotal - discount + shippingCharge);

  async function handleApplyCoupon(codeToApply, showToast = true) {
    const code = (codeToApply || couponCode).trim().toUpperCase();
    if (!code) {
      if (showToast) toast.error('Please enter a coupon code');
      return;
    }

    setValidatingCoupon(true);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal }),
      });
      const data = await res.json();

      if (!res.ok || !data.valid) {
        setDiscount(0);
        setAppliedCoupon('');
        sessionStorage.removeItem('applied_coupon');
        if (showToast) toast.error(data.message || 'Invalid or expired coupon');
        return;
      }

      setDiscount(data.discount || 0);
      setAppliedCoupon(code);
      sessionStorage.setItem('applied_coupon', code);
      if (showToast) toast.success(data.message || `Coupon ${code} applied successfully!`);
    } catch {
      if (showToast) toast.error('Failed to validate coupon');
    } finally {
      setValidatingCoupon(false);
    }
  }

  function handleRemoveCoupon() {
    setCouponCode('');
    setAppliedCoupon('');
    setDiscount(0);
    sessionStorage.removeItem('applied_coupon');
    toast.success('Coupon removed');
  }

  function handleProceedToCheckout() {
    if (appliedCoupon) {
      sessionStorage.setItem('applied_coupon', appliedCoupon);
      router.push(`/checkout?coupon=${encodeURIComponent(appliedCoupon)}`);
    } else {
      router.push('/checkout');
    }
  }

  if (items.length === 0) {
    return (
      <div
        className="min-h-[75vh] flex items-center justify-center px-4 py-20 bg-[#FAFAFA]"
        style={{ fontFamily: FONT_OUTFIT }}
      >
        <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-12 text-center shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-[#E8E8E8]">
          <div className="w-16 h-16 rounded-full bg-[#FAF7F0] flex items-center justify-center mx-auto mb-5 text-[#C9A227]">
            <ShoppingBag size={32} strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-bold text-[#000000] mb-2">Your Cart is Empty</h1>
          <p className="text-sm text-[#6B6B6B] mb-8 leading-relaxed">
            Discover our handcrafted gourmet banana chips, traditional sweets, and authentic delicacies.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full px-6 py-3.5 text-sm font-bold rounded-xl bg-[#000000] text-white hover:bg-[#C9A227] hover:text-[#000000] transition-all shadow-sm"
          >
            <span>Explore Collection</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] py-8 sm:py-12" style={{ fontFamily: FONT_OUTFIT }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Breadcrumb / Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#000000] tracking-tight">Shopping Cart</h1>
            <p className="text-xs sm:text-sm text-[#6B6B6B] mt-1">
              {items.length} {items.length === 1 ? 'item' : 'items'} in your bag
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#000000] hover:text-[#C9A227] transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Continue Shopping</span>
          </Link>
        </div>

        {/* Free Delivery Incentive Bar */}
        <div className="mb-8 p-4 rounded-2xl bg-white border border-[#E8E8E8] shadow-xs">
          <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
            <div className="flex items-center gap-2 font-semibold">
              <Truck size={17} className={isFreeShipping ? 'text-[#16803C]' : 'text-[#C9A227]'} />
              {isFreeShipping ? (
                <span className="text-[#16803C] font-bold">
                  🎉 Congratulations! You have unlocked FREE Delivery!
                </span>
              ) : (
                <span className="text-[#000000]">
                  Add <strong className="text-[#C9A227]">{formatINR(amountNeededForFreeShipping)}</strong> more to get{' '}
                  <strong>FREE Delivery</strong>
                </span>
              )}
            </div>
            <span className="text-xs font-bold text-[#6B6B6B]">Threshold: ₹499</span>
          </div>
          <div className="h-2 w-full bg-[#EEEEEE] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isFreeShipping ? 'bg-[#16803C]' : 'bg-[#C9A227]'
              }`}
              style={{ width: `${freeShippingProgress}%` }}
            />
          </div>
        </div>

        {/* Main Grid: Cart Items (Left 7 cols) & Summary (Right 5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Cart Items List */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-2xl border border-[#E8E8E8] overflow-hidden shadow-xs divide-y divide-[#F0F0F0]">
              {items.map((item) => {
                const key = cartKey(item);
                return (
                  <div key={key} className="p-4 sm:p-5 flex gap-4 items-center">
                    {/* Item Image */}
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-[#FAF7F0] border border-[#E8E8E8] shrink-0">
                      <Image
                        src={item.image || '/images/placeholder.svg'}
                        alt={item.name}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/product/${item.slug || ''}`}
                          className="font-bold text-sm sm:text-base text-[#000000] hover:text-[#C9A227] transition-colors truncate block"
                        >
                          {item.name}
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeItem(key)}
                          aria-label="Remove item"
                          className="text-[#9E9E9E] hover:text-[#DC2626] transition-colors p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-[#6B6B6B] mt-1">
                        {item.size && (
                          <span className="px-2 py-0.5 rounded-md bg-[#FAF7F0] border border-[#E8E8E8] font-medium text-[#000000]">
                            {item.size}
                          </span>
                        )}
                        {item.color && item.color !== '-' && <span>Color: {item.color}</span>}
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-1">
                        {/* Quantity Counter */}
                        <div className="inline-flex items-center border border-[#D6D6D6] rounded-xl bg-white shadow-xs">
                          <button
                            type="button"
                            onClick={() => updateQty(key, item.qty - 1)}
                            className="w-8 h-8 flex items-center justify-center text-xs font-bold text-[#000000] hover:bg-neutral-50 active:scale-95 transition-all rounded-l-xl"
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-[#000000]">{item.qty}</span>
                          <button
                            type="button"
                            onClick={() => updateQty(key, item.qty + 1)}
                            className="w-8 h-8 flex items-center justify-center text-xs font-bold text-[#000000] hover:bg-neutral-50 active:scale-95 transition-all rounded-r-xl"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>

                        {/* Price Breakdown */}
                        <div className="text-right">
                          <p className="text-sm sm:text-base font-bold text-[#000000]">
                            {formatINR(item.price * item.qty)}
                          </p>
                          {item.qty > 1 && (
                            <p className="text-[11px] text-[#6B6B6B]">
                              {formatINR(item.price)} each
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Security and Trust Notice */}
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#FAF7F0] border border-[#E7E2D6] text-xs text-[#5E5E5E]">
              <CheckCircle2 size={18} className="text-[#C9A227] shrink-0" />
              <span>
                100% Genuine, freshly prepared items dispatched in secure food-grade packaging.
              </span>
            </div>
          </div>

          {/* Right Column: Order Summary & Coupons */}
          <div className="lg:col-span-5 space-y-6">
            {/* Coupon Code Section */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E8E8E8] shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Tag size={16} className="text-[#C9A227]" />
                <h3 className="font-bold text-sm text-[#000000]">Apply Coupon</h3>
              </div>

              {appliedCoupon ? (
                <div className="p-3.5 rounded-xl bg-[#E8F7E5] border border-[#16803C]/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-[#16803C]" />
                    <div>
                      <p className="font-bold text-xs text-[#16803C]">
                        Coupon <strong>{appliedCoupon}</strong> applied!
                      </p>
                      <p className="text-[11px] text-[#333333]">You save {formatINR(discount)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="p-1 rounded-full text-[#16803C] hover:bg-[#16803C]/10 transition-colors"
                  >
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Coupon Code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon(couponCode)}
                    className="flex-1 px-3.5 py-2.5 text-xs font-mono font-bold uppercase tracking-wider rounded-xl border border-[#D6D6D6] outline-none focus:border-[#000000] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyCoupon(couponCode)}
                    disabled={validatingCoupon || !couponCode.trim()}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#000000] text-white hover:bg-neutral-800 disabled:opacity-40 transition-all shrink-0"
                  >
                    {validatingCoupon ? 'Checking…' : 'Apply'}
                  </button>
                </div>
              )}

              {/* 1-Click Available Coupons */}
              {availableCoupons.length > 0 && !appliedCoupon && (
                <div className="pt-2 border-t border-[#F0F0F0] space-y-2">
                  <p className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider">
                    Available Offers
                  </p>
                  <div className="space-y-1.5">
                    {availableCoupons.map((c) => (
                      <button
                        key={c._id || c.code}
                        type="button"
                        onClick={() => {
                          setCouponCode(c.code);
                          handleApplyCoupon(c.code);
                        }}
                        className="w-full text-left p-2 rounded-xl border border-dashed border-[#C9A227] bg-[#FAF7F0] hover:bg-[#F5EED4] transition-colors flex items-center justify-between"
                      >
                        <div className="min-w-0 pr-2">
                          <span className="font-mono font-bold text-xs text-[#000000]">
                            {c.code}
                          </span>
                          <p className="text-[11px] text-[#5E5E5E] truncate">
                            {c.description || `${c.discountValue}% discount`}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-[#C9A227] shrink-0">Apply</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Order Price Breakdown Card */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E8E8E8] shadow-xs space-y-4">
              <h3 className="font-bold text-base text-[#000000]">Order Summary</h3>

              <div className="space-y-2.5 text-xs sm:text-sm text-[#5E5E5E]">
                <div className="flex justify-between">
                  <span>Bag Subtotal</span>
                  <span className="font-semibold text-[#000000]">{formatINR(subtotal)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-[#16803C] font-semibold">
                    <span>Coupon Discount</span>
                    <span>−{formatINR(discount)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span>Delivery Charge</span>
                  <span>
                    {isFreeShipping ? (
                      <span className="font-bold text-[#16803C] bg-[#E8F7E5] px-2 py-0.5 rounded-full text-xs">
                        FREE
                      </span>
                    ) : (
                      <span className="font-semibold text-[#000000]">{formatINR(49)}</span>
                    )}
                  </span>
                </div>

                <div className="border-t border-[#F0F0F0] my-2 pt-2.5 flex justify-between items-baseline">
                  <span className="font-bold text-base text-[#000000]">Total Amount</span>
                  <div className="text-right">
                    <span className="font-bold text-xl sm:text-2xl text-[#000000]">
                      {formatINR(total)}
                    </span>
                    <p className="text-[10px] text-[#6B6B6B]">Inclusive of all taxes</p>
                  </div>
                </div>
              </div>

              {/* Checkout CTA */}
              <button
                type="button"
                onClick={handleProceedToCheckout}
                className="w-full h-12 rounded-xl text-sm font-bold bg-[#000000] text-white hover:bg-[#C9A227] hover:text-[#000000] transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-sm"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
