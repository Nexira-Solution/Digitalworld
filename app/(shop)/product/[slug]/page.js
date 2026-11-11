'use client';

import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Fraunces, Inter } from 'next/font/google';
import {
  Star,
  ShoppingCart,
  Zap,
  Heart,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  X,
  Home,
  Tag,
  Crown,
  Truck,
  MapPin,
  CalendarDays,
  CheckCircle2,
  Leaf,
  FlaskConical,
  ShieldCheck,
  Award,
  HandPlatter,
  Info,
  Minus,
  Plus,
  AlertCircle,
  Sparkles,
  Clock,
  Check,
  Loader2,
} from 'lucide-react';
import { formatINR } from '@/lib/utils';
import { useCart } from '@/components/CartContext';
import RelatedProductsCarousel from '@/components/RelatedProductsCarousel';
import TopRatedReviews from '@/components/TopRatedReviews';
import toast from 'react-hot-toast';

// Typography — Fraunces for luxury headlines, Inter for functional text.
const display = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-display',
});
const body = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
});

const FONT_OUTFIT = "'Outfit', sans-serif";

// Design tokens — exact brand palette
const BLACK = '#000000';
const GOLD = '#C9A227';
const WHITE = '#FFFFFF';
const GREY = '#5E5E5E';
const BORDER = '#E7E2D6';

/**
 * Dynamic Trust Badge Icon Resolver
 */
function renderTrustIcon(iconName) {
  const normalized = (iconName || '').toLowerCase().replace(/[^a-z]/g, '');
  switch (normalized) {
    case 'leaf':
      return <Leaf size={20} />;
    case 'flaskconical':
    case 'flask':
      return <FlaskConical size={20} />;
    case 'shieldcheck':
    case 'shield':
      return <ShieldCheck size={20} />;
    case 'award':
      return <Award size={20} />;
    case 'handplatter':
    case 'hand':
      return <HandPlatter size={20} />;
    case 'truck':
      return <Truck size={20} />;
    case 'sparkles':
      return <Sparkles size={20} />;
    case 'heart':
      return <Heart size={20} />;
    case 'clock':
      return <Clock size={20} />;
    case 'checkcircle2':
    case 'check':
      return <CheckCircle2 size={20} />;
    case 'zap':
      return <Zap size={20} />;
    default:
      return <ShieldCheck size={20} />;
  }
}

/**
 * Format target delivery date
 */
function formatEstimatedDate(days = 2) {
  const target = new Date();
  target.setDate(target.getDate() + Number(days));
  return target.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export default function ProductPage() {
  const { slug } = useParams();
  const router = useRouter();

  const [data, setData] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [activeVariant, setActiveVariant] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [activeSize, setActiveSize] = useState('');
  const [activeSleeve, setActiveSleeve] = useState('');
  const [activeZip, setActiveZip] = useState('');
  const [qty, setQty] = useState(1);
  const [wished, setWished] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);

  // Active info tab
  const [activeTab, setActiveTab] = useState('Product Details');

  // Dynamic delivery state backed by backend settings & localStorage
  const [deliveryData, setDeliveryData] = useState({
    pincode: '600001',
    city: 'Chennai',
    state: 'Tamil Nadu',
    addressLine: '',
    estimatedDays: 2,
    formattedDate: '',
    freeDeliveryAbove: 499,
    shippingCharge: 49,
    isCodAvailable: true,
  });

  // Change address modal state
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [inputPincode, setInputPincode] = useState('');
  const [inputCity, setInputCity] = useState('');
  const [inputState, setInputState] = useState('');
  const [inputAddress, setInputAddress] = useState('');
  const [checkingDelivery, setCheckingDelivery] = useState(false);
  const [deliveryCheckResult, setDeliveryCheckResult] = useState(null);

  const { addItem } = useCart();

  useEffect(() => {
    setMounted(true);
    // Restore user's saved delivery location if stored
    try {
      const saved = localStorage.getItem('user_delivery_address');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.pincode) {
          setDeliveryData((prev) => ({
            ...prev,
            ...parsed,
            formattedDate: parsed.formattedDate || formatEstimatedDate(parsed.estimatedDays || 2),
          }));
        }
      }
    } catch {}
  }, []);

  const loadProduct = useCallback(() => {
    if (!slug) return;
    fetch(`/api/products/${slug}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok || !d.product) {
          setNotFound(true);
          return;
        }
        setData(d);
        const firstVariant = d.product.variants?.[0] || null;
        setActiveVariant(firstVariant);

        // Auto-select size: choose first available size or size with stock
        const sizes = firstVariant?.sizes || [];
        const preferredSize =
          sizes.find((s) => (s.stock || 0) > 0)?.size ||
          sizes[0]?.size ||
          'Standard';
        setActiveSize(preferredSize);

        // Populate dynamic backend delivery info if not overridden by local storage
        if (d.deliveryInfo) {
          setDeliveryData((prev) => {
            const hasCustomUserAddress = Boolean(prev.pincode && prev.pincode !== '600001');
            return {
              ...prev,
              freeDeliveryAbove: d.deliveryInfo.freeDeliveryAbove ?? prev.freeDeliveryAbove,
              shippingCharge: d.deliveryInfo.shippingCharge ?? prev.shippingCharge,
              dispatchDays: d.deliveryInfo.dispatchDays || prev.dispatchDays,
              // If user hasn't set their own pincode, take backend default
              ...(!hasCustomUserAddress
                ? {
                    pincode: d.deliveryInfo.pincode || prev.pincode,
                    city: d.deliveryInfo.city || prev.city,
                    state: d.deliveryInfo.state || prev.state,
                    estimatedDays: d.deliveryInfo.estimatedDays || prev.estimatedDays,
                    formattedDate: formatEstimatedDate(d.deliveryInfo.estimatedDays || 2),
                  }
                : {}),
            };
          });
        }
      })
      .catch(() => {
        setNotFound(true);
      });
  }, [slug]);

  useEffect(() => {
    setData(null);
    setNotFound(false);
    setActiveImage(0);
    setActiveSleeve('');
    setActiveZip('');
    setQty(1);
    loadProduct();
  }, [slug, loadProduct]);

  // Open Change Address Modal
  const handleOpenAddressModal = () => {
    setInputPincode(deliveryData.pincode || '');
    setInputCity(deliveryData.city || '');
    setInputState(deliveryData.state || '');
    setInputAddress(deliveryData.addressLine || '');
    setDeliveryCheckResult(null);
    setAddressModalOpen(true);
  };

  // Check delivery via backend API /api/delivery/check
  const handleCheckDelivery = async (pinToCheck) => {
    const pin = String(pinToCheck || inputPincode).trim();
    if (!/^\d{6}$/.test(pin)) {
      toast.error('Please enter a valid 6-digit Indian pincode');
      return;
    }

    setCheckingDelivery(true);
    setDeliveryCheckResult(null);

    try {
      const res = await fetch('/api/delivery/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pincode: pin,
          city: inputCity,
          state: inputState,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Delivery check failed');
      }

      setDeliveryCheckResult(data);
      setInputCity(data.city);
      setInputState(data.state);
      toast.success(data.message || 'Delivery available!');
    } catch (err) {
      toast.error(err.message || 'Error checking pincode');
    } finally {
      setCheckingDelivery(false);
    }
  };

  // Save selected delivery address
  const handleSaveDeliveryAddress = (e) => {
    e.preventDefault();
    const pin = inputPincode.trim();
    if (!/^\d{6}$/.test(pin)) {
      toast.error('Please enter a valid 6-digit pincode');
      return;
    }

    const city = inputCity.trim() || deliveryCheckResult?.city || 'Selected City';
    const state = inputState.trim() || deliveryCheckResult?.state || 'India';
    const days = deliveryCheckResult?.estimatedDays || deliveryData.estimatedDays || 2;
    const formattedDate = deliveryCheckResult?.formattedDate || formatEstimatedDate(days);

    const updated = {
      ...deliveryData,
      pincode: pin,
      city,
      state,
      addressLine: inputAddress.trim(),
      estimatedDays: days,
      formattedDate,
      freeDeliveryAbove: deliveryCheckResult?.freeDeliveryAbove || deliveryData.freeDeliveryAbove,
      shippingCharge: deliveryCheckResult?.shippingCharge || deliveryData.shippingCharge,
    };

    setDeliveryData(updated);
    try {
      localStorage.setItem('user_delivery_address', JSON.stringify(updated));
    } catch {}

    setAddressModalOpen(false);
    toast.success(`Delivery address updated to ${city} - ${pin}`);
  };

  if (notFound) {
    return (
      <div
        className={`${body.className} min-h-screen flex items-center justify-center px-5`}
        style={{ background: WHITE }}
      >
        <div className="flex flex-col items-center gap-3 text-center" style={{ color: GREY }}>
          <h1 className={`${display.className} text-2xl font-bold`} style={{ color: BLACK }}>
            Product not found
          </h1>
          <p className="text-sm">This product may have been removed or is no longer available.</p>
          <Link
            href="/"
            className="mt-2 px-6 py-2.5 text-sm font-semibold rounded-full bg-black text-white hover:bg-neutral-800 transition-all shadow-sm"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!data?.product) {
    return (
      <div
        className={`${body.className} min-h-screen flex items-center justify-center`}
        style={{ background: WHITE }}
      >
        <div className="flex flex-col items-center gap-3" style={{ color: GREY }}>
          <div
            className="w-8 h-8 border-2 rounded-full animate-spin"
            style={{ borderColor: BORDER, borderTopColor: GOLD }}
          />
          <p className="text-sm font-medium">Loading authentic product details…</p>
        </div>
      </div>
    );
  }

  const { product, reviews, related } = data;

  // Resolve gallery images dynamically from activeVariant and product
  const rawImages = [
    ...(activeVariant?.images?.filter(Boolean) || []),
    ...(product.images?.filter(Boolean) || []),
    ...(product.image ? [product.image] : []),
  ];
  const uniqueImages = Array.from(new Set(rawImages));
  const galleryImages = uniqueImages.length > 0 ? uniqueImages : ['/images/placeholder.svg'];

  // Resolve available pack options dynamically
  const backendSizes = activeVariant?.sizes || [];
  const packOptions =
    backendSizes.length > 0
      ? backendSizes.map((s) => s.size)
      : ['Standard'];

  // Selected pack price calculation
  const selectedSizeObj = backendSizes.find((s) => s.size === activeSize) || backendSizes[0];

  const basePrice = Number(product.basePrice || activeVariant?.price || 0);
  const comparePrice = Number(activeVariant?.compareAtPrice || 0);

  const unitPrice =
    selectedSizeObj && selectedSizeObj.price !== undefined && selectedSizeObj.price !== null && Number(selectedSizeObj.price) > 0
      ? Number(selectedSizeObj.price)
      : basePrice;

  const unitCompareAtPrice =
    selectedSizeObj && selectedSizeObj.compareAtPrice !== undefined && selectedSizeObj.compareAtPrice !== null && Number(selectedSizeObj.compareAtPrice) > 0
      ? Number(selectedSizeObj.compareAtPrice)
      : comparePrice;

  // Stock calculation — strictly enforce stock warning ONLY when stock < 5
  const selectedStock = selectedSizeObj ? Number(selectedSizeObj.stock ?? 0) : 0;
  const isOutOfStock = selectedStock <= 0;
  const isLowStock = selectedStock > 0 && selectedStock < 5;

  // Discount & Savings
  const discountPct =
    unitCompareAtPrice > unitPrice
      ? Math.round(((unitCompareAtPrice - unitPrice) / unitCompareAtPrice) * 100)
      : Number(product.discountPercentage || 0);
  const savingsAmount = unitCompareAtPrice > unitPrice ? unitCompareAtPrice - unitPrice : 0;

  // Total calculation
  const totalPrice = unitPrice * qty;

  // Dynamic reviews calculation
  const reviewItems = Array.isArray(reviews) ? reviews : [];
  const totalReviewsCount = reviewItems.length || Number(product.numReviews || product.reviewCount || 0);
  const averageRating =
    reviewItems.length > 0
      ? reviewItems.reduce((acc, r) => acc + (Number(r.rating) || 0), 0) / reviewItems.length
      : Number(product.rating || 5.0);

  // Dynamic star distribution
  const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  if (reviewItems.length > 0) {
    reviewItems.forEach((r) => {
      const s = Math.max(1, Math.min(5, Math.round(Number(r.rating) || 5)));
      starCounts[s] = (starCounts[s] || 0) + 1;
    });
  }
  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    pct: reviewItems.length > 0 ? Math.round(((starCounts[star] || 0) / reviewItems.length) * 100) : 0,
    count: starCounts[star] || 0,
  }));

  // Dynamic promotional offers from backend
  const offersList =
    Array.isArray(data.offers) && data.offers.length > 0
      ? data.offers
      : Array.isArray(product.offers) && product.offers.length > 0
      ? product.offers
      : [
          discountPct > 0 ? `${discountPct}% Instant Discount (Limited Time)` : null,
          'Extra 10% off on Prepaid Orders',
          `Free Delivery above ${formatINR(deliveryData.freeDeliveryAbove)}`,
          'Secure & Hygienic Packaging',
        ].filter(Boolean);

  // Dynamic trust badges from backend
  const trustBadges =
    Array.isArray(data.trustBadges) && data.trustBadges.length > 0
      ? data.trustBadges
      : Array.isArray(product.trustBadges) && product.trustBadges.length > 0
      ? product.trustBadges
      : [
          { title: '100% Natural', subtitle: 'No Preservatives', icon: 'Leaf' },
          { title: 'Hygienically', subtitle: 'Prepared', icon: 'FlaskConical' },
          { title: 'Premium', subtitle: 'Quality Tested', icon: 'ShieldCheck' },
          { title: 'Authentic', subtitle: 'Kerala Recipe', icon: 'Award' },
          { title: 'Freshly', subtitle: 'Packed', icon: 'HandPlatter' },
        ];

  // Handlers
  const handleThumbnailClick = (index) => setActiveImage(index);
  const prevImage = () =>
    setActiveImage((i) => (i === 0 ? galleryImages.length - 1 : i - 1));
  const nextImage = () =>
    setActiveImage((i) => (i === galleryImages.length - 1 ? 0 : i + 1));

  const handlePackChange = (size) => {
    setActiveSize(size);
    setQty(1);
  };

  const handleQtyDecrease = () => setQty((q) => Math.max(1, q - 1));
  const handleQtyIncrease = () =>
    setQty((q) => (selectedStock > 0 ? Math.min(selectedStock, q + 1) : q + 1));

  function buildCartPayload() {
    return {
      productId: product._id,
      variantId: activeVariant?._id,
      comboId: null,
      name: product.name,
      image: galleryImages[0],
      color: activeVariant?.color || '-',
      size: activeSize || 'Standard',
      price: unitPrice,
      qty,
      stock: selectedStock,
      deliveryPincode: deliveryData.pincode,
      deliveryCity: deliveryData.city,
    };
  }

  function handleAddToCart() {
    if (isOutOfStock) {
      toast.error('This pack size is currently out of stock');
      return;
    }
    addItem(buildCartPayload());
    toast.success('Added to your cart!');
  }

  function handleBuyNow() {
    if (isOutOfStock) {
      toast.error('This pack size is currently out of stock');
      return;
    }
    addItem(buildCartPayload());
    router.push('/checkout');
  }

  // Smooth scroll helper for tabs
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (tab === 'Reviews') {
      const el = document.getElementById('reviews-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (tab === 'Related Products') {
      const el = document.getElementById('related-products-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      const el = document.getElementById('product-details-content');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div
      className={`${body.className} ${display.variable} min-h-screen bg-[#FFFFFF]`}
      style={{ fontFamily: FONT_OUTFIT }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-20">
        {/* ===================== SECTION 01: BREADCRUMB ===================== */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs text-[#5E5E5E] py-3 mb-4 overflow-x-auto no-scrollbar"
        >
          <Link
            href="/"
            className="flex items-center gap-1 hover:text-[#000000] transition-colors shrink-0"
          >
            <Home size={14} className="text-[#5E5E5E]" />
            <span>Home</span>
          </Link>
          <ChevronRight size={13} className="text-[#BDBDBD] shrink-0" />
          <Link
            href={`/category/${product.category?.slug || 'products'}`}
            className="hover:text-[#000000] transition-colors shrink-0"
          >
            {product.category?.name || 'Products'}
          </Link>
          <ChevronRight size={13} className="text-[#BDBDBD] shrink-0" />
          <span className="font-semibold text-[#000000] truncate max-w-[200px] sm:max-w-xs">
            {product.name}
          </span>
        </nav>

        {/* ===================== SECTION 02 & 03: FOUR-AREA MAIN PRODUCT LAYOUT ===================== */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* AREA 1: Vertical Thumbnail Navigation (Desktop: 72px) */}
          {galleryImages.length > 1 && (
            <div className="hidden lg:flex flex-col items-center w-[72px] shrink-0 gap-2">
              <button
                type="button"
                onClick={prevImage}
                aria-label="Previous image"
                className="w-8 h-8 rounded-full bg-white border border-[#E8E8E8] shadow-sm flex items-center justify-center hover:bg-[#FAF7F0] transition-all text-[#000000]"
              >
                <ChevronUp size={16} />
              </button>

              <div className="flex flex-col gap-3 py-1">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleThumbnailClick(idx)}
                    className={`relative w-[72px] h-[80px] rounded-xl overflow-hidden transition-all bg-[#FAF7F0] ${
                      activeImage === idx
                        ? 'border-2 border-[#C9A227] shadow-sm scale-102'
                        : 'border-2 border-transparent hover:border-[#E8E8E8] opacity-75 hover:opacity-100'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} thumbnail ${idx + 1}`}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={nextImage}
                aria-label="Next image"
                className="w-8 h-8 rounded-full bg-white border border-[#E8E8E8] shadow-sm flex items-center justify-center hover:bg-[#FAF7F0] transition-all text-[#000000]"
              >
                <ChevronDown size={16} />
              </button>
            </div>
          )}

          {/* AREA 2: Main Product Image */}
          <div className="w-full lg:w-[36%] shrink-0">
            <div className="relative aspect-[4/4.3] w-full rounded-[20px] overflow-hidden bg-[#FBF6E9] shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-[#E7E2D6]/70">
              {galleryImages[activeImage] && (
                <Image
                  src={galleryImages[activeImage]}
                  alt={product.name}
                  fill
                  unoptimized
                  priority
                  className="object-cover transition-transform duration-500 ease-out"
                />
              )}

              {/* Badges (Top-Left): Crown for Best Seller, Discount Badge */}
              <div className="absolute top-3.5 left-3.5 z-10 flex flex-col gap-1.5 pointer-events-none">
                {product.isBestSeller && (
                  <span className="inline-flex items-center gap-1.5 bg-[#F5C542] text-[#000000] font-bold text-xs px-3 py-1 rounded-full shadow-sm">
                    <Crown size={13} className="fill-[#000000] text-[#000000]" />
                    <span>Best Seller</span>
                  </span>
                )}
                {discountPct > 0 && (
                  <span className="inline-flex items-center text-white bg-[#DC2626] font-bold text-xs px-3 py-1 rounded-full shadow-sm tracking-tight">
                    {discountPct}% OFF
                  </span>
                )}
              </div>

              {/* Wishlist Button (Top-Right) */}
              <button
                type="button"
                onClick={() => {
                  setWished((w) => !w);
                  toast.success(wished ? 'Removed from wishlist' : 'Saved to wishlist');
                }}
                aria-label={wished ? 'Remove from wishlist' : 'Save to wishlist'}
                className="absolute top-3.5 right-3.5 z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white shadow-md flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
              >
                <Heart
                  size={18}
                  className={
                    wished ? 'fill-[#C9A227] text-[#C9A227]' : 'text-[#000000] hover:text-[#C9A227]'
                  }
                  strokeWidth={wished ? 2 : 1.75}
                />
              </button>

              {/* Left / Right Carousel Arrow Buttons */}
              {galleryImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prevImage}
                    aria-label="Previous image"
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm shadow-md border border-[#E8E8E8] flex items-center justify-center text-[#000000] hover:bg-white active:scale-95 transition-all"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={nextImage}
                    aria-label="Next image"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm shadow-md border border-[#E8E8E8] flex items-center justify-center text-[#000000] hover:bg-white active:scale-95 transition-all"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}

              {/* Bottom Center Indicator Dots */}
              {galleryImages.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/20 backdrop-blur-sm px-2.5 py-1 rounded-full">
                  {galleryImages.map((_, i) => (
                    <span
                      key={i}
                      className={`transition-all rounded-full ${
                        activeImage === i ? 'w-4 h-1.5 bg-[#C9A227]' : 'w-1.5 h-1.5 bg-white/80'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Mobile / Tablet Horizontal Thumbnails */}
            {galleryImages.length > 1 && (
              <div className="flex lg:hidden gap-2.5 mt-3 overflow-x-auto pb-1 no-scrollbar">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleThumbnailClick(idx)}
                    className={`relative w-16 h-16 rounded-xl overflow-hidden shrink-0 transition-all ${
                      activeImage === idx
                        ? 'border-2 border-[#C9A227] shadow-sm'
                        : 'border-2 border-transparent opacity-70'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} thumb ${idx}`}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* AREA 3: Product Information (~38% width) */}
          <div className="flex-1 min-w-0 lg:max-w-[38%] space-y-3.5">
            {/* Category Tag Badge */}
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FBF6E9] text-[#000000] border border-[#E7E2D6]/80">
                <Tag size={12} className="text-[#C9A227]" />
                <span>{product.category?.name || 'Gourmet Store'}</span>
              </span>
            </div>

            {/* Product Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-bold text-[#000000] tracking-tight leading-snug">
              {product.name}
            </h1>

            {/* Rating & Real Review Statistics */}
            <div className="flex items-center gap-2 text-xs sm:text-sm text-[#5E5E5E] flex-wrap">
              <div className="flex items-center gap-1 font-bold text-[#000000]">
                <Star size={15} className="fill-[#C9A227] text-[#C9A227]" />
                <span>{averageRating.toFixed(1)}</span>
              </div>
              <span className="text-[#5E5E5E]">
                ({totalReviewsCount.toLocaleString()} {totalReviewsCount === 1 ? 'Review' : 'Reviews'})
              </span>
              {product.soldCount && (
                <>
                  <span className="text-[#E7E2D6] font-bold">•</span>
                  <span className="font-semibold text-[#000000]">{product.soldCount.toLocaleString()}+ Sold</span>
                </>
              )}
            </div>

            {/* Short Product Description */}
            {product.description && (
              <p className="text-sm sm:text-[15px] text-[#333333] leading-relaxed line-clamp-3">
                {product.description}
              </p>
            )}

            {/* Pack Size Selector (Single Horizontal Row) */}
            <div className="pt-2">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                <span className="text-xs font-bold text-[#000000] shrink-0">Pack Size:</span>
                <div className="flex items-center gap-2 shrink-0">
                  {packOptions.map((size) => {
                    const isSelected = activeSize === size;
                    const sizeItem = backendSizes.find((s) => s.size === size);
                    const isSoldOut = sizeItem && sizeItem.stock <= 0;
                    return (
                      <button
                        key={size}
                        type="button"
                        disabled={isSoldOut}
                        onClick={() => handlePackChange(size)}
                        className={`text-xs px-4 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap ${
                          isSelected
                            ? 'bg-[#000000] text-[#FFFFFF] shadow-sm'
                            : isSoldOut
                            ? 'bg-neutral-100 text-neutral-400 line-through cursor-not-allowed opacity-60'
                            : 'bg-[#FFFFFF] text-[#000000] border border-[#D6D6D6] hover:border-[#000000]'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Stock Warning Badge: STRICT RULE — ONLY show when stock < 5 */}
            {isOutOfStock ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FDE8E8] text-[#C81E1E]">
                <AlertCircle size={13} />
                <span>Out of Stock</span>
              </div>
            ) : isLowStock ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FEF08A] text-[#854D0E]">
                <AlertCircle size={13} />
                <span>Only {selectedStock} {selectedStock === 1 ? 'Pack' : 'Packs'} Left</span>
              </div>
            ) : null /* When stock >= 5, show nothing */}

            {/* Quantity Selector & Item Total */}
            <div className="flex items-center gap-3 pt-1 flex-wrap">
              <span className="text-xs font-bold text-[#000000] shrink-0">Quantity:</span>
              <div className="inline-flex items-center border border-[#D6D6D6] rounded-xl bg-white shadow-xs">
                <button
                  type="button"
                  onClick={handleQtyDecrease}
                  aria-label="Decrease quantity"
                  className="w-9 h-9 flex items-center justify-center text-[#000000] hover:bg-neutral-50 active:scale-95 transition-all rounded-l-xl"
                >
                  <Minus size={14} />
                </button>
                <span className="w-10 text-center text-sm font-bold text-[#000000]">{qty}</span>
                <button
                  type="button"
                  onClick={handleQtyIncrease}
                  aria-label="Increase quantity"
                  className="w-9 h-9 flex items-center justify-center text-[#000000] hover:bg-neutral-50 active:scale-95 transition-all rounded-r-xl"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Item Total Pill */}
              <div className="inline-flex items-center px-3.5 py-1.5 rounded-xl bg-[#FAF7F0] border border-[#E7E2D6] text-xs font-semibold text-[#1A1A1A]">
                Total ({qty} Item{qty > 1 ? 's' : ''}):{' '}
                <span className="font-bold text-[#000000] ml-1">{formatINR(totalPrice)}</span>
              </div>
            </div>

            {/* Pricing Section with Savings Badge */}
            <div className="pt-2 border-t border-[#E7E2D6]/60">
              <div className="flex items-baseline gap-2.5 flex-wrap">
                <span className="text-3xl sm:text-4xl font-bold text-[#000000] tracking-tight">
                  {formatINR(unitPrice)}
                </span>
                {unitCompareAtPrice > unitPrice && (
                  <>
                    <span className="text-sm sm:text-base text-[#5E5E5E] line-through font-normal">
                      {formatINR(unitCompareAtPrice)}
                    </span>
                    {discountPct > 0 && (
                      <span className="text-xs font-bold text-[#DC2626] bg-[#DC2626]/10 px-2.5 py-0.5 rounded-full">
                        {discountPct}% OFF
                      </span>
                    )}
                  </>
                )}
                {savingsAmount > 0 && (
                  <div className="inline-flex items-center gap-1 text-xs font-semibold text-[#1A1A1A] bg-[#F6EFD9] px-3 py-1 rounded-full shrink-0">
                    <Tag size={13} className="text-[#1A1A1A]" />
                    <span>You Save {formatINR(savingsAmount)}</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-[#5E5E5E] mt-1 font-medium">
                {formatINR(unitPrice)} / {activeSize || 'Pack'}
              </p>
            </div>

            {/* Dual Purchase Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-3">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="h-12 rounded-xl text-xs sm:text-sm font-bold border border-[#000000] bg-white text-[#000000] hover:bg-[#FAF7F0] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <ShoppingCart size={17} strokeWidth={2} />
                <span>{isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="h-12 rounded-xl text-xs sm:text-sm font-bold bg-[#000000] text-white hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-sm"
              >
                <Zap size={17} className="fill-white" />
                <span>{isOutOfStock ? 'Out of Stock' : 'Buy Now'}</span>
              </button>
            </div>
          </div>

          {/* AREA 4: Delivery & Offers Card (~26% width) */}
          <div className="w-full lg:w-[26%] shrink-0">
            <div className="bg-white rounded-[20px] p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-[#EEEEEE] space-y-4">
              {/* Delivery Information Header */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#FAF7F0] flex items-center justify-center text-[#C9A227]">
                  <Truck size={17} />
                </div>
                <h3 className="font-bold text-sm text-[#000000]">Delivery Information</h3>
              </div>

              {/* Delivery Location Row with Interactive [Change] button */}
              <div className="flex items-center justify-between text-xs pt-1">
                <div className="flex items-center gap-1.5 text-[#5E5E5E] min-w-0">
                  <MapPin size={14} className="text-[#000000] shrink-0" />
                  <span className="truncate font-medium text-[#1A1A1A]">
                    Deliver to {deliveryData.city} - {deliveryData.pincode}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleOpenAddressModal}
                  className="font-bold text-[#C9A227] hover:underline shrink-0 ml-2"
                >
                  Change
                </button>
              </div>

              {/* Free Delivery Banner (Dynamic Threshold from Backend) */}
              <div className="bg-[#E8F7E5] rounded-xl p-3 flex items-center gap-3 border border-[#E8F7E5]">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-[#16803C] shrink-0">
                  <Truck size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#16803C]">Free Delivery</h4>
                  <p className="text-[11px] text-[#5E5E5E]">
                    on orders above {formatINR(deliveryData.freeDeliveryAbove || 499)}
                  </p>
                </div>
              </div>

              {/* Estimated Delivery Date (Dynamic from Backend) */}
              <div className="flex items-start gap-2.5 text-xs pt-1">
                <CalendarDays size={16} className="text-[#000000] shrink-0 mt-0.5" />
                <div>
                  <p className="text-[#5E5E5E]">Delivery by</p>
                  <p className="font-bold text-[#000000]">
                    {deliveryData.formattedDate || formatEstimatedDate(deliveryData.estimatedDays || 2)}
                  </p>
                  {product.isReadyToShip && (
                    <p className="text-[11px] text-[#16803C] font-semibold mt-0.5 flex items-center gap-1">
                      <Zap size={11} className="fill-[#16803C]" />
                      <span>Ready to Ship (Dispatches in 24h)</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t border-[#EEEEEE] my-3" />

              {/* Offers & Benefits Section (Dynamic from Backend) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Tag size={15} className="text-[#C9A227]" />
                  <h4 className="font-bold text-xs text-[#000000]">Offers & Benefits</h4>
                </div>

                <ul className="space-y-2 text-xs text-[#333333]">
                  {offersList.map((offer, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 size={14} className="text-[#C9A227] shrink-0 mt-0.5" />
                      <span>{offer}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* ===================== SECTION 07: PRODUCT TRUST STRIP (Dynamic from Backend) ===================== */}
        <div className="border-y border-[#EEEEEE] bg-white py-6 my-10">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 text-center">
            {trustBadges.map((badge, idx) => {
              const isLastOdd = idx === trustBadges.length - 1 && trustBadges.length % 2 !== 0;
              return (
                <div
                  key={idx}
                  className={`flex flex-col items-center ${
                    isLastOdd ? 'col-span-2 sm:col-span-1' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-[#FAF7F0] flex items-center justify-center text-[#C9A227] mb-2 shadow-xs">
                    {renderTrustIcon(badge.icon)}
                  </div>
                  <h5 className="font-bold text-xs sm:text-sm text-[#000000]">
                    {badge.title}
                  </h5>
                  {badge.subtitle && (
                    <p className="text-[11px] text-[#5E5E5E]">{badge.subtitle}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ===================== SECTION 08: PRODUCT INFORMATION TABS ===================== */}
        <div className="border-b border-[#E7E2D6] mb-8 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 sm:gap-2">
            {[
              'Product Details',
              'Ingredients',
              'Nutritional Info',
              `Reviews (${totalReviewsCount.toLocaleString()})`,
              'Related Products',
            ].map((tab) => {
              const tabKey = tab.startsWith('Reviews') ? 'Reviews' : tab;
              const isActive = activeTab === tabKey;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => handleTabClick(tabKey)}
                  className={`px-5 py-3 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap rounded-t-xl ${
                    isActive
                      ? 'bg-[#FBF6E9] text-[#000000] border-b-[3px] border-[#C9A227]'
                      : 'text-[#5E5E5E] hover:text-[#000000]'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>

        {/* ===================== SECTION 09: PRODUCT DETAILS CONTENT (2-COLUMN) ===================== */}
        <div id="product-details-content" className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* Left Column: About this Product */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <Info size={18} className="text-[#C9A227]" />
              <h3 className="text-lg font-bold text-[#000000]">
                {activeTab === 'Ingredients'
                  ? 'Ingredients & Composition'
                  : activeTab === 'Nutritional Info'
                  ? 'Nutritional Information & Specifications'
                  : 'About this Product'}
              </h3>
            </div>

            {activeTab === 'Ingredients' ? (
              <p className="text-sm text-[#333333] leading-relaxed">
                {product.attributes?.ingredients ||
                  product.fabric ||
                  'Pure, authentic ingredients prepared according to traditional culinary standards. Free from artificial flavors and preservatives.'}
              </p>
            ) : activeTab === 'Nutritional Info' ? (
              product.specs && product.specs.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm text-left border border-[#E7E2D6] rounded-xl overflow-hidden">
                    <thead className="bg-[#FAF7F0] font-bold text-black border-b border-[#E7E2D6]">
                      <tr>
                        <th className="p-3">Specification / Nutrient</th>
                        <th className="p-3">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E7E2D6] text-[#333333]">
                      {product.specs.map((spec, i) => (
                        <tr key={i}>
                          <td className="p-3 font-medium">{spec.key}</td>
                          <td className="p-3">{spec.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-[#333333] leading-relaxed">
                  {product.attributes?.nutrition ||
                    'Nutritional information per serving is specified on the product packaging. Certified for purity and safety.'}
                </p>
              )
            ) : (
              <p className="text-sm text-[#333333] leading-relaxed">
                {product.description ||
                  'Experience the highest grade of purity and authentic taste, hand-selected and crafted with premium care.'}
              </p>
            )}
          </div>

          {/* Right Column: Compact Product Rating Summary Card */}
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#E7E2D6] p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <Star size={24} className="fill-[#C9A227] text-[#C9A227]" />
              <div>
                <span className="text-2xl font-bold text-[#000000]">
                  {averageRating.toFixed(1)}
                </span>
                <span className="text-sm text-[#5E5E5E]"> / 5</span>
              </div>
            </div>
            <p className="text-xs text-[#5E5E5E] mt-1 mb-4">
              Based on {totalReviewsCount.toLocaleString()} {totalReviewsCount === 1 ? 'Review' : 'Reviews'}
            </p>

            <div className="space-y-1.5 text-xs">
              {ratingDistribution.map((row) => (
                <div key={row.star} className="flex items-center gap-2">
                  <span className="w-5 text-[#000000] font-bold">{row.star} ★</span>
                  <div className="h-2 flex-1 bg-[#EEEEEE] rounded-full overflow-hidden">
                    <div className="h-full bg-[#C9A227] rounded-full" style={{ width: `${row.pct}%` }} />
                  </div>
                  <span className="w-8 text-right text-[#5E5E5E]">{row.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ===================== SECTION 10: RELATED PRODUCTS ===================== */}
        <div id="related-products-section">
          <RelatedProductsCarousel
            related={related}
            currentProductId={product._id}
            currentProductSlug={product.slug}
            currentProductName={product.name}
          />
        </div>

        {/* ===================== SECTION 11: TOP RATED REVIEWS ===================== */}
        <div id="reviews-section">
          <TopRatedReviews
            productId={product._id}
            reviews={reviews}
            productRating={product.rating}
            reviewCount={product.numReviews || product.reviewCount}
            onOpenLightbox={(img) => setLightboxImg(img)}
            onReviewAdded={() => loadProduct()}
          />
        </div>
      </div>

      {/* Change Address & Delivery Modal */}
      {addressModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] rounded-2xl max-w-md w-full shadow-2xl border border-[#E8E8E8] overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-[#E8E8E8]">
              <div>
                <h3 className="text-lg font-bold text-[#000000]">Change Delivery Location</h3>
                <p className="text-xs text-[#6B6B6B]">Check availability and delivery time for your area</p>
              </div>
              <button
                type="button"
                onClick={() => setAddressModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#FAFAFA] text-[#6B6B6B] hover:text-[#000000] flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDeliveryAddress} className="p-5 space-y-4">
              {/* Pincode Input Row */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#000000] mb-1.5">
                  Postal Pincode (6 Digits)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="e.g. 600001"
                    value={inputPincode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setInputPincode(val);
                      if (val.length === 6) handleCheckDelivery(val);
                    }}
                    className="flex-1 px-3.5 py-2.5 text-sm rounded-xl border border-[#D6D6D6] outline-none focus:border-[#000000] font-mono tracking-wider transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => handleCheckDelivery(inputPincode)}
                    disabled={checkingDelivery || inputPincode.length !== 6}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#000000] text-white hover:bg-neutral-800 disabled:opacity-40 transition-all flex items-center gap-1.5"
                  >
                    {checkingDelivery ? (
                      <>
                        <Loader2 size={13} className="animate-spin text-[#C9A227]" />
                        <span>Checking</span>
                      </>
                    ) : (
                      <span>Check</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Real-time Delivery Check Feedback */}
              {deliveryCheckResult && (
                <div className="p-3.5 rounded-xl bg-[#E8F7E5] border border-[#16803C]/20 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-[#16803C]">
                    <CheckCircle2 size={15} />
                    <span>{deliveryCheckResult.message}</span>
                  </div>
                  <p className="text-[#333333] pl-5">
                    Estimated Delivery: <strong className="text-black">{deliveryCheckResult.formattedDate}</strong>
                  </p>
                  <p className="text-[#333333] pl-5">
                    Free Delivery on orders above <strong className="text-black">{formatINR(deliveryCheckResult.freeDeliveryAbove)}</strong>
                  </p>
                </div>
              )}

              {/* City & State (Auto-filled & Editable) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#000000] mb-1.5">
                    City / District
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chennai"
                    value={inputCity}
                    onChange={(e) => setInputCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D6D6D6] outline-none focus:border-[#000000] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#000000] mb-1.5">
                    State
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tamil Nadu"
                    value={inputState}
                    onChange={(e) => setInputState(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D6D6D6] outline-none focus:border-[#000000] transition-colors"
                  />
                </div>
              </div>

              {/* Street Address / Landmark (Optional) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#000000] mb-1.5">
                  Street Address / Landmark (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Flat 4B, Lotus Apartments, Anna Nagar"
                  value={inputAddress}
                  onChange={(e) => setInputAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D6D6D6] outline-none focus:border-[#000000] transition-colors"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setAddressModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-[#D6D6D6] text-[#6B6B6B] hover:text-[#000000]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inputPincode.length !== 6}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#000000] text-white hover:bg-neutral-800 disabled:opacity-40 transition-all shadow-sm"
                >
                  Deliver to this Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sticky Mobile Buy Bar */}
      {mounted &&
        createPortal(
          <div
            className="sm:hidden fixed bottom-0 left-0 right-0 flex items-center gap-3 px-4 py-3 bg-white border-t border-[#E8E8E8] shadow-lg"
            style={{ zIndex: 9999 }}
          >
            <div className="shrink-0">
              <p className="text-base font-bold text-[#000000] leading-none">
                {formatINR(totalPrice)}
              </p>
              {unitCompareAtPrice > unitPrice && (
                <p className="text-[11px] line-through text-[#5E5E5E] leading-none mt-1">
                  {formatINR(unitCompareAtPrice * qty)}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="flex-1 h-11 rounded-xl text-xs font-bold border border-[#000000] bg-white text-[#000000] flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-40"
            >
              <ShoppingCart size={15} />
              <span>Cart</span>
            </button>

            <button
              type="button"
              onClick={handleBuyNow}
              disabled={isOutOfStock}
              className="flex-1 h-11 rounded-xl text-xs font-bold bg-[#000000] text-white flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-40 shadow-sm"
            >
              <Zap size={15} className="fill-white" />
              <span>Buy Now</span>
            </button>
          </div>,
          document.body
        )}

      {/* Lightbox Modal */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxImg(null)}
        >
          <div
            className="relative max-w-3xl w-full aspect-square max-h-[85vh] rounded-2xl overflow-hidden bg-black"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={lightboxImg}
              alt="Enlarged view"
              fill
              unoptimized
              className="object-contain"
            />
            <button
              type="button"
              onClick={() => setLightboxImg(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
