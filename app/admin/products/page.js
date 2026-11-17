'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  Trash2,
  Pencil,
  Eye,
  Crown,
  UploadCloud,
  X,
  Loader2,
  FolderPlus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatINR } from '@/lib/utils';
import AddCategoryModal from '@/components/seller/AddCategoryModal';

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);

  async function handleCategoryCreated(newCat) {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data.categories || data.topLevel || []);
      if (newCat?._id) {
        setCategoryFilter(newCat._id);
      }
    } catch {
      // keep existing
    }
  }

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/products?limit=200');
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      const data = await res.json();
      setProducts(data.products || []);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || d.topLevel || []))
      .catch(() => {});
  }, []);

  async function onDelete(id, name) {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to delete product.');
        return;
      }
      toast.success('Product deleted successfully');
      setProducts((prev) => prev.filter((p) => p._id !== id));
    } catch {
      toast.error('Network error deleting product.');
    } finally {
      setDeletingId(null);
    }
  }

  const filtered = useMemo(() => {
    let list = [...products];

    // Search by product name or SKU
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q)
      );
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      list = list.filter((p) => {
        const catId = p.category?._id || p.category;
        return String(catId) === String(categoryFilter);
      });
    }

    // Sort
    list.sort((a, b) => {
      const aPrice = a.basePrice || a.variants?.[0]?.price || 0;
      const bPrice = b.basePrice || b.variants?.[0]?.price || 0;

      switch (sortBy) {
        case 'category':
          return (a.category?.name || '').localeCompare(b.category?.name || '');
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'priceLow':
          return aPrice - bPrice;
        case 'priceHigh':
          return bPrice - aPrice;
        case 'newest':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    return list;
  }, [products, search, categoryFilter, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Top Action Buttons (Matches seller dashboard & user reference) */}
      <div className="flex items-center gap-2.5 mb-5 flex-wrap">
        <Link
          href="/admin/products/bulk"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#E8E8E8] bg-white text-[#0F172A] hover:bg-neutral-50 text-xs sm:text-sm font-semibold shadow-xs transition-colors"
        >
          <UploadCloud size={16} />
          <span>Bulk Add</span>
        </Link>
        <button
          type="button"
          onClick={() => setShowAddCategoryModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#E8E8E8] bg-white text-[#0F172A] hover:bg-neutral-50 text-xs sm:text-sm font-semibold shadow-xs transition-colors"
        >
          <FolderPlus size={16} className="text-[#C9A227]" />
          <span>+ Add Category</span>
        </button>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0F172A] text-white hover:bg-neutral-800 text-xs sm:text-sm font-semibold shadow-sm transition-all"
        >
          <Plus size={16} className="text-[#C9A227]" />
          <span>Add Product</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or SKU..."
            className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-[#E8E8E8] bg-white text-[#0F172A] outline-none focus:border-[#0F172A] transition-colors shadow-xs"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3.5 py-2 text-sm rounded-lg border border-[#E8E8E8] bg-white text-[#0F172A] outline-none cursor-pointer focus:border-[#0F172A] shadow-xs"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Sort Filter */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3.5 py-2 text-sm rounded-lg border border-[#E8E8E8] bg-white text-[#0F172A] outline-none cursor-pointer focus:border-[#0F172A] shadow-xs"
        >
          <option value="newest">Sort: Newest</option>
          <option value="category">Sort: Category (A–Z)</option>
          <option value="name">Sort: Name (A–Z)</option>
          <option value="priceLow">Sort: Price (Low to High)</option>
          <option value="priceHigh">Sort: Price (High to Low)</option>
        </select>
      </div>

      {/* Products Table Card */}
      {loading ? (
        <div className="bg-white rounded-xl border border-[#E8E8E8] p-12 text-center shadow-xs">
          <Loader2 size={24} className="animate-spin text-[#C9A227] mx-auto mb-2" />
          <p className="text-xs text-[#6B6B6B]">Loading catalog products...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E8E8E8] shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E8E8E8] text-[11px] font-bold uppercase tracking-wider text-[#64748B] bg-[#FAF9F5]">
                <th className="p-3.5">Product</th>
                <th className="p-3.5">SKU</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Price</th>
                <th className="p-3.5">Variants</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E8E8] text-sm">
              {filtered.map((p) => {
                const img =
                  p.variants?.[0]?.images?.[0] ||
                  p.images?.[0] ||
                  p.image ||
                  '';
                const price = p.basePrice || p.variants?.[0]?.price || 0;
                const totalStock = (p.variants || []).reduce(
                  (acc, v) =>
                    acc +
                    (v.sizes || []).reduce((sAcc, s) => sAcc + (Number(s.stock) || 0), 0),
                  0
                );

                return (
                  <tr
                    key={p._id}
                    className="hover:bg-neutral-50/80 transition-colors group"
                  >
                    {/* Product Image & Title */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-neutral-100 border border-[#E8E8E8] shrink-0 flex items-center justify-center">
                          {img ? (
                            <Image
                              src={img}
                              alt={p.name}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          ) : (
                            <span className="text-[10px] font-bold text-neutral-400">NO IMG</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-[#0F172A] truncate max-w-[220px]">
                            {p.name}
                          </p>
                          <p className="text-[11px] text-neutral-400 truncate max-w-[220px]">
                            /{p.slug}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* SKU */}
                    <td className="p-3.5 text-xs font-mono font-medium text-[#64748B]">
                      {p.sku || <span className="text-neutral-300">—</span>}
                    </td>

                    {/* Category */}
                    <td className="p-3.5">
                      <span className="inline-block px-2.5 py-1 rounded-md text-xs font-medium bg-[#FAF7EE] text-[#8C6D1F] border border-[#E7E2D6]">
                        {p.category?.name || 'Uncategorized'}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="p-3.5 font-semibold text-sm text-[#0F172A]">
                      {formatINR(price)}
                    </td>

                    {/* Variants / Stock */}
                    <td className="p-3.5">
                      <div className="flex flex-col text-xs text-[#64748B]">
                        <span className="font-semibold text-[#0F172A]">
                          {p.variants?.length || 1} Variant{(p.variants?.length || 1) > 1 ? 's' : ''}
                        </span>
                        <span className="text-[11px]">
                          {totalStock > 0 ? `${totalStock} in stock` : 'Out of stock'}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {p.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-neutral-100 text-neutral-600 border border-neutral-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                            Hidden
                          </span>
                        )}
                        {p.isBestSeller && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF0D4] text-[#8C6D1F]">
                            <Crown size={10} className="fill-[#8C6D1F]" />
                            <span>Best Seller</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {p.seller ? (
                          <span
                            className="p-1.5 rounded-lg text-neutral-300 cursor-not-allowed inline-flex"
                            title="Admin cannot edit seller-owned products. Only the product supplier can modify this item."
                          >
                            <Pencil size={15} />
                          </span>
                        ) : (
                          <Link
                            href={`/admin/products/${p._id}/edit`}
                            className="p-1.5 rounded-lg text-[#0F172A] hover:bg-neutral-200 transition-colors"
                            title="Edit Product"
                          >
                            <Pencil size={15} />
                          </Link>
                        )}
                        <button
                          type="button"
                          disabled={deletingId === p._id}
                          onClick={() => onDelete(p._id, p.name)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                          title="Delete Product"
                        >
                          {deletingId === p._id ? (
                            <Loader2 size={15} className="animate-spin text-rose-600" />
                          ) : (
                            <Trash2 size={15} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-14 text-center px-4">
              <p className="text-sm font-semibold text-[#0F172A]">
                {products.length === 0
                  ? 'No products yet. Add your first product!'
                  : 'No products match your filters.'}
              </p>
              {products.length === 0 ? (
                <div className="mt-3">
                  <Link
                    href="/admin/products/new"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-[#0F172A] text-white hover:bg-neutral-800 transition-all shadow-xs"
                  >
                    <Plus size={15} className="text-[#C9A227]" />
                    <span>Add Product</span>
                  </Link>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setCategoryFilter('all');
                  }}
                  className="mt-2 text-xs font-semibold text-[#C9A227] hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add Category Modal (Title and Image only) */}
      <AddCategoryModal
        isOpen={showAddCategoryModal}
        onClose={() => setShowAddCategoryModal(false)}
        onSuccess={handleCategoryCreated}
      />
    </div>
  );
}
