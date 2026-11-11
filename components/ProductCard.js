'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Heart, ShoppingCart, Zap, Check, Flame, Crown, Star, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatINR } from '@/lib/utils';
import { useWishlist } from '@/components/WhishlistContext';
import { useCart } from '@/components/CartContext';
import {
  getDisplayProductData,
  calculateDiscount,
  calculateSavings,
  getProductStockStatus,
} from '@/lib/productFallback';

const FONT_OUTFIT = "'Outfit', sans-serif";

/**
 * 1. Product Image Component
 * Proportions: Wide banner aspect ratio (2.25:1 / 2:1), Cover object fit,
 * Discount badge top-left, favorite button top-right, best-seller bottom-left.
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
    <div className="relative aspect-[2.1/1] sm:aspect-[2.25/1] w-full overflow-hidden bg-[#FAFAFA]">
      <Link href={href} className="block w-full h-full" aria-label={name}>
        <Image
          src={image}
          alt={name}
          fill
          unoptimized
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className={`object-cover group-hover:scale-105 transition-transform duration-500 ease-out ${
            outOfStock ? 'grayscale opacity-75' : ''
          }`}
        />
      </Link>

      {/* Top Left: Discount Pill Badge */}
      {discountPct > 0 && !outOfStock && (
        <div className="absolute top-2.5 left-2.5 z-10">
          <span className="inline-flex items-center gap-1 bg-[#C9A227] text-[#000000] font-bold text-[11px] sm:text-xs px-2.5 py-0.5 rounded-full shadow-sm tracking-tight">
            <Flame size={12} className="fill-[#000000] text-[#000000]" />
            <span>{discountPct}% OFF</span>
          </span>
        </div>
      )}

      {/* Top Right: Favorite / Wishlist Circular Button */}
      <button
        type="button"
        onClick={onWishlistClick}
        aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        aria-pressed={wishlisted}
        className="absolute top-2.5 right-2.5 z-10 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white shadow-md flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
      >
        <Heart
          size={16}
          className={`transition-colors ${
            wishlisted ? 'fill-[#C9A227] text-[#C9A227]' : 'text-[#000000] hover:text-[#C9A227]'
          }`}
          strokeWidth={wishlisted ? 2 : 1.75}
        />
      </button>

      {/* Bottom Left: Best Seller Badge */}
      {isBestSeller && !outOfStock && (
        <div className="absolute bottom-2.5 left-2.5 z-10">
          <span className="inline-flex items-center gap-1 bg-[#C9A227] text-[#000000] font-bold text-[10.5px] sm:text-[11px] px-2.5 py-0.5 rounded-full shadow-sm">
            <Crown size={12} className="fill-[#000000] text-[#000000]" />
            <span>Best Seller</span>
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * 2. Product Rating Component
 * Horizontal row with gold star icon, rating number, and review count.
 */
export function ProductRating({ rating, reviewCount }) {
  if (!reviewCount || reviewCount <= 0) {
    return (
      <div className="flex items-center gap-1 text-xs text-[#6B6B6B]">
        <Star size={13} className="text-[#C9A227]" />
        <span className="font-medium text-[11px] text-[#6B6B6B]">New Arrival</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs">
      <Star size={14} className="fill-[#C9A227] text-[#C9A227]" />
      <span className="font-bold text-[#000000]">{Number(rating || 0).toFixed(1)}</span>
      <span className="text-[#6B6B6B]">({Number(reviewCount || 0).toLocaleString()} Reviews)</span>
    </div>
  );
}

/**
 * 3. Product Stock Status Badge
 * ONLY displays when stock is strictly less than 5 (low stock warning or out of stock).
 * When stock is 5 or more, returns null.
 */
export function ProductStock({ stockStatus }) {
  if (!stockStatus?.shouldShow || !stockStatus?.label) {
    return null;
  }

  return (
    <span className="inline-flex items-center text-[11px] font-semibold text-[#1A1A1A] bg-[#F6EFD9] px-2.5 py-0.5 rounded-full shrink-0 whitespace-nowrap">
      {stockStatus.label}
    </span>
  );
}

/**
 * 4. Pack Size Selector Component
 * Horizontal row with "Pack Size:" label and selectable pill chips.
 * Active: Black background with white text.
 * Unselected: White background with subtle border.
 */
export function PackSizeSelector({ packs, selectedSize, onSelectSize, disabled }) {
  if (!packs || packs.length === 0) return null;

  return (
    <div className="flex flex-row flex-nowrap items-center gap-1.5 pt-0.5 overflow-hidden">
      <span className="text-xs font-semibold text-[#000000] shrink-0 whitespace-nowrap">Pack Size:</span>
      <div className="flex flex-row flex-nowrap items-center gap-1.5 overflow-x-auto no-scrollbar" role="group" aria-label="Select pack size">
        {packs.map((p) => {
          const isSelected = selectedSize === p.size;
          const isSoldOut = p.stock <= 0;
          return (
            <button
              key={p.size}
              type="button"
              disabled={disabled || isSoldOut}
              onClick={() => onSelectSize(p.size)}
              aria-pressed={isSelected}
              className={`text-xs px-2.5 py-0.5 rounded-full font-medium whitespace-nowrap transition-all shrink-0 ${
                isSelected
                  ? 'bg-[#000000] text-[#FFFFFF] border border-[#000000] shadow-sm'
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
 * Selling price (bold large), original price (strikethrough), discount badge,
 * and either "You Save" pill or compact square cart button for carousels.
 */
export function ProductPricing({
  sellingPrice,
  originalPrice,
  discountPct,
  savings,
  compactCart = false,
  onAddToCart,
  added = false,
  outOfStock = false,
}) {
  return (
    <div className="flex items-center justify-between gap-2 pt-1">
      {/* Left: Prices & Discount Badge */}
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-2xl sm:text-[26px] font-bold text-[#000000] tracking-tight">
          {formatINR(sellingPrice)}
        </span>
        {originalPrice > sellingPrice && (
          <>
            <span className="text-xs sm:text-sm text-[#6B6B6B] line-through font-normal">
              {formatINR(originalPrice)}
            </span>
            {discountPct > 0 && (
              <span className="text-[11px] font-bold text-[#000000] bg-[#F6EFD9] px-2 py-0.5 rounded-full">
                {discountPct}% OFF
              </span>
            )}
          </>
        )}
      </div>

      {/* Right: Either Compact Square Cart Button (for carousel) or You Save Badge */}
      {compactCart ? (
        <button
          type="button"
          disabled={outOfStock}
          onClick={onAddToCart}
          className="w-10 h-10 rounded-xl bg-[#000000] text-white hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all active:scale-95 shadow-sm shrink-0"
          aria-label={added ? 'Added to cart' : 'Add to cart'}
          title={added ? 'Added to cart' : 'Add to cart'}
        >
          {added ? (
            <Check size={18} strokeWidth={2.5} className="text-white" />
          ) : (
            <ShoppingCart size={18} strokeWidth={1.75} className="text-white" />
          )}
        </button>
      ) : (
        savings > 0 && (
          <div className="inline-flex items-center gap-1 text-xs font-semibold text-[#1A1A1A] bg-[#F6EFD9] px-2.5 py-1 rounded-full shrink-0">
            <Tag size={13} className="text-[#1A1A1A]" />
            <span>You Save {formatINR(savings)}</span>
          </div>
        )
      )}
    </div>
  );
}

/**
 * 6. Product Action Buttons Component
 * Equal-width "Add to Cart" (white, black border) and "Buy Now" (black solid) buttons.
 */
export function ProductActions({ onAddToCart, onBuyNow, added, outOfStock }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 pt-2">
      {/* Add to Cart */}
      <button
        type="button"
        disabled={outOfStock}
        onClick={onAddToCart}
        className="h-11 rounded-full text-xs sm:text-sm font-semibold border border-[#000000] bg-[#FFFFFF] text-[#000000] hover:bg-[#FAFAFA] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
      >
        {added ? (
          <>
            <Check size={16} strokeWidth={2.5} className="text-[#000000]" />
            <span>Added!</span>
          </>
        ) : (
          <>
            <ShoppingCart size={16} strokeWidth={1.75} className="text-[#000000]" />
            <span>Add to Cart</span>
          </>
        )}
      </button>

      {/* Buy Now */}
      <button
        type="button"
        disabled={outOfStock}
        onClick={onBuyNow}
        className="h-11 rounded-full text-xs sm:text-sm font-semibold bg-[#000000] text-[#FFFFFF] hover:bg-[#222222] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] shadow-sm"
      >
        <Zap size={16} className="fill-[#FFFFFF] text-[#FFFFFF]" />
        <span>Buy Now</span>
      </button>
    </div>
  );
}

/**
 * Main ProductCard Component
 * Implements the exact vertical product card reference design and black & gold brand design system.
 */
export default function ProductCard({ product, index = 0, compactCart = false }) {
  const router = useRouter();
  const { addItem } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  // Merge backend data with safe frontend fallback for any missing field
  const display = getDisplayProductData(product, index);
  const packs = display.packs;

  // Selected pack variant state (defaults to first pack, e.g. "Standard")
  const [selectedPackSize, setSelectedPackSize] = useState(() => packs[0]?.size || 'Standard');
  const [added, setAdded] = useState(false);

  // Active pack object and pricing calculations
  const currentPack = packs.find((p) => p.size === selectedPackSize) || packs[0] || {};
  const sellingPrice = currentPack.price ?? 0;
  const originalPrice = currentPack.originalPrice ?? sellingPrice;
  const currentStock = currentPack.stock ?? 0;

  const discountPct = calculateDiscount(sellingPrice, originalPrice);
  const savings = calculateSavings(sellingPrice, originalPrice);
  const stockStatus = getProductStockStatus(currentStock, 5);
  const outOfStock = stockStatus.isOut;

  // Added confirmation feedback timer
  useEffect(() => {
    if (!added) return;
    const timer = setTimeout(() => setAdded(false), 1600);
    return () => clearTimeout(timer);
  }, [added]);

  const wishlistId = product?._id ?? product?.id ?? display.id;
  const wishlisted = isWishlisted(wishlistId);
  const href = `/product/${product?.slug || display.slug}`;

  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(wishlistId);
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) {
      toast.error('This product is out of stock');
      return;
    }
    const item = {
      productId: product?._id ?? product?.id ?? display.id,
      slug: product?.slug || display.slug,
      variantId: product?.variants?.[0]?._id,
      name: display.name,
      image: display.image,
      color: product?.variants?.[0]?.color || '-',
      colorHex: product?.variants?.[0]?.colorHex,
      size: currentPack?.size || 'Standard',
      price: sellingPrice,
      stock: currentStock,
      qty: 1,
    };
    addItem(item);
    setAdded(true);
  };

  const handleBuyNow = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) {
      toast.error('This product is out of stock');
      return;
    }
    const item = {
      productId: product?._id ?? product?.id ?? display.id,
      slug: product?.slug || display.slug,
      variantId: product?.variants?.[0]?._id,
      name: display.name,
      image: display.image,
      color: product?.variants?.[0]?.color || '-',
      colorHex: product?.variants?.[0]?.colorHex,
      size: currentPack?.size || 'Standard',
      price: sellingPrice,
      stock: currentStock,
      qty: 1,
    };
    addItem(item);
    router.push('/checkout');
  };

  return (
    <div
      className="group relative flex flex-col h-full bg-[#FFFFFF] rounded-[20px] border border-[#E8E8E8] shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)] transition-all duration-300 overflow-hidden"
      style={{ fontFamily: FONT_OUTFIT }}
    >
      {/* 1. Image Section (Top, 2.25:1 aspect ratio) */}
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

      {/* 2. Details Section (Below image) */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-3 bg-[#FFFFFF]">
        <div className="space-y-2.5">
          {/* Row 1: Product Name & Stock Badge (Stock shows ONLY when < 5) */}
          <div className="flex items-center justify-between gap-2 min-h-[26px]">
            <Link
              href={href}
              className={`hover:text-[#C9A227] transition-colors ${
                stockStatus?.shouldShow ? 'truncate max-w-[65%]' : 'w-full truncate'
              }`}
            >
              <h3 className="text-base sm:text-[18px] font-bold text-[#000000] tracking-tight truncate">
                {display.name}
              </h3>
            </Link>
            {stockStatus?.shouldShow && <ProductStock stockStatus={stockStatus} />}
          </div>

          {/* Row 2: Rating */}
          <ProductRating rating={display.rating} reviewCount={display.reviewCount} />

          {/* Row 3: Description */}
          <p className="text-[13px] sm:text-[14px] text-[#333333] line-clamp-2 leading-relaxed min-h-[2.5rem]">
            {display.description}
          </p>

          {/* Row 4: Pack Size Selector */}
          <PackSizeSelector
            packs={packs}
            selectedSize={selectedPackSize}
            onSelectSize={setSelectedPackSize}
            disabled={outOfStock}
          />

          {/* Row 5: Pricing & Savings / Compact Cart */}
          <ProductPricing
            sellingPrice={sellingPrice}
            originalPrice={originalPrice}
            discountPct={discountPct}
            savings={savings}
            compactCart={compactCart}
            onAddToCart={handleAddToCart}
            added={added}
            outOfStock={outOfStock}
          />
        </div>

        {/* Row 6: Action Buttons (Only when not in compact cart mode) */}
        {!compactCart && (
          <ProductActions
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            added={added}
            outOfStock={outOfStock}
          />
        )}
      </div>
    </div>
  );
}
