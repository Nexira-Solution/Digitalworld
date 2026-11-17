'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Heart, Flame, Crown, Star, Tag } from 'lucide-react';
import { formatINR } from '@/lib/utils';
import { useWishlist } from '@/components/WhishlistContext';
import {
  getDisplayProductData,
  calculateDiscount,
  calculateSavings,
  getProductStockStatus,
} from '@/lib/productFallback';

const FONT_OUTFIT = "'Outfit', sans-serif";

/**
 * 1. Product Image Component
 * Height: Strictly 60% of total product card height.
 * Width: 100% full card width.
 * Object-fit: cover, centered, responsive, with badges preserved.
 */
export function ProductImage({
  image,
  name,
  href,
  discountPct,
  isBestSeller,
  wishlisted,
  onWishlistClick,
  outOfStock,
}) {
  return (
    <div className="relative h-[60%] w-full overflow-hidden bg-[#FAF7F0] shrink-0">
      <Link href={href} className="block w-full h-full relative" aria-label={name}>
        <Image
          src={image || '/images/placeholder.svg'}
          alt={name}
          fill
          unoptimized
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className={`object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out ${
            outOfStock ? 'grayscale opacity-75' : ''
          }`}
        />
      </Link>

      {/* Top Left: Out of Stock Badge or Discount Pill Badge */}
      {outOfStock ? (
        <div className="absolute top-2 left-2 z-10 pointer-events-none">
          <span className="inline-flex items-center gap-1 bg-[#B3261E] text-white font-bold text-[10px] sm:text-[10.5px] px-2.5 py-0.5 rounded-full shadow-sm tracking-tight uppercase">
            Out of Stock
          </span>
        </div>
      ) : discountPct > 0 ? (
        <div className="absolute top-2 left-2 z-10 pointer-events-none">
          <span className="inline-flex items-center gap-0.5 bg-[#C9A227] text-[#000000] font-bold text-[10px] sm:text-[10.5px] px-2 py-0.5 rounded-full shadow-xs tracking-tight">
            <Flame size={10} className="fill-[#000000] text-[#000000]" />
            <span>{discountPct}% OFF</span>
          </span>
        </div>
      ) : null}

      {/* Top Right: Favorite / Wishlist Button */}
      <button
        type="button"
        onClick={onWishlistClick}
        aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        aria-pressed={wishlisted}
        className="absolute top-2 right-2 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/95 backdrop-blur-xs shadow-md flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
      >
        <Heart
          size={13}
          className={`transition-colors ${
            wishlisted ? 'fill-[#C9A227] text-[#C9A227]' : 'text-[#000000] hover:text-[#C9A227]'
          }`}
          strokeWidth={wishlisted ? 2 : 1.75}
        />
      </button>

      {/* Bottom Left: Best Seller Badge */}
      {isBestSeller && !outOfStock && (
        <div className="absolute bottom-2 left-2 z-10 pointer-events-none">
          <span className="inline-flex items-center gap-0.5 bg-[#F5C542] text-[#000000] font-bold text-[9.5px] sm:text-[10px] px-2 py-0.5 rounded-full shadow-xs">
            <Crown size={10} className="fill-[#000000] text-[#000000]" />
            <span>Best Seller</span>
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * 2. Product Rating Component
 * Star icon, rating score, and review count.
 */
export function ProductRating({ rating, reviewCount }) {
  if (!reviewCount || reviewCount <= 0) {
    return (
      <div className="flex items-center gap-1 text-[10px] text-[#6B6B6B] leading-none">
        <Star size={11} className="text-[#C9A227]" />
        <span className="font-medium text-[#6B6B6B]">New Arrival</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-[10px] leading-none">
      <Star size={11} className="fill-[#F59E0B] text-[#F59E0B]" />
      <span className="font-bold text-[#000000]">{Number(rating || 0).toFixed(1)}</span>
      <span className="text-[#6B6B6B]">({Number(reviewCount || 0).toLocaleString()})</span>
    </div>
  );
}

/**
 * 3. Product Stock Status Badge
 * ONLY displays when stock is strictly less than 5 (low stock warning or out of stock).
 */
export function ProductStock({ stockStatus }) {
  if (!stockStatus?.shouldShow || !stockStatus?.label) {
    return null;
  }

  return (
    <span
      className={`inline-flex items-center text-[9.5px] font-semibold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap ${
        stockStatus.isOut
          ? 'text-[#B3261E] bg-[#FCE8E6] border border-[#B3261E]/30 font-bold'
          : 'text-[#1A1A1A] bg-[#F6EFD9]'
      }`}
    >
      {stockStatus.label}
    </span>
  );
}

/**
 * 4. Pack Size Selector Component
 * Horizontal row with "Pack:" label and selectable pills.
 */
export function PackSizeSelector({ packs, selectedSize, onSelectSize, disabled }) {
  if (!packs || packs.length === 0) return null;

  return (
    <div className="flex flex-row flex-nowrap items-center gap-1 overflow-hidden">
      <span className="text-[10px] font-semibold text-[#000000] shrink-0 whitespace-nowrap">Pack:</span>
      <div className="flex flex-row flex-nowrap items-center gap-1 overflow-x-auto no-scrollbar" role="group" aria-label="Select pack size">
        {packs.map((p) => {
          const isSelected = selectedSize === p.size;
          const isSoldOut = p.stock <= 0;
          return (
            <button
              key={p.size}
              type="button"
              disabled={disabled || isSoldOut}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelectSize(p.size);
              }}
              aria-pressed={isSelected}
              className={`text-[9.5px] sm:text-[10px] px-1.5 py-0.2 rounded-full font-medium whitespace-nowrap transition-all shrink-0 ${
                isSelected
                  ? 'bg-[#000000] text-[#FFFFFF] border border-[#000000] shadow-xs'
                  : isSoldOut
                  ? 'bg-neutral-100 text-neutral-400 border border-[#E8E8E8] line-through cursor-not-allowed opacity-60'
                  : 'bg-[#FFFFFF] text-[#000000] border border-[#D6D6D6] hover:border-[#000000]'
              }`}
            >
              {p.size}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 5. Product Pricing Component
 * Selling price, original price strikethrough, discount %, and savings pill.
 */
export function ProductPricing({
  sellingPrice,
  originalPrice,
  discountPct,
  savings,
}) {
  return (
    <div className="flex items-center justify-between gap-1.5 pt-0.5 border-t border-[#F0F0F0]">
      {/* Left: Selling Price & Original Price */}
      <div className="flex items-baseline gap-1.5 flex-wrap">
        <span className="text-sm sm:text-base font-bold text-[#000000] tracking-tight">
          {formatINR(sellingPrice)}
        </span>
        {originalPrice > sellingPrice && (
          <>
            <span className="text-[10.5px] text-[#6B6B6B] line-through font-normal">
              {formatINR(originalPrice)}
            </span>
            {discountPct > 0 && (
              <span className="text-[9px] font-bold text-[#000000] bg-[#F6EFD9] px-1 py-0.2 rounded-full">
                {discountPct}% OFF
              </span>
            )}
          </>
        )}
      </div>

      {/* Right: You Save Badge */}
      {savings > 0 && (
        <div className="inline-flex items-center gap-0.5 text-[9.5px] font-semibold text-[#1A1A1A] bg-[#F6EFD9] px-1.5 py-0.5 rounded-full shrink-0">
          <Tag size={9} className="text-[#1A1A1A]" />
          <span>Save {formatINR(savings)}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Main ProductCard Component
 * Implements the 60:40 vertical product card layout with exactly 25% height reduction:
 * - Existing: Mobile 460px, Tablet 490px, Desktop 510px
 * - Reduced (Height * 0.75): Mobile 345px, Tablet 368px, Desktop 382px (h-[345px] sm:h-[368px] lg:h-[382px])
 * - Top 60%: Product image, full width, centered, object-cover, discount/bestseller badges, wishlist button.
 * - Bottom 40%: Product details (name, rating, description, pack size pills, pricing, low stock badge).
 * - Click navigates to /product/[slug].
 * - Pack size updates price & stock with e.stopPropagation().
 */
export default function ProductCard({ product, index = 0 }) {
  const router = useRouter();
  const { isWishlisted, toggleWishlist } = useWishlist();

  // Merge backend data with safe frontend fallback for any missing field
  const display = getDisplayProductData(product, index);
  const packs = display.packs;

  // Selected pack variant state (defaults to first pack, e.g. "Standard")
  const [selectedPackSize, setSelectedPackSize] = useState(() => packs[0]?.size || 'Standard');

  // Active pack object and pricing calculations
  const currentPack = packs.find((p) => p.size === selectedPackSize) || packs[0] || {};
  const sellingPrice = currentPack.price ?? 0;
  const originalPrice = currentPack.originalPrice ?? sellingPrice;
  const currentStock = currentPack.stock ?? 0;

  const discountPct = calculateDiscount(sellingPrice, originalPrice);
  const savings = calculateSavings(sellingPrice, originalPrice);
  const allPacksOut = packs.length > 0 && packs.every((p) => Number(p.stock) <= 0);
  const stockStatus = allPacksOut
    ? { status: 'out', label: 'Out of Stock', isLow: false, isOut: true, shouldShow: true }
    : getProductStockStatus(currentStock, 5);
  const outOfStock = stockStatus.isOut;

  const wishlistId = product?._id ?? product?.id ?? display.id;
  const wishlisted = isWishlisted(wishlistId);
  const href = `/product/${product?.slug || display.slug}`;

  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(wishlistId);
  };

  const handleCardClick = () => {
    router.push(href);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative flex flex-col h-[345px] sm:h-[368px] lg:h-[382px] w-full bg-[#FFFFFF] rounded-[18px] border border-[#E8E8E8] shadow-[0_4px_16px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.09)] transition-all duration-300 overflow-hidden cursor-pointer"
      style={{ fontFamily: FONT_OUTFIT }}
    >
      {/* 1. Image Section: Strictly 60% of total card height */}
      <ProductImage
        image={display.image}
        name={display.name}
        href={href}
        discountPct={discountPct}
        isBestSeller={display.isBestSeller}
        wishlisted={wishlisted}
        onWishlistClick={handleWishlistClick}
        outOfStock={outOfStock}
      />

      {/* 2. Content Section: Strictly 40% of total card height */}
      <div className="h-[40%] w-full p-2.5 sm:p-3 flex flex-col justify-between bg-[#FFFFFF] overflow-hidden">
        {/* Row 1: Product Name & Stock Badge (Stock shows ONLY when < 5) */}
        <div className="flex items-center justify-between gap-1.5 min-h-[18px]">
          <Link
            href={href}
            onClick={(e) => e.stopPropagation()}
            className="hover:text-[#C9A227] transition-colors truncate flex-1 min-w-0"
          >
            <h3 className="text-xs sm:text-[13.5px] font-bold text-[#000000] tracking-tight truncate leading-tight">
              {display.name}
            </h3>
          </Link>
          {stockStatus?.shouldShow && <ProductStock stockStatus={stockStatus} />}
        </div>

        {/* Row 2: Star Rating & Review Count */}
        <ProductRating rating={display.rating} reviewCount={display.reviewCount} />

        {/* Row 3: Short Product Description */}
        {display.description && (
          <p className="text-[10px] sm:text-[10.5px] text-[#5E5E5E] line-clamp-1 leading-snug">
            {display.description}
          </p>
        )}

        {/* Row 4: Pack Size Selector */}
        <PackSizeSelector
          packs={packs}
          selectedSize={selectedPackSize}
          onSelectSize={setSelectedPackSize}
          disabled={outOfStock}
        />

        {/* Row 5: Pricing & Savings */}
        <ProductPricing
          sellingPrice={sellingPrice}
          originalPrice={originalPrice}
          discountPct={discountPct}
          savings={savings}
        />
      </div>
    </div>
  );
}
