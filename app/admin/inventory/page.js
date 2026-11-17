'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Save,
  Search,
  X,
  ChevronDown,
  ChevronRight,
  Eye,
  Trash2,
  Lock,
  Store,
  Layers,
  Filter,
  Package,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
} from 'lucide-react';

export default function AdminInventoryPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [edits, setEdits] = useState({});
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [ownershipFilter, setOwnershipFilter] = useState('all'); // 'all' | 'admin' | 'seller'
  const [sellerFilter, setSellerFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [subcategoryFilter, setSubcategoryFilter] = useState('all');
  const [stockStatusFilter, setStockStatusFilter] = useState('all'); // 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'

  const [collapsed, setCollapsed] = useState({});
  const [zoomImage, setZoomImage] = useState(null);
  const [viewDetailsProduct, setViewDetailsProduct] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const [prodRes, catRes, sellRes] = await Promise.all([
        fetch('/api/products?limit=200'),
        fetch('/api/categories?all=true'),
        fetch('/api/admin/sellers'),
      ]);
      const [prodData, catData, sellData] = await Promise.all([
        prodRes.json(),
        catRes.json(),
        sellRes.json(),
      ]);

      setProducts(prodData.products || []);
      setCategories(catData.categories || []);
      setSellers(sellData.sellers || []);
    } catch {
      toast.error('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function editKey(productId, variantId, size) {
    return `${productId}-${variantId}-${size}`;
  }

  function setStock(productId, variantId, size, value) {
    setEdits((e) => ({ ...e, [editKey(productId, variantId, size)]: value }));
  }

  async function saveRow(product, variant, sizeObj) {
    // Feature 7: Admin cannot edit seller-owned products
    if (product.seller) {
      toast.error('Permission Denied: Admin cannot edit seller-owned products.');
      return;
    }

    const key = editKey(product._id, variant._id, sizeObj.size);
    const newStock = edits[key];
    if (newStock === undefined) return;

    const updatedVariants = product.variants.map((v) =>
      v._id === variant._id
        ? {
            ...v,
            sizes: v.sizes.map((s) =>
              s.size === sizeObj.size ? { ...s, stock: Number(newStock) } : s
            ),
          }
        : v
    );

    try {
      const res = await fetch(`/api/products/${product._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variants: updatedVariants }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Inventory stock updated successfully');
        load();
      } else {
        toast.error(data.error || 'Failed to update stock');
      }
    } catch {
      toast.error('Network error updating stock');
    }
  }

  async function onDeleteProduct(productId, name) {
    if (
      !confirm(
        `Are you sure you want to permanently delete "${name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        toast.success('Product deleted from inventory');
        load();
      } else {
        toast.error(data.error || 'Failed to delete product');
      }
    } catch {
      toast.error('Network error deleting product');
    }
  }

  function productTotalStock(p) {
    return (p.variants || []).reduce((sum, v) => {
      return (
        sum +
        (v.sizes || []).reduce((sAcc, sz) => {
          const key = editKey(p._id, v._id, sz.size);
          const val = edits[key] !== undefined ? Number(edits[key]) : sz.stock;
          return sAcc + (Number(val) || 0);
        }, 0)
      );
    }, 0);
  }

  // Subcategories matching current parent category filter
  const subcategoriesForParent = useMemo(() => {
    if (categoryFilter === 'all') return [];
    const parent = categories.find((c) => c._id === categoryFilter || c.slug === categoryFilter);
    return parent?.subcategories || [];
  }, [categoryFilter, categories]);

  // Filtering
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Search query
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.barcode?.toLowerCase().includes(q)
      );
    }

    // Ownership: Admin vs Seller
    if (ownershipFilter === 'admin') {
      list = list.filter((p) => !p.seller);
    } else if (ownershipFilter === 'seller') {
      list = list.filter((p) => !!p.seller);
    }

    // Individual Seller
    if (sellerFilter !== 'all') {
      list = list.filter(
        (p) => p.seller && String(p.seller._id || p.seller) === String(sellerFilter)
      );
    }

    // Category
    if (categoryFilter !== 'all') {
      list = list.filter((p) => {
        const catId = p.category?._id || p.category;
        return catId === categoryFilter;
      });
    }

    // Subcategory
    if (subcategoryFilter !== 'all') {
      list = list.filter((p) => {
        const subId = p.subcategory?._id || p.subcategory || p.subCategory;
        return String(subId).toLowerCase() === subcategoryFilter.toLowerCase();
      });
    }

    // Stock Status
    if (stockStatusFilter !== 'all') {
      list = list.filter((p) => {
        const total = productTotalStock(p);
        if (stockStatusFilter === 'out_of_stock') return total <= 0;
        if (stockStatusFilter === 'low_stock') return total > 0 && total <= 5;
        if (stockStatusFilter === 'in_stock') return total > 5;
        return true;
      });
    }

    return list;
  }, [
    products,
    search,
    ownershipFilter,
    sellerFilter,
    categoryFilter,
    subcategoryFilter,
    stockStatusFilter,
    edits,
  ]);

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E7E2D6]">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
            Inventory & Warehouse Control
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Monitor real-time stock levels across platform and seller catalogs. Admin can update stock for admin-owned items only.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-5 rounded-3xl border border-[#E7E2D6] shadow-xs space-y-4">
        {/* Row 1: Search & Ownership Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              placeholder="Search by product name, SKU, or barcode…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-[#D6D6D6] outline-none focus:border-[#0F172A]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Ownership Segment */}
          <div className="inline-flex p-1 bg-[#F5F5F5] rounded-xl border border-[#E8E8E8] text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setOwnershipFilter('all');
                setSellerFilter('all');
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                ownershipFilter === 'all'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-[#64748B] hover:text-black'
              }`}
            >
              All Products
            </button>
            <button
              type="button"
              onClick={() => {
                setOwnershipFilter('admin');
                setSellerFilter('all');
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                ownershipFilter === 'admin'
                  ? 'bg-[#C9A227] text-black shadow-xs'
                  : 'text-[#64748B] hover:text-black'
              }`}
            >
              Admin Products
            </button>
            <button
              type="button"
              onClick={() => setOwnershipFilter('seller')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                ownershipFilter === 'seller'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-[#64748B] hover:text-black'
              }`}
            >
              Seller Products
            </button>
          </div>
        </div>

        {/* Row 2: Detailed Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-[#F0EFE9]">
          {/* Individual Seller Filter */}
          <div>
            <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
              Filter by Supplier
            </label>
            <select
              value={sellerFilter}
              onChange={(e) => {
                setSellerFilter(e.target.value);
                if (e.target.value !== 'all') setOwnershipFilter('seller');
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#D6D6D6] outline-none focus:border-[#0F172A] bg-white"
            >
              <option value="all">All Suppliers</option>
              {sellers.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.businessName || s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setSubcategoryFilter('all');
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#D6D6D6] outline-none focus:border-[#0F172A] bg-white"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subcategory Filter */}
          <div>
            <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
              Subcategory
            </label>
            <select
              value={subcategoryFilter}
              disabled={categoryFilter === 'all' || !subcategoriesForParent.length}
              onChange={(e) => setSubcategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#D6D6D6] outline-none focus:border-[#0F172A] bg-white disabled:bg-neutral-50 disabled:text-neutral-400"
            >
              <option value="all">All Subcategories</option>
              {subcategoriesForParent.map((sub) => (
                <option key={sub.name || sub} value={sub.name || sub}>
                  {sub.name || sub}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Status Filter */}
          <div>
            <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
              Stock Status
            </label>
            <select
              value={stockStatusFilter}
              onChange={(e) => setStockStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#D6D6D6] outline-none focus:border-[#0F172A] bg-white"
            >
              <option value="all">All Inventory</option>
              <option value="in_stock">In Stock (&gt; 5 units)</option>
              <option value="low_stock">Low Stock (1 - 5 units)</option>
              <option value="out_of_stock">Out of Stock (0 units)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-3xl border border-[#E7E2D6] shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#F0EFE9] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package size={16} className="text-[#C9A227]" />
            <h2 className="font-bold text-sm text-[#0F172A]">
              Inventory Items ({filteredProducts.length} Products Found)
            </h2>
          </div>
          <span className="text-xs text-[#64748B]">
            Showing filtered SKU inventory levels
          </span>
        </div>

        {loading ? (
          <div className="min-h-[300px] flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-[#E8E8E8] border-t-[#C9A227] animate-spin" />
            <p className="text-xs text-[#64748B]">Loading inventory warehouse…</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Package size={24} className="mx-auto text-neutral-400" />
            <p className="text-xs font-bold text-[#0F172A]">No products match current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F5] text-[#64748B] font-bold uppercase text-[10px] tracking-wider border-b border-[#E7E2D6]">
                <tr>
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-4">Ownership / Supplier</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Variant / Option</th>
                  <th className="py-3 px-4">Size / SKU</th>
                  <th className="py-3 px-4">Current Stock</th>
                  <th className="py-3 px-4">Permissions</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EFE9]">
                {filteredProducts.flatMap((p) => {
                  const isSellerOwned = Boolean(p.seller);
                  const sellerName = p.seller?.businessName || p.seller?.name || 'Seller';
                  const thumbnail =
                    p.variants?.[0]?.images?.[0] || p.images?.[0] || '/images/product-placeholder.png';

                  return (p.variants || []).flatMap((v) =>
                    (v.sizes || []).map((sz) => {
                      const key = editKey(p._id, v._id, sz.size);
                      const currentVal = edits[key] !== undefined ? edits[key] : sz.stock;
                      const numVal = Number(currentVal) || 0;

                      return (
                        <tr key={key} className="hover:bg-neutral-50/75 transition-colors">
                          {/* Image & Title */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div
                                onClick={() => setZoomImage(thumbnail)}
                                className="w-10 h-10 rounded-xl overflow-hidden bg-neutral-100 border border-[#E7E2D6] shrink-0 cursor-pointer"
                              >
                                <img
                                  src={thumbnail}
                                  alt={p.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="min-w-0 max-w-[200px]">
                                <div className="font-bold text-[#0F172A] truncate" title={p.name}>
                                  {p.name}
                                </div>
                                <div className="text-[10px] text-[#64748B] truncate">
                                  SKU: {p.sku || '—'}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Ownership */}
                          <td className="py-3 px-4">
                            {isSellerOwned ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF9F5] text-[#0F172A] border border-[#E7E2D6]">
                                <Store size={10} className="text-[#C9A227]" />
                                <span className="truncate max-w-[120px]">{sellerName}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF7EE] text-[#C9A227] border border-[#E7E2D6]">
                                Admin Owned
                              </span>
                            )}
                          </td>

                          {/* Category */}
                          <td className="py-3 px-4 text-[#64748B]">
                            {p.category?.name || 'General'}
                          </td>

                          {/* Variant */}
                          <td className="py-3 px-4 text-[#0F172A] font-semibold">
                            {v.color || 'Default Variant'}
                          </td>

                          {/* Size & SKU */}
                          <td className="py-3 px-4">
                            <span className="font-bold text-[#0F172A]">{sz.size}</span>
                            {sz.sku && (
                              <span className="block text-[10px] text-[#64748B]">{sz.sku}</span>
                            )}
                          </td>

                          {/* Current Stock & Edit Control */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {isSellerOwned ? (
                                <div
                                  className="relative group inline-block"
                                  title="Admin cannot edit seller-owned products. Stock can only be updated by the supplier."
                                >
                                  <input
                                    type="number"
                                    disabled
                                    value={currentVal}
                                    className="w-16 px-2 py-1 rounded-lg border border-[#D6D6D6] bg-neutral-100 text-[#64748B] cursor-not-allowed font-bold text-center"
                                  />
                                </div>
                              ) : (
                                <input
                                  type="number"
                                  min="0"
                                  value={currentVal}
                                  onChange={(e) => setStock(p._id, v._id, sz.size, e.target.value)}
                                  className={`w-16 px-2 py-1 rounded-lg border text-center font-bold outline-none ${
                                    numVal <= 0
                                      ? 'border-red-400 bg-red-50 text-red-700'
                                      : numVal <= 5
                                      ? 'border-amber-400 bg-amber-50 text-amber-800'
                                      : 'border-[#D6D6D6] focus:border-black'
                                  }`}
                                />
                              )}

                              <span
                                className={`inline-block w-2 h-2 rounded-full ${
                                  numVal <= 0
                                    ? 'bg-red-500'
                                    : numVal <= 5
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                                title={
                                  numVal <= 0
                                    ? 'Out of Stock'
                                    : numVal <= 5
                                    ? 'Low Stock'
                                    : 'In Stock'
                                }
                              />
                            </div>
                          </td>

                          {/* Permission Status */}
                          <td className="py-3 px-4">
                            {isSellerOwned ? (
                              <span
                                className="inline-flex items-center gap-1 text-[11px] text-[#64748B] cursor-help"
                                title="Admin CANNOT edit seller-owned products. Only viewing details and deletion are permitted."
                              >
                                <Lock size={12} className="text-amber-600" />
                                <span>Edit Disabled</span>
                              </span>
                            ) : (
                              <span className="text-[11px] text-emerald-700 font-bold">
                                Editable
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Save Stock Button (Admin products only) */}
                              {!isSellerOwned ? (
                                <button
                                  type="button"
                                  onClick={() => saveRow(p, v, sz)}
                                  className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors"
                                  title="Save Stock Update"
                                >
                                  <Save size={15} />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled
                                  className="p-1.5 rounded-lg text-neutral-300 cursor-not-allowed"
                                  title="Edit Disabled: Seller-owned product"
                                >
                                  <Save size={15} />
                                </button>
                              )}

                              {/* View Details Modal Button */}
                              <button
                                type="button"
                                onClick={() => setViewDetailsProduct(p)}
                                className="p-1.5 rounded-lg text-[#0F172A] hover:bg-neutral-100 transition-colors"
                                title="View Product Details"
                              >
                                <Eye size={15} />
                              </button>

                              {/* Delete Button (Allowed for all with confirmation) */}
                              <button
                                type="button"
                                onClick={() => onDeleteProduct(p._id, p.name)}
                                className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 transition-colors"
                                title="Delete Product"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Product Details Modal (Feature 7: Admin CAN view details of seller-owned products) */}
      {viewDetailsProduct && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setViewDetailsProduct(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full border border-[#E7E2D6] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-[#F0EFE9] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#C9A227]">
                  {viewDetailsProduct.seller ? 'Seller-Owned Catalog Product' : 'Admin Flagship Product'}
                </span>
                <h3 className="font-extrabold text-base text-[#0F172A]">
                  {viewDetailsProduct.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewDetailsProduct(null)}
                className="p-1.5 text-neutral-400 hover:text-black rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              {/* Supplier Info */}
              <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E7E2D6] flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#64748B]">Supplier / Owner:</span>
                  <div className="font-extrabold text-sm text-[#0F172A]">
                    {viewDetailsProduct.seller?.businessName || viewDetailsProduct.seller?.name || 'Digital World Official Store'}
                  </div>
                </div>
                {viewDetailsProduct.seller && (
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    Restricted Edit
                  </span>
                )}
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-[#E7E2D6]">
                  <span className="text-[10px] uppercase font-bold text-[#64748B]">Category</span>
                  <div className="font-bold text-sm text-[#0F172A] mt-0.5">
                    {viewDetailsProduct.category?.name || 'General'}
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-[#E7E2D6]">
                  <span className="text-[10px] uppercase font-bold text-[#64748B]">Product SKU / Barcode</span>
                  <div className="font-bold text-sm text-[#0F172A] mt-0.5">
                    {viewDetailsProduct.sku || viewDetailsProduct.barcode || '—'}
                  </div>
                </div>
              </div>

              {/* Description */}
              {viewDetailsProduct.description && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#64748B]">Description</span>
                  <p className="text-xs text-[#334155] mt-1 leading-relaxed">
                    {viewDetailsProduct.description}
                  </p>
                </div>
              )}

              {/* Variants & Stock Table */}
              <div>
                <span className="text-[10px] uppercase font-bold text-[#64748B] block mb-2">
                  Configured Variants & Sizes ({viewDetailsProduct.variants?.length || 0})
                </span>
                <div className="border border-[#E7E2D6] rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF9F5] text-[10px] uppercase font-bold text-[#64748B]">
                      <tr>
                        <th className="p-2.5">Variant</th>
                        <th className="p-2.5">Size / Option</th>
                        <th className="p-2.5">Price</th>
                        <th className="p-2.5">Selling Price</th>
                        <th className="p-2.5">Warehouse Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0EFE9]">
                      {(viewDetailsProduct.variants || []).flatMap((v) =>
                        (v.sizes || []).map((sz, sIdx) => (
                          <tr key={`${v._id}-${sIdx}`}>
                            <td className="p-2.5 font-bold text-[#0F172A]">{v.color || 'Default'}</td>
                            <td className="p-2.5">{sz.size}</td>
                            <td className="p-2.5">₹{sz.price || v.price || '—'}</td>
                            <td className="p-2.5 font-bold text-emerald-700">
                              ₹{sz.sellingPrice || sz.price || v.sellingPrice || v.price}
                            </td>
                            <td className="p-2.5 font-bold">{sz.stock ?? 0} units</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#FAF9F5] border-t border-[#F0EFE9] flex items-center justify-between text-xs">
              <span className="text-[#64748B]">
                {viewDetailsProduct.seller
                  ? 'Seller products can only be edited by the supplier from their merchant portal.'
                  : 'Admin products are fully editable by superadmin.'}
              </span>
              <button
                type="button"
                onClick={() => setViewDetailsProduct(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0F172A] text-white"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Zoom Modal */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setZoomImage(null)}
        >
          <img
            src={zoomImage}
            alt="Product Zoom"
            className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
