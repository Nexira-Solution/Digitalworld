import { Suspense } from 'react';
import AllProductsView from '@/components/shop/AllProductsView';
import { dbConnect } from '@/lib/mongodb';
import Product from '@/models/Product';
import Category from '@/models/Category';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'All Products | Mailoo Bazar',
  description: 'Explore all authentic products, electronics, snacks, sweets, and apparel.',
};

export default async function ProductsPage() {
  let initialProducts = [];
  let initialTotal = 0;
  let initialCategories = [];

  try {
    await dbConnect();
    const [prods, total, cats] = await Promise.all([
      Product.find({ isActive: true })
        .populate('category', 'name slug type')
        .sort({ createdAt: -1 })
        .limit(24)
        .lean(),
      Product.countDocuments({ isActive: true }),
      Category.find({ isActive: true, parent: null })
        .populate('subcategories', 'name slug')
        .sort({ order: 1, name: 1 })
        .lean(),
    ]);

    initialProducts = JSON.parse(JSON.stringify(prods));
    initialTotal = total;
    initialCategories = JSON.parse(JSON.stringify(cats));
  } catch (err) {
    console.error('ProductsPage initial fetch warning:', err.message);
  }

  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-16 text-center text-sm text-[#64748B]">
          Loading products catalog…
        </div>
      }
    >
      <AllProductsView
        initialProducts={initialProducts}
        initialTotal={initialTotal}
        initialCategories={initialCategories}
      />
    </Suspense>
  );
}
