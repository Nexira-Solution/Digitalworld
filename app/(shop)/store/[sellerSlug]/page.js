'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Store,
  MapPin,
  Calendar,
  Star,
  Clock,
  Truck,
  Repeat,
  Package,
  ShieldCheck,
  Search,
  Filter,
  ChevronRight,
  Home,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import ProductCard from '@/components/ProductCard';

export default function SellerStorefrontPage() {
  const { sellerSlug } = useParams();
  const router = useRouter();

  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [totalCount, setTotalCount] = useState(0);

  // Fetch Store Profile
  useEffect(() => {
    if (!sellerSlug) return;
    setLoading(true);
    fetch(`/api/stores/${sellerSlug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.store) {
          setStore(data.store);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [sellerSlug]);

  // Fetch Seller Products
  const loadProducts = useCallback(() => {
    if (!sellerSlug) return;
    setProductsLoading(true);
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (selectedCategory && selectedCategory !== 'all') params.set('category', selectedCategory);

    fetch(`/api/stores/${sellerSlug}/products?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setProducts(data.products || []);
        setTotalCount(data.total || 0);
      })
      .catch((err) => console.error(err))
      .finally(() => setProductsLoading(false));
  }, [sellerSlug, searchQuery, selectedCategory]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 bg-[#FAFAFA]">
        <div className="w-10 h-10 rounded-full border-2 border-[#E8E8E8] border-t-[#C9A227] animate-spin" />
        <p className="text-xs font-semibold text-[#6B6B6B] tracking-wider uppercase">
          Loading Supplier Storefront…
        </p>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4 bg-[#FAFAFA]">
        <div className="w-16 h-16 rounded-full bg-[#FAF7EE] text-[#C9A227] flex items-center justify-center border border-[#E7E2D6]">
          <Store size={28} />
        </div>
        <h1 className="text-2xl font-bold text-[#000000]">Store Not Found</h1>
        <p className="text-sm text-[#6B6B6B] max-w-md">
          This seller storefront may be private, pending administrative verification, or does not exist.
        </p>
        <Link
          href="/"
          className="px-6 py-2.5 rounded-full text-xs font-bold bg-[#000000] text-white hover:bg-neutral-800 transition-all shadow-sm"
        >
          Return to Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-24">
      {/* ======================= BREADCRUMB ======================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <nav className="flex items-center gap-2 text-xs text-[#6B6B6B] overflow-x-auto no-scrollbar">
          <Link href="/" className="flex items-center gap-1 hover:text-[#000000] transition-colors">
            <Home size={13} />
            <span>Home</span>
          </Link>
          <ChevronRight size={12} className="text-[#CCCCCC]" />
          <span>Stores</span>
          <ChevronRight size={12} className="text-[#CCCCCC]" />
          <span className="font-semibold text-[#000000] truncate">{store.businessName}</span>
        </nav>
      </div>

      {/* ======================= STORE HERO BANNER ======================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0A0E17] text-white border border-[#E7E2D6] shadow-[0_10px_35px_rgba(0,0,0,0.06)]">
          {/* Subtle gold atmospheric light */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#C9A227]/15 rounded-full blur-3xl pointer-events-none" />

          {/* Banner Graphic if available */}
          {store.shopBanner ? (
            <div className="relative w-full h-44 sm:h-56">
              <Image
                src={store.shopBanner}
                alt={`${store.businessName} banner`}
                fill
                unoptimized
                className="object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/60 to-transparent" />
            </div>
          ) : (
            <div className="h-10 sm:h-12" />
          )}

          {/* Store Profile Info Content */}
          <div className="relative z-10 px-6 sm:px-10 pb-8 pt-4 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              {/* Shop Logo Avatar */}
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-white shadow-xl border-2 border-[#C9A227] shrink-0 flex items-center justify-center">
                {store.shopLogo && store.shopLogo !== '/images/store-placeholder.png' ? (
                  <Image
                    src={store.shopLogo}
                    alt={store.businessName}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#FAF7EE] text-[#000000] font-black text-2xl flex items-center justify-center">
                    {store.businessName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Title & Metadata */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {store.businessName}
                  </h1>
                  {store.isVerifiedMerchant && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <ShieldCheck size={13} />
                      <span>Verified Supplier</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-300 flex-wrap">
                  <div className="flex items-center gap-1">
                    <MapPin size={13} className="text-[#C9A227]" />
                    <span>{store.shopLocation}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Calendar size={13} className="text-[#C9A227]" />
                    <span>Est. {store.yearOfEstablishment} ({store.yearsInBusiness} yrs)</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1 text-[#E7C86A] font-bold">
                    <Star size={13} className="fill-[#C9A227] text-[#C9A227]" />
                    <span>{store.rating} ({store.reviewCount} Reviews)</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed pt-1">
                  {store.businessDescription}
                </p>
              </div>
            </div>

            {/* Quick Badge / Category */}
            <div className="shrink-0 flex items-center gap-2 self-start md:self-end">
              <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-white/10 text-white border border-white/20 backdrop-blur-md">
                {store.businessCategory}
              </span>
            </div>
          </div>
        </div>

        {/* ======================= SUPPLIER PERFORMANCE STATISTICS BAR ======================= */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-5">
          <div className="bg-white rounded-2xl p-4 border border-[#E8E8E8] shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FAF7EE] text-[#C9A227] flex items-center justify-center shrink-0 border border-[#E7E2D6]">
              <Clock size={18} />
            </div>
            <div>
              <div className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider">
                Response Time
              </div>
              <div className="font-extrabold text-sm sm:text-base text-[#000000]">
                {store.responseTime}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[#E8E8E8] shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <Truck size={18} />
            </div>
            <div>
              <div className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider">
                On-Time Dispatch
              </div>
              <div className="font-extrabold text-sm sm:text-base text-[#000000]">
                {store.onTimeDispatchRate}%
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[#E8E8E8] shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
              <Repeat size={18} />
            </div>
            <div>
              <div className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider">
                Reorder Rate
              </div>
              <div className="font-extrabold text-sm sm:text-base text-[#000000]">
                {store.reorderRate}%
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[#E8E8E8] shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <Package size={18} />
            </div>
            <div>
              <div className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider">
                Live Catalog
              </div>
              <div className="font-extrabold text-sm sm:text-base text-[#000000]">
                {store.totalProducts} Products
              </div>
            </div>
          </div>
        </div>

        {/* ======================= PRODUCT SEARCH & FILTER TOOLBAR ======================= */}
        <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#E8E8E8] shadow-xs">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6B6B]" />
            <input
              type="text"
              placeholder={`Search in ${store.businessName}…`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-[#D6D6D6] outline-none focus:border-[#000000] transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-[#6B6B6B] shrink-0">Showing:</span>
            <span className="font-extrabold text-[#000000]">{totalCount} items</span>
          </div>
        </div>

        {/* ======================= PRODUCT GRID ======================= */}
        <div className="mt-6">
          {productsLoading ? (
            <div className="min-h-[40vh] flex flex-col items-center justify-center gap-2">
              <div className="w-8 h-8 rounded-full border-2 border-[#E8E8E8] border-t-[#C9A227] animate-spin" />
              <p className="text-xs text-[#6B6B6B]">Loading store catalog…</p>
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {products.map((product, idx) => (
                <ProductCard key={product._id} product={product} index={idx} />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center bg-white rounded-3xl border border-[#E8E8E8] shadow-xs space-y-3 px-4">
              <div className="w-12 h-12 rounded-full bg-[#FAF7EE] text-[#C9A227] flex items-center justify-center mx-auto border border-[#E7E2D6]">
                <Package size={22} />
              </div>
              <h3 className="font-bold text-base text-[#000000]">No Products Match</h3>
              <p className="text-xs text-[#6B6B6B] max-w-md mx-auto">
                No active products currently match your search in this supplier&apos;s catalog.
              </p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-[#000000] text-[#000000] hover:bg-neutral-50"
                >
                  Clear Search Filter
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

