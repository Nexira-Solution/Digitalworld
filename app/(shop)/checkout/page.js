'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import toast from 'react-hot-toast';
import { useCart, cartKey } from '@/components/CartContext';
import { formatINR } from '@/lib/utils';
import {
  ShieldCheck,
  Truck,
  CreditCard,
  Banknote,
  Tag,
  CheckCircle2,
  CalendarDays,
  Lock,
  ArrowLeft,
  X,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

const FONT_OUTFIT = "'Outfit', sans-serif";

const inputClass =
  'w-full text-sm outline-none transition-colors px-4 py-3 bg-white text-[#000000] ' +
  'border border-[#D6D6D6] rounded-xl placeholder:text-[#8A8A8A] ' +
  'focus:border-[#000000] focus:ring-1 focus:ring-[#000000]';

export default function CheckoutPage() {
  const { items, subtotal, clearCart, updateQty, removeItem, setItemStock } = useCart();
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
  });

  const [coupon, setCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);

  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [submitting, setSubmitting] = useState(false);
  const [checkingStock, setCheckingStock] = useState(false);

  const [shipping, setShipping] = useState(null);
  const [freeShippingAbove, setFreeShippingAbove] = useState(499);
  const [shippingLoading, setShippingLoading] = useState(false);

  const discountedSubtotal = Math.max(0, subtotal - discount);
  const total = shipping !== null ? Math.round(discountedSubtotal + shipping) : null;
  const totalQty = items.reduce((sum, i) => sum + (i.qty || 0), 0);

  // Restore user address from localStorage or URL
  useEffect(() => {
    try {
      const savedAddr = localStorage.getItem('user_delivery_address');
      if (savedAddr) {
        const parsed = JSON.parse(savedAddr);
        setForm((prev) => ({
          ...prev,
          pincode: parsed.pincode || prev.pincode,
          city: parsed.city || prev.city,
          state: parsed.state || prev.state,
          line1: parsed.addressLine || prev.line1,
        }));
      }

      // Check coupon in sessionStorage or URL
      const urlCoupon = new URLSearchParams(window.location.search).get('coupon');
      const sessionCoupon = sessionStorage.getItem('applied_coupon');
      const initialCoupon = urlCoupon || sessionCoupon;
      if (initialCoupon) {
        setCoupon(initialCoupon);
        validateAndApplyCoupon(initialCoupon, false);
      }
    } catch {}

    // Fetch active coupons
    fetch('/api/coupons/active')
      .then((r) => r.json())
      .then((d) => {
        if (d.coupons) setAvailableCoupons(d.coupons);
      })
      .catch(() => {});
  }, [subtotal]);

  // Shipping calculation: Free strictly when discountedSubtotal > 499; Rs 49 if <= 499
  const fetchShipping = useCallback(async () => {
    setShippingLoading(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subtotal: discountedSubtotal, totalQty }),
      });
      const data = await res.json();
      if (res.ok) {
        setShipping(data.shippingCost);
        setFreeShippingAbove(data.freeShippingAbove || 499);
      } else {
        // Fallback rule: strictly free > 499
        setShipping(discountedSubtotal > 499 ? 0 : 49);
      }
    } catch {
      setShipping(discountedSubtotal > 499 ? 0 : 49);
    } finally {
      setShippingLoading(false);
    }
  }, [discountedSubtotal, totalQty]);

  useEffect(() => {
    fetchShipping();
  }, [fetchShipping]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function validateAndApplyCoupon(codeToApply, showToast = true) {
    const code = (codeToApply || coupon).trim().toUpperCase();
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
        if (showToast) toast.error(data.message || 'Invalid coupon');
        return;
      }

      setDiscount(data.discount);
      setAppliedCoupon(code);
      sessionStorage.setItem('applied_coupon', code);
      if (showToast) toast.success(data.message || `Coupon ${code} applied!`);
    } catch {
      if (showToast) toast.error('Could not apply coupon');
    } finally {
      setValidatingCoupon(false);
    }
  }

  function handleRemoveCoupon() {
    setCoupon('');
    setAppliedCoupon('');
    setDiscount(0);
    sessionStorage.removeItem('applied_coupon');
    toast.success('Coupon removed');
  }

  async function validateStockBeforeOrder() {
    setCheckingStock(true);
    try {
      const res = await fetch('/api/cart/validate-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            size: i.size,
            qty: i.qty,
            name: i.name,
          })),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Could not verify stock, please try again');
        return false;
      }

      if (data.valid) return true;

      data.issues.forEach((issue) => {
        const key = cartKey(issue);
        if (issue.reason === 'unavailable' || issue.reason === 'out_of_stock') {
          toast.error(`${issue.name || 'An item'} is out of stock and was removed from your cart`);
          removeItem(key);
        } else if (issue.reason === 'insufficient_stock') {
          toast.error(`Only ${issue.availableStock} left of ${issue.name || 'an item'} — quantity adjusted`);
          updateQty(key, issue.availableStock);
          setItemStock(key, issue.availableStock);
        }
      });

      return false;
    } catch {
      toast.error('Could not verify stock, please try again');
      return false;
    } finally {
      setCheckingStock(false);
    }
  }

  async function placeOrder() {
    if (!form.name || !form.phone || !form.line1 || !form.city || !form.pincode) {
      toast.error('Please fill all required shipping fields');
      return;
    }
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    if (shipping === null) {
      toast.error('Shipping calculation in progress, please wait');
      return;
    }

    setSubmitting(true);

    const stockOk = await validateStockBeforeOrder();
    if (!stockOk) {
      setSubmitting(false);
      return;
    }

    const orderItems = items.map((i) => ({
      productId: i.productId,
      variantId: i.variantId,
      size: i.size,
      sleeveType: i.sleeveType || '',
      zipType: i.zipType || '',
      qty: i.qty,
      isCombo: i.isCombo || false,
      comboId: i.comboId,
    }));

    try {
      if (paymentMethod === 'razorpay') {
        const orderRes = await fetch('/api/payment/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: orderItems,
            customer: { name: form.name, phone: form.phone, email: form.email },
            shippingAddress: form,
            couponCode: appliedCoupon || coupon,
            expectedTotal: total,
          }),
        });
        const orderData = await orderRes.json();
        if (!orderRes.ok) {
          toast.error(orderData.error || 'Payment initialization failed');
          if (orderRes.status === 409) fetchShipping();
          setSubmitting(false);
          return;
        }

        const rzp = new window.Razorpay({
          key: orderData.keyId,
          amount: orderData.order.amount,
          currency: 'INR',
          name: 'MailooBazar',
          description: 'Gourmet Food & Traditional Delicacies',
          order_id: orderData.order.id,
          prefill: { name: form.name, contact: form.phone, email: form.email },
          theme: { color: '#000000' },
          handler: async function (response) {
            const finalRes = await fetch('/api/orders', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                items: orderItems,
                customer: { name: form.name, phone: form.phone, email: form.email },
                shippingAddress: form,
                couponCode: appliedCoupon || coupon,
                paymentMethod: 'razorpay',
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });
            const finalData = await finalRes.json();
            if (finalRes.ok) {
              clearCart();
              sessionStorage.removeItem('applied_coupon');
              router.push(`/order-success/${finalData.order._id}`);
            } else {
              toast.error(
                `Payment verified! Confirming your order. Reference: ${response.razorpay_payment_id}`,
                { duration: 8000 }
              );
              clearCart();
              router.push('/');
            }
            setSubmitting(false);
          },
          modal: { ondismiss: () => setSubmitting(false) },
        });
        rzp.open();
      } else {
        // Cash on Delivery
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: orderItems,
            customer: { name: form.name, phone: form.phone, email: form.email },
            shippingAddress: form,
            couponCode: appliedCoupon || coupon,
            paymentMethod: 'cod',
          }),
        });
        const data = await res.json();
        if (res.ok) {
          clearCart();
          sessionStorage.removeItem('applied_coupon');
          router.push(`/order-success/${data.order._id}`);
        } else {
          toast.error(data.error || 'Could not place COD order');
        }
        setSubmitting(false);
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  const placeOrderDisabled = submitting || shippingLoading || checkingStock || shipping === null;

  // Free shipping reminder
  const amountToFreeShipping =
    freeShippingAbove > 0 && discountedSubtotal <= freeShippingAbove
      ? 500 - discountedSubtotal
      : 0;

  return (
    <div className="min-h-screen bg-[#FAFAFA] py-8 sm:py-12" style={{ fontFamily: FONT_OUTFIT }}>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation / Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#000000] tracking-tight">Checkout</h1>
            <p className="text-xs sm:text-sm text-[#6B6B6B] mt-1 flex items-center gap-1.5">
              <Lock size={14} className="text-[#C9A227]" />
              <span>Secure Encrypted Checkout</span>
            </p>
          </div>
          <Link
            href="/cart"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#000000] hover:text-[#C9A227] transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Cart</span>
          </Link>
        </div>

        {/* Free Shipping Progress Reminder */}
        {amountToFreeShipping > 0 && (
          <div className="mb-6 p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#E7E2D6] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Truck size={16} className="text-[#C9A227]" />
              <span>
                Add <strong className="text-[#000000]">{formatINR(amountToFreeShipping)}</strong> more to get{' '}
                <strong className="text-[#16803C]">FREE Delivery</strong>
              </span>
            </div>
            <Link href="/" className="font-bold text-[#C9A227] hover:underline">
              Add Items +
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (7 Cols): Shipping & Payment Form */}
          <div className="lg:col-span-7 space-y-6">
            {/* Delivery Information Card */}
            <div className="bg-white rounded-2xl p-6 border border-[#E8E8E8] shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-[#F0F0F0] pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#FAF7F0] flex items-center justify-center text-[#C9A227]">
                    <Truck size={17} />
                  </div>
                  <div>
                    <h2 className="font-bold text-base text-[#000000]">Shipping Address</h2>
                    <p className="text-xs text-[#6B6B6B]">Where should we deliver your order?</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#16803C] bg-[#E8F7E5] px-3 py-1 rounded-full">
                  <CalendarDays size={13} />
                  <span>Estimated delivery in 5-6 days</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#000000] mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={form.name}
                      onChange={(e) => update('name', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#000000] mb-1.5">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={form.phone}
                      onChange={(e) => update('phone', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#000000] mb-1.5">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. rahul@example.com"
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#000000] mb-1.5">
                    Street Address / House No. *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Flat / House No., Apartment, Street"
                    value={form.line1}
                    onChange={(e) => update('line1', e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#000000] mb-1.5">
                    Area / Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Near City Center / Landmark"
                    value={form.line2}
                    onChange={(e) => update('line2', e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#000000] mb-1.5">
                      Pincode *
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="600001"
                      value={form.pincode}
                      onChange={(e) => update('pincode', e.target.value.replace(/\D/g, ''))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#000000] mb-1.5">
                      City / District *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Chennai"
                      value={form.city}
                      onChange={(e) => update('city', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#000000] mb-1.5">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tamil Nadu"
                      value={form.state}
                      onChange={(e) => update('state', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="bg-white rounded-2xl p-6 border border-[#E8E8E8] shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-[#F0F0F0] pb-4">
                <div className="w-8 h-8 rounded-full bg-[#FAF7F0] flex items-center justify-center text-[#C9A227]">
                  <CreditCard size={17} />
                </div>
                <div>
                  <h2 className="font-bold text-base text-[#000000]">Payment Method</h2>
                  <p className="text-xs text-[#6B6B6B]">Select how you wish to pay</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Razorpay Online */}
                <label
                  onClick={() => setPaymentMethod('razorpay')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                    paymentMethod === 'razorpay'
                      ? 'border-[#000000] bg-[#FAF7F0]'
                      : 'border-[#E8E8E8] bg-white hover:border-[#CCCCCC]'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'razorpay'}
                    onChange={() => setPaymentMethod('razorpay')}
                    className="mt-1 accent-black"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <CreditCard size={16} className="text-[#000000]" />
                      <span className="font-bold text-sm text-[#000000]">Pay Online</span>
                    </div>
                    <p className="text-xs text-[#5E5E5E] mt-1">
                      UPI, Credit/Debit Cards, Netbanking (Razorpay)
                    </p>
                    <span className="inline-block mt-2 text-[10px] font-bold text-[#16803C] bg-[#E8F7E5] px-2 py-0.5 rounded-full">
                      Extra 10% instant offer eligible
                    </span>
                  </div>
                </label>

                {/* Cash on Delivery */}
                <label
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                    paymentMethod === 'cod'
                      ? 'border-[#000000] bg-[#FAF7F0]'
                      : 'border-[#E8E8E8] bg-white hover:border-[#CCCCCC]'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="mt-1 accent-black"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Banknote size={16} className="text-[#000000]" />
                      <span className="font-bold text-sm text-[#000000]">Cash on Delivery</span>
                    </div>
                    <p className="text-xs text-[#5E5E5E] mt-1">Pay with cash when package arrives</p>
                    <span className="inline-block mt-2 text-[10px] font-bold text-[#5E5E5E] bg-[#EEEEEE] px-2 py-0.5 rounded-full">
                      Available across India
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column (5 Cols): Order Summary & Coupons */}
          <div className="lg:col-span-5 space-y-6">
            {/* Promo Coupon Card */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E8E8E8] shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Tag size={16} className="text-[#C9A227]" />
                <h3 className="font-bold text-sm text-[#000000]">Have a Coupon?</h3>
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
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && validateAndApplyCoupon(coupon)}
                    className="flex-1 px-3.5 py-2.5 text-xs font-mono font-bold uppercase tracking-wider rounded-xl border border-[#D6D6D6] outline-none focus:border-[#000000] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => validateAndApplyCoupon(coupon)}
                    disabled={validatingCoupon || !coupon.trim()}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#000000] text-white hover:bg-neutral-800 disabled:opacity-40 transition-all shrink-0"
                  >
                    {validatingCoupon ? 'Checking…' : 'Apply'}
                  </button>
                </div>
              )}

              {/* 1-Click Available Offers */}
              {availableCoupons.length > 0 && !appliedCoupon && (
                <div className="pt-2 border-t border-[#F0F0F0] space-y-1.5">
                  <p className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider">
                    Available Offers
                  </p>
                  {availableCoupons.map((c) => (
                    <button
                      key={c._id || c.code}
                      type="button"
                      onClick={() => {
                        setCoupon(c.code);
                        validateAndApplyCoupon(c.code);
                      }}
                      className="w-full text-left p-2 rounded-xl border border-dashed border-[#C9A227] bg-[#FAF7F0] hover:bg-[#F5EED4] transition-colors flex items-center justify-between"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="font-mono font-bold text-xs text-[#000000]">{c.code}</span>
                        <p className="text-[11px] text-[#5E5E5E] truncate">
                          {c.description || `${c.discountValue}% discount`}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-[#C9A227] shrink-0">Apply</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Order Summary Card */}
            <aside className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E8E8E8] shadow-xs space-y-4">
              <h3 className="font-bold text-base text-[#000000]">Order Items ({items.length})</h3>

              <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1 divide-y divide-[#F0F0F0]">
                {items.map((i, idx) => (
                  <div key={idx} className="flex justify-between text-xs py-2 gap-2 text-[#5E5E5E]">
                    <div className="min-w-0">
                      <p className="font-bold text-[#000000] truncate">{i.name}</p>
                      <p className="text-[11px] text-[#8A8A8A]">
                        {[i.color, i.size].filter((x) => x && x !== '-').join(' • ')} × {i.qty}
                      </p>
                    </div>
                    <span className="font-bold text-[#000000] shrink-0">
                      {formatINR(i.price * i.qty)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#F0F0F0] pt-3 space-y-2 text-xs sm:text-sm text-[#5E5E5E]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-[#000000]">{formatINR(subtotal)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-[#16803C] font-semibold">
                    <span>Coupon Savings</span>
                    <span>−{formatINR(discount)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span>Shipping Fee</span>
                  <span>
                    {shippingLoading ? (
                      <span className="text-xs text-[#8A8A8A]">Calculating…</span>
                    ) : shipping === 0 ? (
                      <span className="font-bold text-[#16803C] bg-[#E8F7E5] px-2 py-0.5 rounded-full text-xs">
                        FREE
                      </span>
                    ) : (
                      <span className="font-semibold text-[#000000]">{formatINR(shipping || 49)}</span>
                    )}
                  </span>
                </div>

                <div className="border-t border-[#F0F0F0] my-2 pt-2.5 flex justify-between items-baseline">
                  <span className="font-bold text-base text-[#000000]">Total to Pay</span>
                  <div className="text-right">
                    <span className="font-bold text-xl sm:text-2xl text-[#000000]">
                      {total !== null ? formatINR(total) : '—'}
                    </span>
                    <p className="text-[10px] text-[#6B6B6B]">All taxes included</p>
                  </div>
                </div>
              </div>

              {/* Delivery Estimation Pill */}
              <div className="p-3 rounded-xl bg-[#FAF7F0] border border-[#E7E2D6] flex items-center gap-2 text-xs text-[#1A1A1A]">
                <CalendarDays size={16} className="text-[#C9A227] shrink-0" />
                <span>Standard Delivery: <strong>5-6 days</strong> to your doorstep</span>
              </div>

              {/* Place Order Button */}
              <button
                type="button"
                onClick={placeOrder}
                disabled={placeOrderDisabled}
                className="w-full h-12 rounded-xl text-sm font-bold bg-[#000000] text-white hover:bg-[#C9A227] hover:text-[#000000] disabled:bg-[#D9D9D9] disabled:text-[#888888] disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-sm"
              >
                {submitting ? (
                  checkingStock ? (
                    'Checking stock…'
                  ) : (
                    'Processing Order…'
                  )
                ) : shippingLoading ? (
                  'Calculating shipping…'
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    <span>
                      {paymentMethod === 'razorpay' ? 'Proceed to Payment' : 'Confirm Order (COD)'}{' '}
                      {total !== null && `— ${formatINR(total)}`}
                    </span>
                  </>
                )}
              </button>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
