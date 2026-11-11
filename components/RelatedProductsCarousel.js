'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import ProductCard from '@/components/ProductCard';

const FONT_OUTFIT = "'Outfit', sans-serif";

/**
 * Centered Gold Lotus Ornament with horizontal rule lines
 */
export function LotusOrnament() {
  return (
    <div className="flex items-center justify-center gap-3 my-2.5">
      <div className="h-[1px] w-12 sm:w-20 bg-gradient-to-r from-transparent to-[#C9A227]" />
      <svg
        className="w-6 h-6 text-[#C9A227]"
        viewBox="0 0 40 28"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path
          d="M20 2C17 9 14 15 8 19C14 20 18 23 20 27C22 23 26 20 32 19C26 15 23 9 20 2Z"
          fill="#C9A227"
          fillOpacity="0.2"
        />
        <path d="M20 4C18 10 15 16 10 20C15 20.5 18 23 20 26C22 23 25 20.5 30 20C25 16 22 10 20 4Z" />
        <path d="M12 21C7 21 3 19 2 15C5 15 9 17 12 21Z" />
        <path d="M28 21C33 21 37 19 38 15C35 15 31 17 28 21Z" />
        <circle cx="20" cy="26.5" r="1.5" fill="#C9A227" />
      </svg>
      <div className="h-[1px] w-12 sm:w-20 bg-gradient-to-l from-transparent to-[#C9A227]" />
    </div>
  );
}

export default function RelatedProductsCarousel({
  related = [],
  currentProductId,
  currentProductSlug,
  currentProductName,
}) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // 1. Filter out the current product from backend related products
  const backendRelated = (related || []).filter(
    (p) =>
      p._id !== currentProductId &&
      p.id !== currentProductId &&
      p.slug !== currentProductSlug
  );

  // Real backend related products only — zero mock data
  const displayProducts = [...backendRelated];

  // Update arrow states on scroll
  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) el.addEventListener('scroll', checkScroll, { passive: true });
    return () => {
      if (el) el.removeEventListener('scroll', checkScroll);
    };
  }, [displayProducts]);

  const handleScroll = (direction) => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const cardWidth = container.offsetWidth * 0.8;
    container.scrollBy({
      left: direction === 'left' ? -cardWidth : cardWidth,
      behavior: 'smooth',
    });
  };

  if (displayProducts.length === 0) return null;

  return (
    <section className="mt-16 sm:mt-24" style={{ fontFamily: FONT_OUTFIT }}>
      {/* Section Header with Centered Title & Right "View All" */}
      <div className="relative mb-6">
        {/* Centered Heading */}
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#000000]">
            Related <span className="text-[#C9A227]">Products</span>
          </h2>
          <LotusOrnament />
        </div>

        {/* View All Pill Action (Aligned Top-Right) */}
        <div className="sm:absolute sm:right-0 sm:top-1 flex justify-center sm:justify-end mt-2 sm:mt-0">
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-full bg-[#FFFFFF] border border-[#C9A227] text-[#000000] hover:bg-[#F6EFD9] hover:border-[#C9A227] transition-all shadow-sm"
          >
            <span>View All</span>
            <ArrowRight size={13} className="text-[#000000]" />
          </Link>
        </div>
      </div>

      {/* Carousel Container with Navigation Buttons */}
      <div className="relative group">
        {/* Left Arrow Button */}
        <button
          type="button"
          onClick={() => handleScroll('left')}
          disabled={!canScrollLeft}
          aria-label="Previous products"
          className={`absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#FFFFFF] border border-[#E8E8E8] shadow-md flex items-center justify-center transition-all ${
            canScrollLeft
              ? 'opacity-100 hover:scale-105 active:scale-95 text-[#000000] hover:border-[#C9A227]'
              : 'opacity-0 pointer-events-none'
          }`}
        >
          <ChevronLeft size={20} />
        </button>

        {/* Right Arrow Button */}
        <button
          type="button"
          onClick={() => handleScroll('right')}
          disabled={!canScrollRight}
          aria-label="Next products"
          className={`absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#FFFFFF] border border-[#E8E8E8] shadow-md flex items-center justify-center transition-all ${
            canScrollRight
              ? 'opacity-100 hover:scale-105 active:scale-95 text-[#000000] hover:border-[#C9A227]'
              : 'opacity-0 pointer-events-none'
          }`}
        >
          <ChevronRight size={20} />
        </button>

        {/* Horizontal Carousel Track (4 cards on desktop, 2 on tablet, 1.2 on mobile) */}
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar pb-4 pt-1 px-1"
        >
          {displayProducts.map((p, idx) => (
            <div
              key={p._id || p.id || idx}
              className="w-[85%] sm:w-[calc(50%-10px)] lg:w-[calc(25%-15px)] shrink-0 snap-start flex flex-col"
            >
              <ProductCard product={p} index={idx} compactCart={true} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

