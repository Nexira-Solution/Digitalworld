'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { X, UploadCloud, Loader2, Plus, Upload, ArrowLeft } from 'lucide-react';
import { getType } from '@/lib/productTypes';
import ProductTypeFields from '@/components/ProductTypeFields';

const inputCls = 'w-full px-3 py-2 text-sm rounded-lg border border-[#E8E8E8] bg-white outline-none focus:border-[#0F172A]';

export default function SellerBulkAddProductsPage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('');
  const [categorySizes, setCategorySizes] = useState([]);

  const [skuPrefix, setSkuPrefix] = useState('');
  const [description, setDescription] = useState('');
  const [fabric, setFabric] = useState('');
  const [price, setPrice] = useState('');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [stockBySize, setStockBySize] = useState({});

  const [isReadyToShip, setIsReadyToShip] = useState(false);

  const [sleeveOptions, setSleeveOptions] = useState([]);
  const [zipOptions, setZipOptions] = useState([]);
  const [sizeChart, setSizeChart] = useState([]);
  const [sizeChartUploading, setSizeChartUploading] = useState(false);

  const [attributes, setAttributes] = useState({});
  const [specs, setSpecs] = useState([]);

  const [manualSizeName, setManualSizeName] = useState('');
  const [manualSizeStock, setManualSizeStock] = useState('');
  const [manualSizes, setManualSizes] = useState([]);
  const [singleStock, setSingleStock] = useState('');

  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || d.topLevel || []))
      .catch(() => toast.error('Failed to load categories'));
  }, []);

  function categoryLabel(c) {
    const parent = c.parent ? categories.find((p) => p._id === String(c.parent)) : null;
    return parent ? `${parent.name} — ${c.name}` : c.name;
  }

  const selectedCategory = categories.find((c) => c._id === category);
  const typeKey = selectedCategory ? (selectedCategory.productType || 'apparel') : null;
  const type = getType(typeKey);

  const titlePreview = (selectedCategory?.name || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '') || 'CATEGORY';

  useEffect(() => {
    const cat = categories.find((c) => c._id === category);
    const sizes = cat?.sizes || [];
    setCategorySizes(sizes);
    setStockBySize(Object.fromEntries(sizes.map((s) => [s, ''])));
    setManualSizes([]);
    setManualSizeName('');
    setManualSizeStock('');
    setSingleStock('');
  }, [category, categories]);

  useEffect(() => {
    setAttributes({});
    setSpecs([]);
    setFabric('');
    setSleeveOptions([]);
    setZipOptions([]);
    setSizeChart([]);
  }, [typeKey]);

  const noSizeMode = !!category && categorySizes.length === 0 && !!type.defaultSize;

  function toggleSleeveOption(opt) {
    setSleeveOptions((prev) => (prev.includes(opt) ? prev.filter((o) => o !== opt) : [...prev, opt]));
  }

  function toggleZipOption(opt) {
    setZipOptions((prev) => (prev.includes(opt) ? prev.filter((o) => o !== opt) : [...prev, opt]));
  }

  function handleFilesChange(e) {
    const selected = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selected]);
    setPreviews((prev) => [...prev, ...selected.map((f) => URL.createObjectURL(f))]);
    e.target.value = '';
  }

  function removeImage(idx) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  }

  function addManualSize() {
    const name = manualSizeName.trim().toUpperCase();
    if (!name) return toast.error('Enter a size name (e.g. S, M, Free Size)');
    if (manualSizes.some((s) => s.size === name)) return toast.error('That size is already added');
    setManualSizes((prev) => [...prev, { size: name, stock: manualSizeStock || '0' }]);
    setManualSizeName('');
    setManualSizeStock('');
  }

  function removeManualSize(name) {
    setManualSizes((prev) => prev.filter((s) => s.size !== name));
  }

  async function uploadImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    if (!res.ok) throw new Error(`Failed to upload ${file.name}`);
    const data = await res.json();
    return data.url;
  }

  async function handleSizeChartFilesChange(e) {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;

    setSizeChartUploading(true);
    try {
      const uploaded = [];
      for (const file of selected) {
        const url = await uploadImage(file);
        uploaded.push(url);
      }
      setSizeChart((prev) => [...prev, ...uploaded]);
      toast.success(`${uploaded.length} size chart image${uploaded.length > 1 ? 's' : ''} uploaded`);
    } catch (err) {
      toast.error(err.message || 'Failed to upload size chart');
    } finally {
      setSizeChartUploading(false);
      e.target.value = '';
    }
  }

  function removeSizeChartImage(idx) {
    setSizeChart((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setResult(null);

    if (!category) return toast.error('Select a category');
    if (!skuPrefix.trim()) return toast.error('Enter a SKU code (e.g. MT)');
    if (!price || Number(price) <= 0) return toast.error('Enter a valid price');
    if (files.length === 0) return toast.error('Add at least one image');

    let sizes;
    if (noSizeMode) {
      if (singleStock === '') return toast.error('Enter the stock for each product');
      sizes = [{ size: type.defaultSize, stock: Number(singleStock) || 0 }];
    } else {
      const fromPredefined = Object.entries(stockBySize)
        .filter(([, stock]) => stock !== '')
        .map(([size, stock]) => ({ size, stock: Number(stock) }));
      const fromManual = manualSizes.map((s) => ({ size: s.size, stock: Number(s.stock) || 0 }));
      sizes = [...fromPredefined, ...fromManual];

      if (sizes.length === 0) {
        if (categorySizes.length === 0) {
          return toast.error('This category has no sizes configured — add a size manually below, or set sizes on the category first.');
        }
        return toast.error('Enter stock for at least one size');
      }
    }

    setSubmitting(true);
    try {
      const imageUrls = [];
      for (const file of files) {
        const url = await uploadImage(file);
        imageUrls.push(url);
      }

      const res = await fetch('/api/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          skuPrefix,
          description,
          fabric,
          price: Number(price),
          compareAtPrice: Number(compareAtPrice) || 0,
          sizes,
          images: imageUrls,
          isReadyToShip,
          sizeChart,
          sleeveOptions,
          zipOptions,
          attributes,
          specs,
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error(`Server returned an unexpected response (status ${res.status})`);
      }

      if (!res.ok) throw new Error(data.error || `Bulk upload failed (status ${res.status})`);

      setResult(data);
      if (data.createdCount > 0) {
        toast.success(`${data.createdCount} product${data.createdCount > 1 ? 's' : ''} created`);
      }
      if (data.errors?.length) {
        toast.error(`${data.errors.length} item(s) skipped — see details below`);
      }
    } catch (err) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#E8E8E8]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0F172A] uppercase">
            Bulk Add Products
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Create multiple products in batch using category presets and image uploads.
          </p>
        </div>
        <Link
          href="/seller/products"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-[#E8E8E8] bg-white text-[#0F172A] hover:bg-neutral-50 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Products</span>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 bg-white p-6 rounded-2xl border border-[#E8E8E8]">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-1.5">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputCls}
              required
            >
              <option value="">Select category...</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>{categoryLabel(c)}</option>
              ))}
            </select>
            {category && (
              <p className="text-xs text-[#64748B] mt-1">
                Product type: {type.label}. Titles auto-generate as {titlePreview}001, {titlePreview}002...
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-1.5">SKU Prefix</label>
            <input
              value={skuPrefix}
              onChange={(e) => setSkuPrefix(e.target.value)}
              placeholder="e.g. MT"
              className={inputCls}
              required
            />
            <p className="text-xs text-[#64748B] mt-1">
              SKUs auto-generate as {skuPrefix ? skuPrefix.toUpperCase() : 'MT'}001, {skuPrefix ? skuPrefix.toUpperCase() : 'MT'}002...
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-1.5">Price (₹)</label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className={inputCls} required />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-1.5">Compare-at price (optional)</label>
            <input type="number" value={compareAtPrice} onChange={(e) => setCompareAtPrice(e.target.value)} className={inputCls} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-1.5">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputCls} />
        </div>

        {category && type.showFabric && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-1.5">Fabric</label>
            <input value={fabric} onChange={(e) => setFabric(e.target.value)} className={inputCls} />
          </div>
        )}

        {category && (
          <ProductTypeFields
            type={type}
            attributes={attributes}
            specs={specs}
            onAttr={(k, v) => setAttributes((prev) => ({ ...prev, [k]: v }))}
            onSpecs={setSpecs}
            inputClassName={inputCls}
            labelClassName="block text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-1.5"
          />
        )}

        {category && type.showSleeveZip && (
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-2">Sleeve Type Options (optional)</label>
              <div className="flex flex-wrap gap-3">
                {['Full Sleeve', 'Half Sleeve', 'Elbow Sleeve', 'Sleeveless'].map((opt) => (
                  <label key={opt} className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input type="checkbox" checked={sleeveOptions.includes(opt)} onChange={() => toggleSleeveOption(opt)} className="w-4 h-4 rounded" />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-2">Zip Type Options (optional)</label>
              <div className="flex flex-wrap gap-3">
                {['With Zip', 'Without Zip'].map((opt) => (
                  <label key={opt} className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input type="checkbox" checked={zipOptions.includes(opt)} onChange={() => toggleZipOption(opt)} className="w-4 h-4 rounded" />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {category && type.showSizeChart && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-1.5">
              Size chart images (optional)
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {sizeChart.map((url, idx) => (
                <div key={idx} className="relative aspect-square rounded-md overflow-hidden bg-neutral-100 border border-[#E8E8E8]">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeSizeChartImage(idx)}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                disabled={sizeChartUploading}
                onClick={() => document.getElementById('seller-bulk-size-chart-input')?.click()}
                className="aspect-square rounded-md border-2 border-dashed border-[#E8E8E8] flex flex-col items-center justify-center gap-1 text-[#64748B] hover:border-black disabled:opacity-50"
              >
                {sizeChartUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                <span className="text-[10px]">{sizeChartUploading ? 'Uploading…' : 'Add'}</span>
              </button>
            </div>
            <input
              id="seller-bulk-size-chart-input"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleSizeChartFilesChange}
            />
          </div>
        )}

        <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer w-fit text-[#0F172A]">
          <input
            type="checkbox"
            checked={isReadyToShip}
            onChange={(e) => setIsReadyToShip(e.target.checked)}
            className="w-4 h-4 rounded"
          />
          Mark all products in this batch as "Ready to Ship"
        </label>

        {categorySizes.length > 0 && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-2">
              Stock per {type.defaultSize ? 'option' : 'size'} (applies to every product)
            </label>
            <div className="flex flex-wrap gap-3">
              {categorySizes.map((size) => (
                <div key={size} className="flex items-center gap-2">
                  <span className="text-xs font-semibold min-w-8">{size}</span>
                  <input
                    type="number"
                    min="0"
                    value={stockBySize[size] ?? ''}
                    onChange={(e) => setStockBySize((prev) => ({ ...prev, [size]: e.target.value }))}
                    placeholder="0"
                    className="w-20 px-2.5 py-1.5 text-xs rounded-lg border border-[#E8E8E8] outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {noSizeMode && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-1.5">Stock per product</label>
            <input
              type="number"
              min="0"
              value={singleStock}
              onChange={(e) => setSingleStock(e.target.value)}
              placeholder="0"
              className="w-32 px-3 py-2 text-sm rounded-lg border border-[#E8E8E8] outline-none"
            />
          </div>
        )}

        {category && categorySizes.length === 0 && !noSizeMode && (
          <div className="border border-[#C9A227]/40 bg-[#FAF7EE] rounded-xl p-4">
            <p className="text-xs font-bold text-[#0F172A] mb-1">No sizes configured for this category</p>
            <p className="text-xs text-[#64748B] mb-3">
              Add custom sizes here for this batch.
            </p>

            <div className="flex flex-wrap items-end gap-2 mb-3">
              <div>
                <label className="block text-[11px] text-[#64748B] mb-1">Size</label>
                <input
                  value={manualSizeName}
                  onChange={(e) => setManualSizeName(e.target.value)}
                  placeholder="e.g. S, Free Size"
                  className="w-32 px-2.5 py-1.5 text-xs rounded-lg border border-[#E8E8E8] outline-none bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#64748B] mb-1">Stock</label>
                <input
                  type="number"
                  min="0"
                  value={manualSizeStock}
                  onChange={(e) => setManualSizeStock(e.target.value)}
                  placeholder="0"
                  className="w-24 px-2.5 py-1.5 text-xs rounded-lg border border-[#E8E8E8] outline-none bg-white"
                />
              </div>
              <button
                type="button"
                onClick={addManualSize}
                className="flex items-center gap-1 text-xs font-semibold border border-[#0F172A] bg-white rounded-lg px-3 py-1.5 hover:bg-neutral-50 transition-colors"
              >
                <Plus size={14} /> Add Size
              </button>
            </div>

            {manualSizes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {manualSizes.map((s) => (
                  <span
                    key={s.size}
                    className="flex items-center gap-1.5 text-xs bg-white border border-[#E8E8E8] rounded-full px-2.5 py-1 font-semibold text-[#0F172A]"
                  >
                    {s.size}: {s.stock}
                    <button type="button" onClick={() => removeManualSize(s.size)}>
                      <X size={12} className="text-rose-500" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-2">
            Upload Images ({files.length} selected — 1 product created per image)
          </label>
          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#E8E8E8] rounded-xl py-8 cursor-pointer text-[#64748B] hover:border-[#0F172A] transition-colors bg-[#FAF9F5]">
            <UploadCloud size={24} className="text-[#0F172A]" />
            <span className="text-xs font-semibold text-[#0F172A]">Click or drop product images to upload</span>
            <span className="text-[11px] text-[#64748B]">JPEG, PNG, WEBP</span>
            <input type="file" accept="image/*" multiple onChange={handleFilesChange} className="hidden" />
          </label>

          {previews.length > 0 && (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mt-4">
              {previews.map((src, idx) => (
                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-neutral-100 border border-[#E8E8E8]">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center text-white"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wide bg-[#0F172A] text-white hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm"
        >
          {submitting && <Loader2 size={16} className="animate-spin text-[#C9A227]" />}
          <span>{submitting ? 'Creating products...' : `Create ${files.length || ''} Product${files.length === 1 ? '' : 's'}`}</span>
        </button>
      </form>

      {result && (
        <div className="mt-6 p-5 rounded-2xl border border-[#E8E8E8] bg-white text-xs space-y-3">
          <p className="font-bold text-sm text-emerald-700">✓ {result.createdCount} product(s) created successfully!</p>
          {result.errors?.length > 0 && (
            <div className="text-rose-600">
              <p className="font-semibold mb-1">Skipped:</p>
              <ul className="list-disc pl-5 space-y-0.5">
                {result.errors.map((e, i) => (
                  <li key={i}>{e.name}: {e.error}</li>
                ))}
              </ul>
            </div>
          )}
          <Link
            href="/seller/products"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#0F172A] text-white hover:bg-neutral-800"
          >
            Go to product list →
          </Link>
        </div>
      )}
    </div>
  );
}
