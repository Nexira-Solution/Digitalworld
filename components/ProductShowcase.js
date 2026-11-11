'use client';

import ProductGrid from './ProductGrid';

const FONT_OUTFIT = "'Outfit', sans-serif";

export default function ProductShowcase({
  products = [],
  title = 'All Products',
  subtitle = 'Authentic, premium handcrafted selections prepared with purity and traditional care.',
  total,
}) {
  const displayTotal = total !== undefined ? total : products.length;

  return (
    <section className="bg-[#FAFAFA] min-h-screen py-10 sm:py-16" style={{ fontFamily: FONT_OUTFIT }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Showcase Header */}
        <div className="mb-8 pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E8E8E8]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F6EFD9] text-[#1A1A1A] text-[11px] font-bold tracking-wider uppercase mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C9A227]" />
              Mailoo Bazar
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#000000]">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1.5 text-sm sm:text-base text-[#6B6B6B] max-w-2xl">
                {subtitle}
              </p>
            )}
          </div>

          <div className="shrink-0 text-xs sm:text-sm font-semibold text-[#1A1A1A] bg-[#FFFFFF] border border-[#E8E8E8] px-3.5 py-1.5 rounded-full shadow-sm">
            {displayTotal} {displayTotal === 1 ? 'Product Available' : 'Products Available'}
          </div>
        </div>

        {/* Product Grid */}
        <ProductGrid products={products} />
      </div>
    </section>
  );
}

