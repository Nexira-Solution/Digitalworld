'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Package,
  Layers,
  Sparkles,
  Percent,
  IndianRupee,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Plus,
  X,
  Upload,
  Info,
} from 'lucide-react';

const INK = '#0F172A';
const INK_SOFT = '#64748B';
const LINE = '#E7E2D6';
const PAPER = '#FFFFFF';
const RED = '#DC2626';
const GOLD = '#C9A227';

const inputClass = 'w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#D6D6D6] outline-none focus:border-[#0F172A] transition-colors';

const emptyItem = () => ({ product: '', variantId: '', size: '', qty: 1 });
const emptyColor = () => ({ name: '', hex: '#000000', variantId: '', size: '', stock: '' });
const emptyPack = () => ({ size: '', price: '', originalPrice: '', stock: '' });
const emptyChartRow = () => ({ size: '', chest: '', waist: '', length: '' });

const OPTION_LABELS = {
  apparel: 'Size',
  clothing: 'Size',
  electronics: 'Variant',
  snacks: 'Pack Size',
  sweets: 'Net Weight',
  groceries: 'Pack Size',
  vegetables: 'Quantity',
  fruits: 'Quantity',
  general: 'Option',
};
const optLabel = (p) => OPTION_LABELS[p?.productType] || 'Size / Option';

const idOf = (v) => (v && typeof v === 'object' ? v._id : v) || '';

export default function ComboForm({ mode = 'seller', comboId, initialCombo, onSaved, onCancel }) {
  const router = useRouter();
  const isEdit = !!comboId;
  const c = initialCombo;
  const api = mode === 'admin' ? '/api/combos' : '/api/seller/combos';
  const productsUrl = mode === 'admin' ? '/api/products?limit=200' : '/api/seller/products?limit=200';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [productsLoading, setProductsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    type: c?.type || 'multi-product',
    name: c?.name || '',
    sku: c?.sku || '',
    description: c?.description || '',
    images: c?.images?.length ? c.images : c?.image ? [c.image] : [],
    comboPrice: c?.comboPrice || '',
    originalPrice: c?.originalPrice || '',
    discountType: c?.discountType || 'fixed', // 'fixed' | 'percentage'
    discountValue: c?.discountValue || '',
    comboStock: c?.comboStock ?? '',
    isActive: c ? c.isActive !== false : true,
    baseProduct: idOf(c?.baseProduct),
  });

  const [items, setItems] = useState(
    c?.products?.length
      ? c.products.map((p) => ({
          product: idOf(p.product),
          variantId: p.variantId || '',
          size: p.size || '',
          qty: p.qty || 1,
        }))
      : [emptyItem(), emptyItem()]
  );

  const [colors, setColors] = useState(
    c?.colors?.length
      ? c.colors.map((x) => ({
          name: x.name,
          hex: x.hex || '#000000',
          variantId: x.variantId || '',
          size: x.size || '',
          stock: x.stock ?? '',
        }))
      : []
  );

  const [packs, setPacks] = useState(
    c?.packOptions?.length
      ? c.packOptions.map((p) => ({
          size: p.size,
          price: p.price,
          originalPrice: p.originalPrice || '',
          stock: p.stock ?? '',
        }))
      : [emptyPack()]
  );

  const [chart, setChart] = useState(
    c?.sizeChart?.length ? c.sizeChart.map((r) => ({ ...emptyChartRow(), ...r })) : []
  );

  useEffect(() => {
    let alive = true;
    fetch(productsUrl)
      .then((r) => r.json())
      .then((d) => {
        if (alive) setProducts(d.products || []);
      })
      .catch(() => {
        if (alive) setError('Could not load products catalog.');
      })
      .finally(() => {
        if (alive) setProductsLoading(false);
      });

    fetch('/api/categories?all=true')
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        const list = Array.isArray(d) ? d : d.topLevel || d.categories || [];
        setCategories(list.filter((c) => c.isActive !== false));
      })
      .catch(() => {});

    return () => {
      alive = false;
    };
  }, [productsUrl]);

  const filteredProducts = useMemo(() => {
    if (selectedCategoryFilter === 'ALL' || !selectedCategoryFilter) {
      return products;
    }
    return products.filter((p) => {
      const catId = p.category?._id || p.category;
      return String(catId) === String(selectedCategoryFilter);
    });
  }, [products, selectedCategoryFilter]);

  const prodById = (id) => products.find((p) => String(p._id) === String(id));
  const upd = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setAt = (setter) => (i, patch) =>
    setter((list) => list.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  const removeAt = (setter) => (i) => setter((list) => list.filter((_, idx) => idx !== i));
  const setItem = setAt(setItems);
  const setColor = setAt(setColors);
  const setPack = setAt(setPacks);
  const setRow = setAt(setChart);

  // Bundle line computations
  function onItemProduct(i, id) {
    const p = prodById(id);
    const v = p?.variants?.length === 1 ? p.variants[0] : null;
    setItem(i, {
      product: id,
      variantId: v?._id || '',
      size: v?.sizes?.length === 1 ? v.sizes[0].size : '',
    });
  }

  function onItemVariant(i, variantId) {
    const p = prodById(items[i].product);
    const v = p?.variants?.find((x) => String(x._id) === String(variantId));
    setItem(i, {
      variantId,
      size: v?.sizes?.length === 1 ? v.sizes[0].size : '',
    });
  }

  const lineInfo = useMemo(() => {
    return items.map((it) => {
      const p = prodById(it.product);
      const variant = p?.variants?.find((v) => String(v._id) === String(it.variantId));
      const sizeObj = variant?.sizes?.find((s) => s.size === it.size);
      const qty = Math.max(Number(it.qty) || 1, 1);
      const stock = sizeObj ? Number(sizeObj.stock || 0) : null;
      const actualPrice = Number(sizeObj?.price || variant?.price || p?.price || 0);
      const sellingPrice = Number(
        sizeObj?.sellingPrice || sizeObj?.price || variant?.sellingPrice || variant?.price || p?.sellingPrice || p?.price || 0
      );
      const image = variant?.images?.[0] || p?.images?.[0] || '';
      return { p, variant, sizeObj, qty, stock, actualPrice, sellingPrice, image };
    });
  }, [items, products]);

  const itemsTotal = useMemo(() => {
    return lineInfo.reduce((sum, l) => sum + (l.p ? l.sellingPrice * l.qty : 0), 0);
  }, [lineInfo]);

  const actualTotal = useMemo(() => {
    return lineInfo.reduce((sum, l) => sum + (l.p ? (l.actualPrice || l.sellingPrice) * l.qty : 0), 0);
  }, [lineInfo]);

  // Limiting stock calculation
  const { sellableStock, limitingProduct } = useMemo(() => {
    const validLines = lineInfo.filter((l) => l.p && l.stock !== null);
    if (!validLines.length) return { sellableStock: null, limitingProduct: null };

    let minUnits = Infinity;
    let limiting = null;

    validLines.forEach((l) => {
      const possible = Math.floor(l.stock / l.qty);
      if (possible < minUnits) {
        minUnits = possible;
        limiting = l.p?.name;
      }
    });

    return { sellableStock: minUnits === Infinity ? null : minUnits, limitingProduct: limiting };
  }, [lineInfo]);

  // Dynamic price calculation according to discount type
  const { calculatedComboPrice, savingsAmount, savingsPercentage } = useMemo(() => {
    let comboPrice = Number(form.comboPrice) || 0;
    const discountVal = Number(form.discountValue) || 0;

    if (form.discountType === 'percentage' && discountVal > 0) {
      const pct = Math.min(99, Math.max(0, discountVal));
      const savings = Math.round(itemsTotal * (pct / 100));
      comboPrice = Math.max(1, itemsTotal - savings);
    } else if (form.discountType === 'fixed' && discountVal > 0) {
      comboPrice = Math.max(1, itemsTotal - discountVal);
    }

    const savings = Math.max(0, itemsTotal - comboPrice);
    const pct = itemsTotal > 0 ? Math.round((savings / itemsTotal) * 100) : 0;

    return {
      calculatedComboPrice: comboPrice,
      savingsAmount: savings,
      savingsPercentage: pct,
    };
  }, [itemsTotal, form.comboPrice, form.discountType, form.discountValue]);

  // Color pack helpers
  const base = prodById(form.baseProduct);
  const baseHasColors = !base || (base.variants || []).some((v) => v.color);
  const baseIsApparel = !base || !base.productType || base.productType === 'apparel' || base.productType === 'clothing';
  const entryWord = baseHasColors ? 'Colour' : 'Option';

  function importColors(p = base) {
    if (!p) return;
    const hasColors = (p.variants || []).some((v) => v.color);
    setColors(
      hasColors
        ? (p.variants || []).map((v, i) => ({
            name: v.color || `Variant ${i + 1}`,
            hex: v.colorHex || '#000000',
            variantId: v._id,
            size: v.sizes?.length === 1 ? v.sizes[0].size : '',
            stock: '',
          }))
        : (p.variants || []).flatMap((v) =>
            (v.sizes || []).map((sz) => ({
              name: sz.size,
              hex: '',
              variantId: v._id,
              size: sz.size,
              stock: '',
            }))
          )
    );
  }

  function onBaseChange(id) {
    upd('baseProduct', id);
    const p = prodById(id);
    if (p && colors.every((x) => !x.name)) importColors(p);
  }

  function onColorVariant(i, variantId) {
    const v = base?.variants?.find((x) => String(x._id) === String(variantId));
    setColor(i, { variantId, size: v?.sizes?.length === 1 ? v.sizes[0].size : '' });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);

    const isBundle = form.type === 'multi-product' || form.type === 'bundle';
    const finalComboPrice = form.discountType !== 'fixed' || form.discountValue
      ? calculatedComboPrice
      : Number(form.comboPrice);

    if (isBundle && itemsTotal > 0 && finalComboPrice >= itemsTotal) {
      setError(`Combo price (₹${finalComboPrice}) must be less than the regular total price (₹${itemsTotal}) to provide real customer savings.`);
      setSaving(false);
      return;
    }

    const payload = {
      type: form.type,
      name: form.name,
      sku: form.sku,
      description: form.description,
      images: form.images,
      comboStock: form.comboStock === '' || form.comboStock === null ? null : Number(form.comboStock),
      isActive: form.isActive,
      ...(isBundle
        ? {
            products: items.map((it) => ({
              product: it.product,
              variantId: it.variantId,
              size: it.size,
              qty: Number(it.qty) || 1,
            })),
            comboPrice: finalComboPrice,
            originalPrice: itemsTotal,
            discountType: form.discountType,
            discountValue: Number(form.discountValue) || savingsAmount,
          }
        : {
            baseProduct: form.baseProduct,
            colors,
            packOptions: packs,
            sizeChart: chart,
          }),
    };

    try {
      const res = await fetch(isEdit ? `${api}/${comboId}` : api, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Failed to save combo offer.');
        setSaving(false);
        return;
      }
      if (onSaved) {
        onSaved(data.combo);
      } else {
        router.push(mode === 'admin' ? '/admin/combos' : '/seller/combos');
      }
    } catch {
      setError('An unexpected network error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const isMulti = form.type === 'multi-product' || form.type === 'bundle';

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6 max-w-4xl mx-auto">
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-center gap-2">
          <AlertTriangle size={16} className="shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Combo Type Segment */}
      <div className="bg-white p-5 rounded-3xl border border-[#E7E2D6] shadow-xs space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
          1. Combo Configuration Type
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            [
              'multi-product',
              'Multi-Product Curated Bundle',
              'Bundle distinct products (e.g. matching outfit, gourmet food set, tech bundle) with transparent individual specifications and bundled savings.',
            ],
            [
              'color-pack',
              'Single-Product Multipack',
              'Bulk quantity packs of a single item (e.g. 2-Pack, 3-Pack, 5-Pack) with volume-tiered discounts.',
            ],
          ].map(([value, label, hint]) => {
            const checked = form.type === value || (value === 'multi-product' && form.type === 'bundle') || (value === 'color-pack' && form.type === 'multipack');
            return (
              <label
                key={value}
                className={`p-4 rounded-2xl cursor-pointer border transition-all ${
                  checked
                    ? 'border-[#0F172A] bg-[#FAF9F5] shadow-xs'
                    : 'border-[#E7E2D6] bg-white hover:border-neutral-400'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="comboType"
                    checked={checked}
                    onChange={() => upd('type', value)}
                    disabled={isEdit}
                    className="text-[#0F172A] focus:ring-0"
                  />
                  <span className="font-bold text-xs sm:text-sm text-[#0F172A]">{label}</span>
                </div>
                <p className="text-[11px] text-[#64748B] mt-1.5 pl-6 leading-relaxed">{hint}</p>
              </label>
            );
          })}
        </div>
      </div>

      {/* 2. Basic Information */}
      <div className="bg-white p-5 rounded-3xl border border-[#E7E2D6] shadow-xs space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
          2. Basic Combo Information
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">
              Combo Offer Title *
            </label>
            <input
              required
              maxLength={120}
              placeholder="e.g. Traditional Festive Sweet & Savory Hamper"
              value={form.name}
              onChange={(e) => upd('name', e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">
              Combo SKU / Barcode
            </label>
            <input
              placeholder="e.g. CMB-FEST-01"
              value={form.sku}
              onChange={(e) => upd('sku', e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">
            Offer Description
          </label>
          <textarea
            rows={2}
            placeholder="Detailed description of what is included in this value combo."
            value={form.description}
            onChange={(e) => upd('description', e.target.value)}
            className={`${inputClass} resize-none`}
          />
        </div>

        {/* Image Uploader */}
        <div>
          <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-2">
            Combo Showcase Images
          </label>
          <ImageUploader value={form.images} onChange={(v) => upd('images', v)} />
        </div>

        <div className="pt-2 border-t border-[#F0EFE9]">
          <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-[#0F172A]">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => upd('isActive', e.target.checked)}
              className="rounded text-[#0F172A] focus:ring-0"
            />
            <span>Active & Published on Marketplace</span>
          </label>
        </div>
      </div>

      {/* 3. Product Selection with Full Details */}
      {isMulti && (
        <div className="bg-white p-5 rounded-3xl border border-[#E7E2D6] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F0EFE9] pb-3">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                3. Products in this Bundle
              </h2>
              <p className="text-[11px] text-[#64748B]">
                {mode === 'seller'
                  ? 'Select only your own verified products. Cross-seller product mixing is blocked.'
                  : 'Select products belonging to the official platform or one merchant.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setItems((l) => [...l, emptyItem()])}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FAF7EE] text-[#C9A227] border border-[#E7E2D6] hover:bg-[#F2ECE0] self-start"
            >
              <Plus size={14} />
              <span>Add Product</span>
            </button>
          </div>

          <div className="space-y-4">
            {items.map((it, i) => {
              const { p, variant, sizeObj, qty, stock, actualPrice, sellingPrice, image } = lineInfo[i];
              return (
                <div
                  key={i}
                  className="p-4 rounded-2xl border border-[#E7E2D6] bg-[#FCFBF8] space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-start">
                    {/* Product Selector */}
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-[#64748B] uppercase mb-1">
                        Product #{i + 1}
                      </label>
                      <select
                        required
                        value={it.product}
                        onChange={(e) => onItemProduct(i, e.target.value)}
                        className={inputClass}
                      >
                        <option value="">Select a product from catalog…</option>
                        {products.map((prod) => (
                          <option key={prod._id} value={prod._id}>
                            {prod.name} ({prod.category?.name || 'General'})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Variant Selector */}
                    <div>
                      <label className="block text-[10px] font-bold text-[#64748B] uppercase mb-1">
                        Variant / Option
                      </label>
                      <select
                        required
                        disabled={!p}
                        value={it.variantId}
                        onChange={(e) => onItemVariant(i, e.target.value)}
                        className={inputClass}
                      >
                        <option value="">{p ? 'Select variant…' : '—'}</option>
                        {(p?.variants || []).map((v, vi) => (
                          <option key={v._id} value={v._id}>
                            {v.color || `Option ${vi + 1}`}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Size / Option Selector */}
                    <div>
                      <label className="block text-[10px] font-bold text-[#64748B] uppercase mb-1">
                        {p ? optLabel(p) : 'Size / Pack'}
                      </label>
                      <select
                        required
                        disabled={!variant}
                        value={it.size}
                        onChange={(e) => setItem(i, { size: e.target.value })}
                        className={inputClass}
                      >
                        <option value="">{variant ? 'Select size…' : '—'}</option>
                        {(variant?.sizes || []).map((s) => (
                          <option key={s.size} value={s.size}>
                            {s.size} ({s.stock ?? 0} in stock)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Product Specification & Stock Pill Card */}
                  {p && (
                    <div className="pt-2 border-t border-[#EAE7DC] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        {image && (
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-white border border-[#E7E2D6] shrink-0">
                            <img src={image} alt={p.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-[#0F172A]">{p.name}</div>
                          <div className="text-[11px] text-[#64748B] flex items-center gap-2">
                            {p.brand && <span>Brand: {p.brand}</span>}
                            {p.sku && <span>SKU: {p.sku}</span>}
                            <span className="font-semibold text-emerald-700">
                              Unit Price: ₹{sellingPrice}
                            </span>
                            {actualPrice > sellingPrice && (
                              <span className="line-through text-neutral-400">₹{actualPrice}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quantity & Stock Check */}
                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        <label className="inline-flex items-center gap-1.5 font-bold text-[#0F172A]">
                          <span>Qty:</span>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={it.qty}
                            onChange={(e) => setItem(i, { qty: e.target.value })}
                            className="w-14 px-2 py-1 text-xs rounded-lg border border-[#D6D6D6] text-center"
                          />
                        </label>

                        {stock !== null && (
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              stock >= qty
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {stock >= qty
                              ? `${stock} in stock (${Math.floor(stock / qty)} combos)`
                              : `Out of Stock (${stock} avail)`}
                          </span>
                        )}

                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeAt(setItems)(i)}
                            className="p-1 text-neutral-400 hover:text-red-600 rounded-lg"
                            title="Remove product"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bundle Inventory Status Card */}
          {sellableStock !== null && (
            <div
              className={`p-4 rounded-2xl border text-xs flex items-center justify-between ${
                sellableStock > 0
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {sellableStock > 0 ? (
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle size={16} className="text-rose-600 shrink-0" />
                )}
                <span>
                  {sellableStock > 0
                    ? `Live Available Combos: ${sellableStock} units (Limited by: ${limitingProduct})`
                    : `Unavailable: One or more products in this combo are currently out of stock.`}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Pricing & Savings Calculations */}
      {isMulti && (
        <div className="bg-white p-5 rounded-3xl border border-[#E7E2D6] shadow-xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
            4. Pricing & Discount Rules
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">
                Discount Mode
              </label>
              <select
                value={form.discountType}
                onChange={(e) => upd('discountType', e.target.value)}
                className={inputClass}
              >
                <option value="fixed">Fixed Price / Savings (₹)</option>
                <option value="percentage">Percentage Discount (%)</option>
              </select>
            </div>

            {form.discountType === 'percentage' ? (
              <div>
                <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">
                  Discount Percentage (%)
                </label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  placeholder="e.g. 20"
                  value={form.discountValue}
                  onChange={(e) => upd('discountValue', e.target.value)}
                  className={inputClass}
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">
                  Combo Selling Price (₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="e.g. 1499"
                  value={form.comboPrice}
                  onChange={(e) => {
                    upd('comboPrice', e.target.value);
                    upd('discountValue', '');
                  }}
                  className={inputClass}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">
                Original Items Total
              </label>
              <div className="px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] border border-[#E7E2D6] font-bold text-sm text-[#0F172A]">
                ₹{itemsTotal}
              </div>
            </div>
          </div>

          {/* Real-time Savings Breakdown Banner */}
          {itemsTotal > 0 && (
            <div className="p-4 rounded-2xl bg-[#FAF7EE] border border-[#E7E2D6] grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div>
                <div className="text-[10px] uppercase font-bold text-[#64748B]">Individual Items Total</div>
                <div className="text-sm font-bold text-[#0F172A]">₹{itemsTotal}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-[#64748B]">Combo Price</div>
                <div className="text-sm font-extrabold text-[#C9A227]">
                  ₹{calculatedComboPrice}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-[#64748B]">Customer Savings</div>
                <div className="text-sm font-bold text-emerald-700">₹{savingsAmount}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-[#64748B]">Discount Rate</div>
                <div className="text-sm font-extrabold text-emerald-700">
                  {savingsPercentage}% OFF
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Multipack Options for Single-Product Pack */}
      {!isMulti && (
        <div className="bg-white p-5 rounded-3xl border border-[#E7E2D6] shadow-xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
            3. Base Product & Multipack Options
          </h2>

          <div>
            <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">
              Select Base Catalog Product *
            </label>
            <select
              required
              value={form.baseProduct}
              onChange={(e) => onBaseChange(e.target.value)}
              className={inputClass}
            >
              <option value="">Select product…</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.category?.name || 'General'})
                </option>
              ))}
            </select>
          </div>

          {/* Pack Options */}
          <div className="pt-2 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                Pack Quantity Tiers (e.g. 2-Pack, 3-Pack, 5-Pack)
              </label>
              <button
                type="button"
                onClick={() => setPacks((l) => [...l, emptyPack()])}
                className="text-xs font-bold text-[#C9A227] hover:underline"
              >
                + Add Pack Tier
              </button>
            </div>

            {packs.map((p, i) => (
              <div
                key={i}
                className="p-3.5 rounded-2xl border border-[#E7E2D6] bg-[#FCFBF8] grid grid-cols-2 sm:grid-cols-4 gap-3 items-center"
              >
                <div>
                  <label className="block text-[10px] font-bold text-[#64748B] uppercase mb-0.5">
                    Pieces in Pack
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 3"
                    value={p.size}
                    onChange={(e) => setPack(i, { size: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#64748B] uppercase mb-0.5">
                    Pack Selling Price (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="₹"
                    value={p.price}
                    onChange={(e) => setPack(i, { price: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#64748B] uppercase mb-0.5">
                    Original Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="₹"
                    value={p.originalPrice}
                    onChange={(e) => setPack(i, { originalPrice: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-[#64748B] uppercase mb-0.5">
                      Packs in Stock
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Unlimited"
                      value={p.stock}
                      onChange={(e) => setPack(i, { stock: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  {packs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeAt(setPacks)(i)}
                      className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg mt-4"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 py-3.5 rounded-2xl text-xs font-bold bg-[#0F172A] text-white hover:bg-neutral-800 shadow-sm transition-all disabled:opacity-50"
        >
          {saving ? 'Saving Combo Offer…' : isEdit ? 'Save Changes' : 'Create & Publish Combo'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3.5 rounded-2xl text-xs font-bold border border-[#D6D6D6] text-[#64748B] hover:text-[#0F172A]"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

// Image Uploader Helper
function ImageUploader({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const urls = value || [];

  async function onFiles(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    setUploading(true);
    setUploadError('');
    const uploaded = [];
    for (const file of files) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'combos');
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');
        uploaded.push(data.url);
      } catch (err) {
        setUploadError(`${file.name}: ${err.message}`);
      }
    }
    if (uploaded.length) onChange([...urls, ...uploaded]);
    setUploading(false);
  }

  return (
    <div>
      {urls.length > 0 && (
        <div className="flex flex-wrap gap-2.5 mb-3">
          {urls.map((url, i) => (
            <div
              key={url + i}
              className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#E7E2D6] shadow-xs group"
            >
              <img src={url} alt="Combo preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => onChange(urls.filter((_, idx) => idx !== i))}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/75 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
              {i === 0 && (
                <span className="absolute bottom-0 inset-x-0 bg-[#C9A227] text-black text-[9px] font-bold text-center py-0.5">
                  Cover
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border border-[#D6D6D6] hover:border-black cursor-pointer bg-white transition-colors">
        <Upload size={14} />
        <span>{uploading ? 'Uploading…' : 'Upload Images'}</span>
        <input type="file" accept="image/*" multiple onChange={onFiles} disabled={uploading} className="hidden" />
      </label>

      {uploadError && <p className="text-xs text-red-600 mt-1">{uploadError}</p>}
    </div>
  );
}
