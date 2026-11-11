'use client';

import ProductCard from './ProductCard';

export default function ProductGrid({ products = [] }) {
  if (!products || products.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-[#6B6B6B]">
        No products available at this time.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((p, idx) => (
        <ProductCard key={p._id || p.id || idx} product={p} index={idx} />
      ))}
    </div>
  );
}

