'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, Plus, Trash2, Edit3, Crown, Eye, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

const INK = '#000000';
const INK_SOFT = '#6B6B6B';
const LINE = '#E8E8E8';
const PAPER = '#FFFFFF';

export default function SellerProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 1. Fetch available categories for filter dropdown
  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => setCategories(d.topLevel || []))
      .catch(() => {});
  }, []);

  // 2. Load seller products
  async function load(p = page, q = search, cat = selectedCategory) {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ page: String(p), limit: '20' });
    if (q) params.set('search', q);
    if (cat) params.set('category', cat);

    try {
      const res = await fetch(`/api/seller/products?${params}`);
      if (res.status === 401) {
        router.push('/seller/login');
        return;
      }
      const data = await res.json();
      setProducts(data.products || []);
      setTotal(data.total || 0);
    } catch {
      setError('Failed to load seller inventory.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1, search, selectedCategory);
  }, [selectedCategory]); // eslint-disable-line

  async function onDelete(id, name) {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to delete product.');
        return;
      }
      toast.success('Product deleted successfully');
      load(page, search, selectedCategory);
    } catch {
      toast.error('Network error deleting product.');
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8" style={{ background: PAPER }}>
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-[#E8E8E8]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight uppercase" style={{ color: INK }}>
            My Products
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6B6B] mt-1">
            Manage your catalog inventory, pricing, pack sizes, and bestseller status.
          </p>
        </div>

        <Link
          href="/seller/products/add"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold tracking-wide uppercase bg-black text-white hover:bg-neutral-800 transition-all shadow-sm shrink-0"
        >
          <Plus size={15} />
          <span>Add Product</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            load(1, search, selectedCategory);
          }}
          className="relative flex-1"
        >
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#888888]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by name or SKU..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-[#E8E8E8] outline-none focus:border-black transition-colors"
          />
        </form>

        {/* Category Filter */}
        <div className="sm:w-60">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 text-sm rounded-lg border border-[#E8E8E8] outline-none bg-white focus:border-black cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg text-xs font-semibold bg-[#FCE8E6] text-[#B3261E]">
          {error}
        </div>
      )}

      {/* Products Table */}
      {loading ? (
        <div className="py-12 text-center text-sm text-[#6B6B6B]">Loading your products...</div>
      ) : products.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-[#E8E8E8] rounded-2xl">
          <p className="text-sm font-semibold text-[#000000]">No products found</p>
          <p className="text-xs text-[#6B6B6B] mt-1 mb-4">
            {search || selectedCategory
              ? 'Try adjusting your search or category filters'
              : 'Start by adding your first product to the catalog'}
          </p>
          <Link
            href="/seller/products/add"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-black text-white hover:bg-neutral-800 transition-all"
          >
            <Plus size={14} />
            <span>Add Product</span>
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#E8E8E8]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#FAF7F0] border-b border-[#E8E8E8]">
              <tr>
                <th className="py-3 px-4 font-semibold text-[#1A1A1A]">Product</th>
                <th className="py-3 px-3 font-semibold text-[#1A1A1A]">SKU</th>
                <th className="py-3 px-3 font-semibold text-[#1A1A1A]">Category</th>
                <th className="py-3 px-3 font-semibold text-[#1A1A1A]">Selling Price</th>
                <th className="py-3 px-3 font-semibold text-[#1A1A1A]">Original Price</th>
                <th className="py-3 px-3 font-semibold text-[#1A1A1A]">Discount</th>
                <th className="py-3 px-3 font-semibold text-[#1A1A1A]">Stock Status</th>
                <th className="py-3 px-3 font-semibold text-[#1A1A1A]">Badge</th>
                <th className="py-3 px-4 font-semibold text-right text-[#1A1A1A]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E8E8]">
              {products.map((p) => {
                const firstVariant = p.variants?.[0] || {};
                const imageSrc =
                  firstVariant.images?.[0] || p.images?.[0] || p.image || '/images/placeholder.svg';

                // Calculate total stock across all variants & pack sizes
                const totalStock = (p.variants || []).reduce(
                  (sum, v) => sum + (v.sizes || []).reduce((s, sz) => s + (sz.stock || 0), 0),
                  0
                );

                const sellingPrice = p.basePrice || firstVariant.price || 0;
                const originalPrice = firstVariant.compareAtPrice || 0;
                const discountPct =
                  originalPrice > sellingPrice
                    ? Math.round(((originalPrice - sellingPrice) / originalPrice) * 100)
                    : p.discountPercentage || 0;

                return (
                  <tr key={p._id} className="hover:bg-[#FAF8F5] transition-colors">
                    {/* Image & Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-neutral-100 border border-[#E8E8E8] shrink-0">
                          <Image
                            src={imageSrc}
                            alt={p.name}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        </div>
                        <div className="max-w-[200px]">
                          <p className="font-semibold text-sm text-[#000000] truncate" title={p.name}>
                            {p.name}
                          </p>
                          <Link
                            href={`/product/${p.slug}`}
                            target="_blank"
                            className="inline-flex items-center gap-0.5 text-[11px] text-[#C9A227] hover:underline"
                          >
                            <span>View Storefront</span>
                            <Eye size={11} />
                          </Link>
                        </div>
                      </div>
                    </td>

                    {/* SKU */}
                    <td className="py-3 px-3 font-mono text-[#5E5E5E]">{p.sku || '—'}</td>

                    {/* Category */}
                    <td className="py-3 px-3 text-[#1A1A1A]">{p.category?.name || '—'}</td>

                    {/* Selling Price */}
                    <td className="py-3 px-3 font-bold text-[#000000]">₹{sellingPrice}</td>

                    {/* Original Price */}
                    <td className="py-3 px-3 text-[#6B6B6B]">
                      {originalPrice > sellingPrice ? (
                        <span className="line-through">₹{originalPrice}</span>
                      ) : (
                        '—'
                      )}
                    </td>

                    {/* Discount % */}
                    <td className="py-3 px-3">
                      {discountPct > 0 ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F6EFD9] text-[#000000]">
                          {discountPct}% OFF
                        </span>
                      ) : (
                        <span className="text-[#888888]">0%</span>
                      )}
                    </td>

                    {/* Stock Status */}
                    <td className="py-3 px-3">
                      {totalStock <= 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                          Out of Stock
                        </span>
                      ) : totalStock < 5 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          Only {totalStock} Left
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                          In Stock ({totalStock})
                        </span>
                      )}
                    </td>

                    {/* Best Seller Status */}
                    <td className="py-3 px-3">
                      {p.isBestSeller ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C9A227] text-black">
                          <Crown size={10} className="fill-black" />
                          <span>Best Seller</span>
                        </span>
                      ) : (
                        <span className="text-[#888888]">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/seller/products/edit/${p._id}`}
                          className="p-1.5 rounded hover:bg-neutral-200 text-[#000000] transition-colors"
                          title="Edit Product"
                        >
                          <Edit3 size={15} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => onDelete(p._id, p.name)}
                          className="p-1.5 rounded hover:bg-red-50 text-[#B3261E] transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="mt-6 flex items-center justify-between text-xs text-[#6B6B6B]">
          <span>
            Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total} products
          </span>
          <div className="flex gap-1.5">
            {Array.from({ length: Math.ceil(total / 20) }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setPage(i + 1);
                  load(i + 1, search, selectedCategory);
                }}
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-semibold transition-all ${
                  page === i + 1
                    ? 'bg-black text-white'
                    : 'border border-[#E8E8E8] text-black hover:bg-neutral-50'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
