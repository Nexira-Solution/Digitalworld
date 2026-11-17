'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function BannerCarousel({ banners }) {
  const [index, setIndex] = useState(0);

  // Defense-in-depth: Exclusively allow Admin-managed homepage banners (seller === null and bannerType !== 'storefront')
  const adminBanners = (banners || []).filter((b) => !b.seller && b.bannerType !== 'storefront');

  useEffect(() => {
    if (!adminBanners.length) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % adminBanners.length), 5000);
    return () => clearInterval(t);
  }, [adminBanners]);

  // If no active Admin banners exist, render a clean, branded default hero banner
  if (!adminBanners.length) {
    return (
      <section className="relative w-full overflow-hidden bg-[#0F172A]">
        <div className="relative w-full aspect-[1920/810] min-h-[260px] sm:min-h-[380px] md:min-h-[460px] flex items-center justify-center">
          {/* Subtle gold ambient glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#C9A227]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-4xl mx-auto px-6 text-center text-white space-y-3 sm:space-y-4">
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase bg-[#C9A227]/20 text-[#E7C86A] border border-[#C9A227]/30">
              Official Marketplace
            </span>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-white">
              Welcome to Digital World
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
              India&apos;s verified multi-vendor marketplace offering authentic electronics, apparel, regional gourmet sweets, and essentials.
            </p>
            <div className="pt-2">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-6 py-2.5 sm:px-8 sm:py-3 rounded-full text-xs sm:text-sm font-bold bg-[#C9A227] text-black shadow-lg hover:bg-[#d8b030] transition-transform active:scale-95"
              >
                <span>Shop All Products</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full overflow-hidden bg-white">
      <div className="relative w-full aspect-[1920/810]">
        {adminBanners.map((b, i) => (
          <div
            key={b._id || i}
            className={`absolute inset-0 block transition-opacity duration-700 ${
              i === index ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'
            }`}
          >
            <Link
              href={b.link || '#'}
              className={`block w-full h-full relative ${!b.link ? 'cursor-default' : ''}`}
            >
              {/* Desktop banner */}
              <img
                src={b.image}
                alt={b.title || 'Digital World Banner'}
                className={`w-full h-full object-cover object-center ${
                  b.mobileImage ? 'hidden sm:block' : 'block'
                }`}
              />

              {/* Mobile banner if uploaded */}
              {b.mobileImage && (
                <img
                  src={b.mobileImage}
                  alt={b.title || 'Digital World Banner'}
                  className="sm:hidden w-full h-full object-cover object-center"
                />
              )}

              {/* Optional banner overlay if title or button exists */}
              {(b.title || b.description || b.buttonText) && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6 sm:p-12">
                  <div className="max-w-xl text-white space-y-2">
                    {b.title && (
                      <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
                        {b.title}
                      </h2>
                    )}
                    {b.description && (
                      <p className="text-xs sm:text-sm text-white/90 line-clamp-2">
                        {b.description}
                      </p>
                    )}
                    {b.buttonText && b.link && (
                      <span className="inline-block mt-2 px-5 py-2 rounded-full text-xs font-bold bg-[#C9A227] text-black shadow-md hover:bg-[#d8b030] transition-colors">
                        {b.buttonText}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </Link>
          </div>
        ))}

        {adminBanners.length > 1 && (
          <>
            <button
              onClick={() => setIndex((i) => (i - 1 + adminBanners.length) % adminBanners.length)}
              className="absolute left-2 sm:left-5 top-1/2 -translate-y-1/2 p-2 rounded-full transition z-20 bg-white/90 text-black hover:bg-white shadow-md border border-[#E7E2D6]"
              aria-label="Previous Banner"
            >
              <ChevronLeft size={16} strokeWidth={2} />
            </button>
            <button
              onClick={() => setIndex((i) => (i + 1) % adminBanners.length)}
              className="absolute right-2 sm:right-5 top-1/2 -translate-y-1/2 p-2 rounded-full transition z-20 bg-white/90 text-black hover:bg-white shadow-md border border-[#E7E2D6]"
              aria-label="Next Banner"
            >
              <ChevronRight size={16} strokeWidth={2} />
            </button>

            <div className="absolute bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
              {adminBanners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className="rounded-full transition-all"
                  style={{
                    height: '4px',
                    width: i === index ? '24px' : '10px',
                    backgroundColor: i === index ? '#C9A227' : 'rgba(255,255,255,0.7)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  }}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
