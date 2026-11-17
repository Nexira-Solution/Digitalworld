'use client';

import { useEffect, useState, useCallback, useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import {
  Search,
  Filter,
  X,
  SlidersHorizontal,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Star,
  Check,
  Tag,
  Boxes,
} from 'lucide-react';

const INK = '#0F172A';
const INK_SOFT = '#64748B';
const GOLD = '#C9A227';
const LINE = '#E7E2D6';
const PAPER = '#FFFFFF';

export default function AllProductsView({ initialProducts = [], initialTotal = 0, initialCategories = [] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [categories, setCategories] = useState(initialCategories);
  const [products, setProducts] = useState(initialProducts);
  const [total, setTotal] = useState(initialTotal);
  const [pages, setPages] = useState(Math.ceil(initialTotal / 24) || 1);
  const [loading, setLoading] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Active Filter States derived from URL
  const currentCategory = searchParams.get('category') || '';
  const currentSubcategory = searchParams.get('subcategory') || '';
  const currentSort = searchParams.get('sort') || 'newest';
  const currentSearch = searchParams.get('search') || searchParams.get('q') || '';
  const currentStock = searchParams.get('stock') || '';
  const currentRating = searchParams.get('rating') || '';
  const currentDiscount = searchParams.get('discount') || '';
  const currentPage = Number(searchParams.get('page') || 1);

  // Local Search Input with Debounce
  const [searchInput, setSearchInput] = useState(currentSearch);

  // Sync search input with URL
  useEffect(() => {
    setSearchInput(currentSearch);
  }, [currentSearch]);

  // Load categories if not provided initially
  useEffect(() => {
    if (categories.length > 0) return;
    fetch('/api/categories?all=true')
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d) ? d : d.topLevel || d.categories || [];
        setCategories(list.filter((c) => c.isActive !== false));
      })
      .catch(() => {});
  }, [categories.length]);

  // Push updated filter state to URL (client-side transition without full-page reload)
  const updateQuery = useCallback(
    (updates) => {
      const sp = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, val]) => {
        if (val === '' || val === null || val === undefined) {
          sp.delete(key);
        } else {
          sp.set(key, String(val));
        }
      });
      // Reset page to 1 when filters change (unless page itself is changing)
      if (!('page' in updates)) {
        sp.delete('page');
      }

      startTransition(() => {
        router.push(`${pathname}?${sp.toString()}`, { scroll: false });
      });
    },
    [router, pathname, searchParams]
  );

  // Fetch products from backend whenever URL query changes (Requirement 09)
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const sp = new URLSearchParams(searchParams.toString());
      if (!sp.get('limit')) sp.set('limit', '24');
      const res = await fetch(`/api/products?${sp.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setProducts(data.products || []);
        setTotal(data.total || 0);
        setPages(data.pages || Math.ceil((data.total || 0) / 24) || 1);
      }
    } catch (err) {
      console.error('Fetch products error:', err);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Debounced search submit
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== currentSearch) {
        updateQuery({ search: searchInput.trim() });
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [searchInput, currentSearch, updateQuery]);

  // Active Category Object & Subcategories
  const activeCategoryDoc = categories.find(
    (c) => c.slug === currentCategory || String(c._id) === String(currentCategory)
  );
  const activeSubcategories = activeCategoryDoc?.subcategories || [];

  // Clear all filters
  function resetAllFilters() {
    setSearchInput('');
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  }

  const activeFilterCount =
    (currentCategory ? 1 : 0) +
    (currentSubcategory ? 1 : 0) +
    (currentStock ? 1 : 0) +
    (currentRating ? 1 : 0) +
    (currentDiscount ? 1 : 0) +
    (currentSearch ? 1 : 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E7E2D6] mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#C9A227]">
              Curated Marketplace
            </span>
            <span className="text-[11px] text-[#64748B]">·</span>
            <span className="text-[11px] text-[#64748B] font-semibold">{total} Products Available</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-[#0F172A]">
            {activeCategoryDoc ? activeCategoryDoc.name : 'All Products Catalog'}
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1 max-w-2xl">
            Explore authentic items direct from verified suppliers across electronics, apparel, gourmet sweets, snacks, and daily groceries.
          </p>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search products, brand, SKU…"
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-[#D6D6D6] outline-none focus:border-[#0F172A] bg-white transition-colors"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  updateQuery({ search: '' });
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <select
              value={currentSort}
              onChange={(e) => updateQuery({ sort: e.target.value })}
              className="px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-[#D6D6D6] outline-none focus:border-[#0F172A] bg-white font-semibold text-[#0F172A]"
            >
              <option value="newest">Sort: Newest Arrivals</option>
              <option value="price-low-to-high">Price: Low to High</option>
              <option value="price-high-to-low">Price: High to Low</option>
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>

          {/* Mobile Filter Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-[#0F172A] bg-white text-[#0F172A]"
          >
            <SlidersHorizontal size={14} />
            <span>Filters ({activeFilterCount})</span>
          </button>
        </div>
      </div>

      {/* Main Content Layout: Sidebar Filters + Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block lg:col-span-1 space-y-6">
          <div className="p-5 rounded-2xl bg-white border border-[#E7E2D6] space-y-6 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E2D6]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5">
                <SlidersHorizontal size={14} className="text-[#C9A227]" />
                <span>Filters</span>
              </span>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="text-[11px] font-bold text-[#C9A227] hover:underline flex items-center gap-1"
                >
                  <RotateCcw size={11} /> Reset All
                </button>
              )}
            </div>

            {/* 1. Category Filter List (Requirement 09) */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0F172A]">
                Categories
              </label>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => updateQuery({ category: '', subcategory: '' })}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                    !currentCategory
                      ? 'bg-[#0F172A] text-white font-bold'
                      : 'text-[#64748B] hover:text-[#0F172A] hover:bg-neutral-50'
                  }`}
                >
                  <span>All Categories</span>
                  {!currentCategory && <Check size={13} className="text-[#C9A227]" />}
                </button>

                {categories.map((c) => {
                  const isSelected =
                    currentCategory === c.slug || String(currentCategory) === String(c._id);
                  return (
                    <button
                      key={c._id}
                      type="button"
                      onClick={() => updateQuery({ category: c.slug || c._id, subcategory: '' })}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#0F172A] text-white font-bold'
                          : 'text-[#64748B] hover:text-[#0F172A] hover:bg-neutral-50'
                      }`}
                    >
                      <span>{c.name}</span>
                      {isSelected && <Check size={13} className="text-[#C9A227]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Subcategory Filter (If active category has subcategories) */}
            {activeSubcategories.length > 0 && (
              <div className="space-y-2 pt-4 border-t border-[#E7E2D6]">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0F172A]">
                  Subcategory
                </label>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => updateQuery({ subcategory: '' })}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                      !currentSubcategory
                        ? 'bg-[#FAF7EE] text-[#0F172A] font-bold border border-[#C9A227]/40'
                        : 'text-[#64748B] hover:text-[#0F172A]'
                    }`}
                  >
                    <span>All Subcategories</span>
                  </button>
                  {activeSubcategories.map((sub) => {
                    const isSubSelected =
                      currentSubcategory === sub.slug || String(currentSubcategory) === String(sub._id);
                    return (
                      <button
                        key={sub._id}
                        type="button"
                        onClick={() => updateQuery({ subcategory: sub.slug || sub._id })}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                          isSubSelected
                            ? 'bg-[#FAF7EE] text-[#0F172A] font-bold border border-[#C9A227]/40'
                            : 'text-[#64748B] hover:text-[#0F172A]'
                        }`}
                      >
                        <span>{sub.name}</span>
                        {isSubSelected && <Check size={12} className="text-[#C9A227]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. Availability / Stock Filter (Requirement 09) */}
            <div className="space-y-2 pt-4 border-t border-[#E7E2D6]">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0F172A]">
                Stock Availability
              </label>
              <div className="space-y-1.5">
                {[
                  { label: 'All Items', val: '' },
                  { label: 'In Stock Only', val: 'in_stock' },
                  { label: 'Out of Stock', val: 'out_of_stock' },
                ].map((st) => (
                  <label
                    key={st.val}
                    className="flex items-center gap-2.5 text-xs text-[#0F172A] cursor-pointer hover:text-[#C9A227]"
                  >
                    <input
                      type="radio"
                      name="stock"
                      checked={currentStock === st.val}
                      onChange={() => updateQuery({ stock: st.val })}
                      className="accent-[#0F172A]"
                    />
                    <span className={currentStock === st.val ? 'font-bold' : 'font-medium'}>
                      {st.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* 4. Customer Rating Filter (Requirement 09) */}
            <div className="space-y-2 pt-4 border-t border-[#E7E2D6]">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0F172A]">
                Customer Rating
              </label>
              <div className="space-y-1.5">
                {[
                  { label: 'Any Rating', val: '' },
                  { label: '4★ & Above', val: '4' },
                  { label: '3★ & Above', val: '3' },
                ].map((r) => (
                  <label
                    key={r.val}
                    className="flex items-center gap-2.5 text-xs text-[#0F172A] cursor-pointer hover:text-[#C9A227]"
                  >
                    <input
                      type="radio"
                      name="rating"
                      checked={currentRating === r.val}
                      onChange={() => updateQuery({ rating: r.val })}
                      className="accent-[#0F172A]"
                    />
                    <span className={currentRating === r.val ? 'font-bold' : 'font-medium'}>
                      {r.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* 5. Minimum Discount Filter (Requirement 09) */}
            <div className="space-y-2 pt-4 border-t border-[#E7E2D6]">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0F172A]">
                Discount
              </label>
              <div className="space-y-1.5">
                {[
                  { label: 'All Discounts', val: '' },
                  { label: '10% or more', val: '10' },
                  { label: '20% or more', val: '20' },
                  { label: '30% or more', val: '30' },
                ].map((d) => (
                  <label
                    key={d.val}
                    className="flex items-center gap-2.5 text-xs text-[#0F172A] cursor-pointer hover:text-[#C9A227]"
                  >
                    <input
                      type="radio"
                      name="discount"
                      checked={currentDiscount === d.val}
                      onChange={() => updateQuery({ discount: d.val })}
                      className="accent-[#0F172A]"
                    />
                    <span className={currentDiscount === d.val ? 'font-bold' : 'font-medium'}>
                      {d.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Filter Drawer */}
        {mobileFilterOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setMobileFilterOpen(false)}
            />
            <div className="relative ml-auto w-full max-w-xs bg-white h-full p-6 overflow-y-auto space-y-6 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-[#E7E2D6]">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#0F172A]">Filters</h3>
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-black"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Mobile Category Select */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                  Category
                </label>
                <select
                  value={currentCategory}
                  onChange={(e) => {
                    updateQuery({ category: e.target.value, subcategory: '' });
                    setMobileFilterOpen(false);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D6D6D6] outline-none"
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c.slug || c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mobile Stock Select */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                  Availability
                </label>
                <select
                  value={currentStock}
                  onChange={(e) => {
                    updateQuery({ stock: e.target.value });
                    setMobileFilterOpen(false);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D6D6D6] outline-none"
                >
                  <option value="">All Items</option>
                  <option value="in_stock">In Stock Only</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
              </div>

              <div className="pt-4 border-t border-[#E7E2D6] space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    resetAllFilters();
                    setMobileFilterOpen(false);
                  }}
                  className="w-full py-2.5 rounded-xl border border-[#D6D6D6] text-xs font-bold text-[#0F172A]"
                >
                  Reset All Filters
                </button>
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-[#0F172A] text-white text-xs font-bold"
                >
                  Apply Filters ({total} Results)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Product Grid Area (3 Columns on desktop) */}
        <main className="lg:col-span-3 space-y-6">
          {/* Active Filter Pills Bar */}
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-[#64748B] font-medium">Applied:</span>
              {currentCategory && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF7EE] border border-[#C9A227]/40 text-[#0F172A] font-semibold">
                  Category: {activeCategoryDoc?.name || currentCategory}
                  <button type="button" onClick={() => updateQuery({ category: '', subcategory: '' })}>
                    <X size={12} />
                  </button>
                </span>
              )}
              {currentSubcategory && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF7EE] border border-[#C9A227]/40 text-[#0F172A] font-semibold">
                  Subcategory: {currentSubcategory}
                  <button type="button" onClick={() => updateQuery({ subcategory: '' })}>
                    <X size={12} />
                  </button>
                </span>
              )}
              {currentStock && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF7EE] border border-[#C9A227]/40 text-[#0F172A] font-semibold">
                  {currentStock === 'in_stock' ? 'In Stock Only' : 'Out of Stock'}
                  <button type="button" onClick={() => updateQuery({ stock: '' })}>
                    <X size={12} />
                  </button>
                </span>
              )}
              {currentSearch && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF7EE] border border-[#C9A227]/40 text-[#0F172A] font-semibold">
                  Search: &ldquo;{currentSearch}&rdquo;
                  <button type="button" onClick={() => updateQuery({ search: '' })}>
                    <X size={12} />
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={resetAllFilters}
                className="text-xs font-bold text-[#C9A227] hover:underline ml-1"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Loading or Product Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-[360px] rounded-2xl bg-neutral-100 animate-pulse border border-[#E7E2D6]"
                />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="py-20 rounded-2xl bg-white border border-[#E7E2D6] text-center p-8 space-y-4">
              <Boxes size={42} className="text-[#C9A227] mx-auto opacity-70" />
              <h3 className="text-lg font-bold uppercase tracking-wider text-[#0F172A]">
                No matching products found
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B] max-w-md mx-auto">
                No items matched your current filter criteria. Try expanding your search or clearing active filters.
              </p>
              <button
                type="button"
                onClick={resetAllFilters}
                className="px-6 py-2.5 rounded-xl bg-[#0F172A] text-white text-xs font-bold hover:bg-[#1E293B] transition-all"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p, idx) => (
                <ProductCard key={p._id || p.id || idx} product={p} index={idx} />
              ))}
            </div>
          )}

          {/* Pagination Controls (Requirement 09) */}
          {pages > 1 && (
            <div className="pt-8 border-t border-[#E7E2D6] flex items-center justify-between">
              <button
                type="button"
                disabled={currentPage <= 1 || loading}
                onClick={() => updateQuery({ page: currentPage - 1 })}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border border-[#D6D6D6] bg-white text-[#0F172A] disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#0F172A] transition-colors"
              >
                <ChevronLeft size={14} /> Previous
              </button>

              <div className="flex items-center gap-1 text-xs font-bold text-[#0F172A]">
                <span>
                  Page {currentPage} of {pages}
                </span>
                <span className="text-[#64748B] font-normal hidden sm:inline">({total} total items)</span>
              </div>

              <button
                type="button"
                disabled={currentPage >= pages || loading}
                onClick={() => updateQuery({ page: currentPage + 1 })}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border border-[#D6D6D6] bg-white text-[#0F172A] disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#0F172A] transition-colors"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
