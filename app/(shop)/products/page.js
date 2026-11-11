import ProductCard from '@/components/ProductCard';
import Filters from '@/components/Filters';
import { dbConnect } from '@/lib/mongodb';
import Product from '@/models/Product';
import '@/models/Category'; // registers the Category schema — required for .populate('category')

export const dynamic = 'force-dynamic'; // never cache/statically render this page

const FONT_OUTFIT = "'Outfit', sans-serif";

const SORT_MAP = {
  newest: { createdAt: -1 },
  priceLow: { basePrice: 1 },
  priceHigh: { basePrice: -1 },
  popular: { soldCount: -1 },
  rating: { rating: -1 },
};

async function getAllProducts(sort) {
  try {
    await dbConnect();

    const query = { isActive: true };
    const sortStage = SORT_MAP[sort] || SORT_MAP.newest;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug type')
        .sort(sortStage)
        .lean(), // fetch all matching products
      Product.countDocuments(query),
    ]);

    return {
      products: JSON.parse(JSON.stringify(products)),
      total,
    };
  } catch (err) {
    console.error('getAllProducts database error:', err);
    return {
      products: [],
      total: 0,
    };
  }
}

export const metadata = {
  title: 'All Products | Mailoo Bazar',
};

export default async function ProductsPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const sort = resolvedSearchParams?.sort || 'newest';

  const { products, total } = await getAllProducts(sort);

  // If backend returns products, use them directly; otherwise fallback to 4 products for UI demonstration
  const displayProducts = products.length > 0
    ? products
    : Array.from({ length: 4 }).map((_, idx) => ({ id: `demo-prod-${idx}` }));

  const displayTotal = total > 0 ? total : displayProducts.length;

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
              All Products
            </h1>
            <p className="mt-1.5 text-sm sm:text-base text-[#6B6B6B] max-w-2xl">
              Authentic, premium handcrafted selections prepared with purity and traditional care.
            </p>
          </div>

          <div className="shrink-0 text-xs sm:text-sm font-semibold text-[#1A1A1A] bg-[#FFFFFF] border border-[#E8E8E8] px-3.5 py-1.5 rounded-full shadow-sm">
            {displayTotal} {displayTotal === 1 ? 'Product' : 'Products'} Available
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <Filters sort={sort} />
        </div>

        {/* Product Grid (24px gap = gap-6, 3-4 columns desktop, 2 columns tablet, 1-2 mobile) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayProducts.map((p, idx) => (
            <ProductCard key={p._id || p.id || idx} product={p} index={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}
