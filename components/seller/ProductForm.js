'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getType } from '@/lib/productTypes';
import ProductTypeFields from '@/components/ProductTypeFields';

const INK = '#000000';
const INK_SOFT = '#6B6B6B';
const LINE = '#E8E8E8';
const PAPER = '#FFFFFF';
const RED = '#B3261E';

const SLEEVE_OPTIONS = ['Full Sleeve', 'Half Sleeve', 'Elbow Sleeve', 'Sleeveless'];
const ZIP_OPTIONS = ['With Zip', 'Without Zip'];

function emptyVariant() {
  return { color: '', colorHex: '#000000', price: '', compareAtPrice: '', images: '', sizes: [{ size: '', stock: '', price: '', compareAtPrice: '' }] };
}
function emptyAddon() {
  return { name: '', image: '', price: '', stock: '', sku: '' };
}

const fieldInput = 'w-full px-3 py-2.5 text-sm outline-none';
const fieldInputStyle = { border: `1px solid ${LINE}`, color: INK };

export default function ProductForm({ productId, initialProduct }) {
  const router = useRouter();
  const isEdit = !!productId;

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    category: '',
    description: '',
    fabric: '',
    tags: '',
    isBestSeller: false,
    offers: '',
    trustBadgesText: '',
    isReadyToShip: false,
    sizeChart: '',
    sleeveOptions: [],
    zipOptions: [],
    attributes: {},   // brand, warranty, FSSAI, ingredients, ...
    specs: [],        // [{ key, value }] e.g. Nutrition
  });
  const [variants, setVariants] = useState([emptyVariant()]);
  const [pantOptions, setPantOptions] = useState([]);
  const [shawlOptions, setShawlOptions] = useState([]);

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => setCategories(d.topLevel || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!initialProduct) {
      setLoading(false);
      return;
    }
    const p = initialProduct;
    setForm({
      name: p.name || '',
      category: p.category?._id || p.category || '',
      description: p.description || '',
      fabric: p.fabric || '',
      tags: (p.tags || []).join(', '),
      isBestSeller: Boolean(p.isBestSeller),
      offers: Array.isArray(p.offers) ? p.offers.join(', ') : p.offers || '',
      trustBadgesText: Array.isArray(p.trustBadges) ? p.trustBadges.map((b) => b.title).join(', ') : '',
      isReadyToShip: !!p.isReadyToShip,
      sizeChart: (p.sizeChart || []).join(', '),
      sleeveOptions: p.sleeveOptions || [],
      zipOptions: p.zipOptions || [],
      attributes: { ...(p.attributes || {}) },
      specs: (p.specs || []).map((s) => ({ key: s.key || '', value: s.value || '' })),
    });
    setVariants(
      (p.variants || []).length
        ? p.variants.map((v) => ({
            _id: v._id,
            color: v.color || '',
            colorHex: v.colorHex || '#000000',
            price: v.price ?? '',
            compareAtPrice: v.compareAtPrice ?? '',
            images: (v.images || []).join(', '),
            sizes: (v.sizes || []).map((s) => ({
              size: s.size || '',
              stock: s.stock ?? '',
              price: s.price ?? '',
              compareAtPrice: s.compareAtPrice ?? '',
            })),
          }))
        : [emptyVariant()]
    );
    setPantOptions(
      (p.pantOptions || []).map((o) => ({
        _id: o._id, name: o.name || '', image: o.image || '', price: o.price ?? '', stock: o.stock ?? '', sku: o.sku || '',
      }))
    );
    setShawlOptions(
      (p.shawlOptions || []).map((o) => ({
        _id: o._id, name: o.name || '', image: o.image || '', price: o.price ?? '', stock: o.stock ?? '', sku: o.sku || '',
      }))
    );
    setLoading(false);
  }, [initialProduct]);

  function updateField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  function toggleListValue(key, value) {
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value],
    }));
  }

  function updateVariant(i, key, value) {
    setVariants((vs) => vs.map((v, idx) => (idx === i ? { ...v, [key]: value } : v)));
  }
  function addVariant() {
    setVariants((vs) => [...vs, { ...emptyVariant(), sizes: [{ size: type.defaultSize, stock: '' }] }]);
  }
  function removeVariant(i) {
    setVariants((vs) => vs.filter((_, idx) => idx !== i));
  }

  function updateSize(vi, si, key, value) {
    setVariants((vs) =>
      vs.map((v, idx) =>
        idx === vi ? { ...v, sizes: v.sizes.map((s, sidx) => (sidx === si ? { ...s, [key]: value } : s)) } : v
      )
    );
  }
  function addSize(vi) {
    setVariants((vs) =>
      vs.map((v, idx) =>
        idx === vi
          ? {
              ...v,
              sizes: [
                ...v.sizes,
                { size: '', stock: '', price: v.price || '', compareAtPrice: v.compareAtPrice || '' },
              ],
            }
          : v
      )
    );
  }
  function removeSize(vi, si) {
    setVariants((vs) =>
      vs.map((v, idx) => (idx === vi ? { ...v, sizes: v.sizes.filter((_, sidx) => sidx !== si) } : v))
    );
  }

  function updateAddon(setter, i, key, value) {
    setter((list) => list.map((o, idx) => (idx === i ? { ...o, [key]: value } : o)));
  }
  function addAddon(setter) {
    setter((list) => [...list, emptyAddon()]);
  }
  function removeAddon(setter, i) {
    setter((list) => list.filter((_, idx) => idx !== i));
  }

  // Flat list for the <select>. Each entry carries its product type; a
  // subcategory falls back to its parent's type.
  function flattenCategoryOptions() {
    const opts = [];
    for (const cat of categories) {
      opts.push({ id: cat._id, label: cat.name, productType: cat.productType || 'apparel' });
      for (const sub of cat.subcategories || []) {
        opts.push({
          id: sub._id,
          label: `${cat.name} — ${sub.name}`,
          productType: sub.productType || cat.productType || 'apparel',
        });
      }
    }
    return opts;
  }

  const categoryOptions = flattenCategoryOptions();
  const selectedCategory = categoryOptions.find((c) => c.id === form.category);
  const ready = !!selectedCategory; // type-specific sections appear once a category is chosen
  const typeKey = selectedCategory ? selectedCategory.productType : null;
  const type = getType(typeKey);

  function handleCategoryChange(id) {
    const next = categoryOptions.find((c) => c.id === id);
    const nextKey = next ? next.productType : null;
    const nextType = getType(nextKey);
    const typeChanged = typeKey !== null && nextKey !== null && typeKey !== nextKey;

    setForm((f) => ({
      ...f,
      category: id,
      ...(typeChanged
        ? { attributes: {}, specs: [], fabric: '', sleeveOptions: [], zipOptions: [], sizeChart: '' }
        : {}),
    }));
    if (typeChanged) {
      setPantOptions([]);
      setShawlOptions([]);
    }
    // pre-fill "Standard" for blank size rows on non-apparel types
    setVariants((vs) =>
      vs.map((v) => ({ ...v, sizes: v.sizes.map((s) => (s.size ? s : { ...s, size: nextType.defaultSize })) }))
    );
  }

  function buildPayload() {
    const cleanVariants = variants.map((v) => ({
      ...(v._id ? { _id: v._id } : {}),
      color: v.color,
      colorHex: v.colorHex,
      price: Number(v.price) || 0,
      compareAtPrice: Number(v.compareAtPrice) || 0,
      images: v.images.split(',').map((s) => s.trim()).filter(Boolean),
      sizes: v.sizes
        .filter((s) => s.size)
        .map((s) => {
          const sPrice = s.price !== undefined && s.price !== '' ? Number(s.price) : Number(v.price) || 0;
          const sCompare = s.compareAtPrice !== undefined && s.compareAtPrice !== '' ? Number(s.compareAtPrice) : Number(v.compareAtPrice) || 0;
          const sDiscount = sCompare > sPrice ? Math.round(((sCompare - sPrice) / sCompare) * 100) : 0;
          return {
            size: s.size,
            stock: Number(s.stock) || 0,
            price: sPrice,
            compareAtPrice: sCompare,
            discountPercentage: sDiscount,
          };
        }),
    }));

    const cleanAddons = (list) =>
      list
        .filter((o) => o.name)
        .map((o) => ({
          ...(o._id ? { _id: o._id } : {}),
          name: o.name,
          image: o.image,
          price: Number(o.price) || 0,
          stock: Number(o.stock) || 0,
          sku: o.sku,
        }));

    return {
      name: form.name,
      category: form.category,
      description: form.description,
      fabric: form.fabric,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      isBestSeller: Boolean(form.isBestSeller),
      offers: form.offers.split(',').map((s) => s.trim()).filter(Boolean),
      trustBadges: form.trustBadgesText
        ? form.trustBadgesText
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
            .map((t, idx) => {
              const icons = ['Leaf', 'FlaskConical', 'ShieldCheck', 'Award', 'HandPlatter'];
              return { title: t, subtitle: 'Certified', icon: icons[idx % icons.length] };
            })
        : [],
      isReadyToShip: form.isReadyToShip,
      sizeChart: form.sizeChart.split(',').map((s) => s.trim()).filter(Boolean),
      sleeveOptions: form.sleeveOptions,
      zipOptions: form.zipOptions,
      attributes: form.attributes,
      specs: form.specs,
      variants: cleanVariants,
      pantOptions: cleanAddons(pantOptions),
      shawlOptions: cleanAddons(shawlOptions),
    };
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.name.trim() || !form.category) {
      setError('Product name and category are required.');
      return;
    }
    if (!variants.length || variants.every((v) => !v.price)) {
      setError('At least one variant with a price is required.');
      return;
    }

    setSaving(true);
    const payload = buildPayload();

    try {
      const res = await fetch(isEdit ? `/api/products/${productId}` : '/api/products', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to save product.');
        setSaving(false);
        return;
      }

      router.push('/seller/products');
    } catch {
      setError('Something went wrong. Please try again.');
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="text-[13px]" style={{ color: INK_SOFT }}>Loading...</div>;
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-8 max-w-3xl">
      {error && (
        <div className="px-4 py-3 text-[13px]" style={{ background: '#FCE8E6', color: RED }}>
          {error}
        </div>
      )}

      {/* Basic info */}
      <Section title="Basic Details">
        <Field label="Product Name">
          <input
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            className={fieldInput}
            style={fieldInputStyle}
            required
          />
        </Field>

        <Field label="Category">
          <select
            value={form.category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className={fieldInput}
            style={fieldInputStyle}
            required
          >
            <option value="">Select a category</option>
            {categoryOptions.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
          <p className="text-[11px] mt-1" style={{ color: INK_SOFT }}>
            {ready
              ? `Product type: ${type.label}`
              : 'Pick a category — the fields below adapt to the kind of product.'}
          </p>
        </Field>

        <Field label="Description">
          <textarea
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            rows={4}
            className={fieldInput}
            style={fieldInputStyle}
          />
        </Field>

        {ready && type.showFabric && (
          <Field label="Fabric">
            <input
              value={form.fabric}
              onChange={(e) => updateField('fabric', e.target.value)}
              className={fieldInput}
              style={fieldInputStyle}
              placeholder="e.g. Pure Cotton"
            />
          </Field>
        )}

        <Field label="Tags (comma separated)">
          <input
            value={form.tags}
            onChange={(e) => updateField('tags', e.target.value)}
            className={fieldInput}
            style={fieldInputStyle}
            placeholder="e.g. festive, cotton, casual"
          />
        </Field>

        {/* Type-specific fields: brand / warranty / FSSAI / specs ... */}
        {ready && (
          <div className="mb-3">
            <ProductTypeFields
              type={type}
              attributes={form.attributes}
              specs={form.specs}
              onAttr={(k, v) => updateField('attributes', { ...form.attributes, [k]: v })}
              onSpecs={(s) => updateField('specs', s)}
              inputClassName={fieldInput}
              inputStyle={fieldInputStyle}
              labelClassName="block text-[11px] tracking-[1px] uppercase mb-1"
              labelStyle={{ color: INK_SOFT }}
            />
          </div>
        )}

        {ready && type.showSizeChart && (
          <Field label="Size Chart Images (optional)">
            <ImageUploader
              value={form.sizeChart}
              onChange={(val) => updateField('sizeChart', val)}
              folder="size-charts"
            />
            <p className="text-[11px] mt-1" style={{ color: INK_SOFT }}>
              Leave blank to fall back to the category&apos;s own size chart.
            </p>
          </Field>
        )}

        {/* Best Seller & Ready to Ship Toggles */}
        <div className="flex flex-wrap gap-6 pt-2">
          <label className="flex items-center gap-2 text-[13px] font-medium" style={{ color: INK }}>
            <input
              type="checkbox"
              checked={form.isBestSeller}
              onChange={(e) => updateField('isBestSeller', e.target.checked)}
            />
            👑 Mark as Best Seller
          </label>

          <label className="flex items-center gap-2 text-[13px] font-medium" style={{ color: INK }}>
            <input
              type="checkbox"
              checked={form.isReadyToShip}
              onChange={(e) => updateField('isReadyToShip', e.target.checked)}
            />
            Ready to Ship
          </label>
        </div>

        {/* Promotional Offers */}
        <Field label="Special Offers & Benefits (comma separated)">
          <input
            value={form.offers}
            onChange={(e) => updateField('offers', e.target.value)}
            className={fieldInput}
            style={fieldInputStyle}
            placeholder="e.g. 40% Instant Discount, Extra 10% off on Prepaid, Free Delivery above ₹499"
          />
          <p className="text-[11px] mt-1" style={{ color: INK_SOFT }}>
            These highlights appear as bullet points under Offers & Benefits on the product page.
          </p>
        </Field>

        {/* Product Trust Strip Badges */}
        <Field label="Trust Strip Highlights (optional, comma separated)">
          <input
            value={form.trustBadgesText}
            onChange={(e) => updateField('trustBadgesText', e.target.value)}
            className={fieldInput}
            style={fieldInputStyle}
            placeholder="e.g. 100% Natural, Hygienically Prepared, Premium Quality, Authentic Recipe, Freshly Packed"
          />
          <p className="text-[11px] mt-1" style={{ color: INK_SOFT }}>
            Custom badges displayed in the trust strip below the product. Leave blank to use category defaults.
          </p>
        </Field>
      </Section>

      {/* Sleeve / Zip options — apparel only */}
      {ready && type.showSleeveZip && (
        <Section title="Sleeve & Zip Options (optional)">
          <p className="text-[11px] mb-2" style={{ color: INK_SOFT }}>
            If any are selected, the customer must choose one before adding to cart.
          </p>
          <div className="flex flex-wrap gap-4 mb-4">
            {SLEEVE_OPTIONS.map((opt) => (
              <label key={opt} className="flex items-center gap-1.5 text-[13px]" style={{ color: INK }}>
                <input
                  type="checkbox"
                  checked={form.sleeveOptions.includes(opt)}
                  onChange={() => toggleListValue('sleeveOptions', opt)}
                />
                {opt}
              </label>
            ))}
          </div>
          <div className="flex flex-wrap gap-4">
            {ZIP_OPTIONS.map((opt) => (
              <label key={opt} className="flex items-center gap-1.5 text-[13px]" style={{ color: INK }}>
                <input
                  type="checkbox"
                  checked={form.zipOptions.includes(opt)}
                  onChange={() => toggleListValue('zipOptions', opt)}
                />
                {opt}
              </label>
            ))}
          </div>
        </Section>
      )}

      {/* Variants */}
      {ready && (
        <Section title={type.hasColor ? 'Variants (color, price, sizes)' : 'Pricing & Stock'}>
          {variants.map((v, vi) => (
            <div key={vi} className="p-4 mb-4" style={{ border: `1px solid ${LINE}` }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] tracking-wide uppercase" style={{ color: INK_SOFT }}>
                  Variant {vi + 1}
                </span>
                {variants.length > 1 && (
                  <button type="button" onClick={() => removeVariant(vi)} style={{ color: RED }} className="text-[12px]">
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                {type.hasColor && (
                  <>
                    <Field label="Color Name">
                      <input
                        value={v.color}
                        onChange={(e) => updateVariant(vi, 'color', e.target.value)}
                        className="w-full px-3 py-2 text-sm outline-none"
                        style={fieldInputStyle}
                      />
                    </Field>
                    <Field label="Color Swatch">
                      <input
                        type="color"
                        value={v.colorHex}
                        onChange={(e) => updateVariant(vi, 'colorHex', e.target.value)}
                        className="w-full h-[38px]"
                        style={{ border: `1px solid ${LINE}` }}
                      />
                    </Field>
                  </>
                )}
                <Field label="Price (₹)">
                  <input
                    type="number"
                    value={v.price}
                    onChange={(e) => updateVariant(vi, 'price', e.target.value)}
                    className="w-full px-3 py-2 text-sm outline-none"
                    style={fieldInputStyle}
                    required
                  />
                </Field>
                <Field label="Compare-At Price (₹, optional)">
                  <input
                    type="number"
                    value={v.compareAtPrice}
                    onChange={(e) => updateVariant(vi, 'compareAtPrice', e.target.value)}
                    className="w-full px-3 py-2 text-sm outline-none"
                    style={fieldInputStyle}
                  />
                </Field>
              </div>

              <Field label="Images">
                <ImageUploader
                  value={v.images}
                  onChange={(val) => updateVariant(vi, 'images', val)}
                  folder="products"
                />
              </Field>

              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] tracking-[1px] uppercase font-semibold" style={{ color: INK_SOFT }}>
                    {type.sizeLabel || 'Pack Sizes & Pricing'}
                  </span>
                  <span className="text-[11px]" style={{ color: INK_SOFT }}>
                    Each pack size can have its own actual price, MRP, and stock.
                  </span>
                </div>

                <div className="space-y-2">
                  {v.sizes.map((s, si) => {
                    const sPrice = s.price !== '' && s.price !== undefined ? Number(s.price) : Number(v.price) || 0;
                    const sCompare = s.compareAtPrice !== '' && s.compareAtPrice !== undefined ? Number(s.compareAtPrice) : Number(v.compareAtPrice) || 0;
                    const sDiscount = sCompare > sPrice && sCompare > 0 ? Math.round(((sCompare - sPrice) / sCompare) * 100) : 0;

                    return (
                      <div key={si} className="flex flex-wrap sm:flex-nowrap gap-2 items-center p-2.5 rounded bg-[#FAFAFA] border border-[#E8E8E8]">
                        <div className="w-32 shrink-0">
                          <label className="block text-[10px] uppercase text-[#6B6B6B] mb-0.5">Size / Pack</label>
                          <input
                            value={s.size}
                            onChange={(e) => updateSize(vi, si, 'size', e.target.value)}
                            placeholder={type.sizePlaceholder || 'e.g. 100 g'}
                            className="w-full px-2.5 py-1.5 text-xs outline-none bg-white border border-[#E8E8E8]"
                          />
                        </div>

                        <div className="w-28 shrink-0">
                          <label className="block text-[10px] uppercase text-[#6B6B6B] mb-0.5">Actual Rate (₹)</label>
                          <input
                            type="number"
                            value={s.price}
                            onChange={(e) => updateSize(vi, si, 'price', e.target.value)}
                            placeholder={v.price ? String(v.price) : 'Rate'}
                            className="w-full px-2.5 py-1.5 text-xs outline-none bg-white border border-[#E8E8E8]"
                          />
                        </div>

                        <div className="w-28 shrink-0">
                          <label className="block text-[10px] uppercase text-[#6B6B6B] mb-0.5">MRP / Original (₹)</label>
                          <input
                            type="number"
                            value={s.compareAtPrice}
                            onChange={(e) => updateSize(vi, si, 'compareAtPrice', e.target.value)}
                            placeholder={v.compareAtPrice ? String(v.compareAtPrice) : 'MRP'}
                            className="w-full px-2.5 py-1.5 text-xs outline-none bg-white border border-[#E8E8E8]"
                          />
                        </div>

                        <div className="w-24 shrink-0">
                          <label className="block text-[10px] uppercase text-[#6B6B6B] mb-0.5">Stock</label>
                          <input
                            type="number"
                            value={s.stock}
                            onChange={(e) => updateSize(vi, si, 'stock', e.target.value)}
                            placeholder="Stock"
                            className="w-full px-2.5 py-1.5 text-xs outline-none bg-white border border-[#E8E8E8]"
                          />
                        </div>

                        {/* Calculated Discount Pill */}
                        <div className="w-20 shrink-0 text-center">
                          <label className="block text-[10px] uppercase text-[#6B6B6B] mb-0.5">Discount</label>
                          {sDiscount > 0 ? (
                            <span className="inline-block text-[11px] font-bold text-[#DC2626] bg-[#DC2626]/10 px-2 py-1 rounded">
                              {sDiscount}% OFF
                            </span>
                          ) : (
                            <span className="text-[11px] text-[#A0A0A0]">-</span>
                          )}
                        </div>

                        {v.sizes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSize(vi, si)}
                            style={{ color: RED }}
                            className="text-base px-1.5 hover:opacity-80"
                            title="Remove pack size"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => addSize(vi)}
                  className="text-[12px] mt-2.5 font-semibold underline"
                  style={{ color: INK }}
                >
                  + Add {type.defaultSize ? 'Option' : 'Pack Size'}
                </button>
              </div>
            </div>
          ))}
          <button type="button" onClick={addVariant} className="text-[12px] underline" style={{ color: INK }}>
            + Add Variant
          </button>
        </Section>
      )}

      {/* Pant / Shawl add-ons — apparel only */}
      {ready && type.showAddons && (
        <>
          <AddonSection
            title="Pant Add-ons (optional)"
            items={pantOptions}
            onUpdate={(i, key, value) => updateAddon(setPantOptions, i, key, value)}
            onAdd={() => addAddon(setPantOptions)}
            onRemove={(i) => removeAddon(setPantOptions, i)}
          />
          <AddonSection
            title="Shawl Add-ons (optional)"
            items={shawlOptions}
            onUpdate={(i, key, value) => updateAddon(setShawlOptions, i, key, value)}
            onAdd={() => addAddon(setShawlOptions)}
            onRemove={(i) => removeAddon(setShawlOptions, i)}
          />
        </>
      )}

      <button
        type="submit"
        disabled={saving || !ready}
        className="py-3 text-[13px] tracking-[1.5px] uppercase"
        style={{ background: INK, color: PAPER, opacity: saving || !ready ? 0.6 : 1 }}
      >
        {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Product'}
      </button>
    </form>
  );
}

/* ---------- Image uploader ---------- */

// `value` is a comma-separated string of URLs; `onChange` receives the same format.
function ImageUploader({ value, onChange, folder = 'products', multiple = true }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const urls = (value || '').split(',').map((s) => s.trim()).filter(Boolean);

  async function onFiles(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = ''; // allow re-selecting the same file
    if (!files.length) return;

    setUploading(true);
    setUploadError('');
    const uploaded = [];

    for (const file of files) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', folder);
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');
        uploaded.push(data.url);
      } catch (err) {
        setUploadError(`${file.name}: ${err.message}`);
      }
    }

    if (uploaded.length) {
      const next = multiple ? [...urls, ...uploaded] : [uploaded[0]];
      onChange(next.join(', '));
    }
    setUploading(false);
  }

  function removeAt(i) {
    onChange(urls.filter((_, idx) => idx !== i).join(', '));
  }

  return (
    <div>
      {urls.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {urls.map((url, i) => (
            <div key={url + i} className="relative" style={{ width: 80, height: 80, border: `1px solid ${LINE}` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute top-0 right-0 w-5 h-5 text-[12px] leading-none"
                style={{ background: INK, color: PAPER }}
                aria-label="Remove image"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <label
        className="inline-block px-3 py-2 text-[12px] tracking-[1px] uppercase cursor-pointer"
        style={{ border: `1px solid ${INK}`, color: INK, opacity: uploading ? 0.6 : 1 }}
      >
        {uploading ? 'Uploading...' : multiple ? 'Upload Images' : 'Upload Image'}
        <input
          type="file"
          accept="image/*"
          multiple={multiple}
          onChange={onFiles}
          disabled={uploading}
          className="hidden"
        />
      </label>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm outline-none mt-2"
        style={fieldInputStyle}
        placeholder="or paste image URL(s), comma separated"
      />

      {uploadError && (
        <p className="text-[12px] mt-1" style={{ color: RED }}>{uploadError}</p>
      )}
    </div>
  );
}

/* ---------- Layout helpers ---------- */

function Section({ title, children }) {
  return (
    <div>
      <h2 className="text-[13px] tracking-[1.5px] uppercase mb-3" style={{ color: INK }}>{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="mb-3">
      <label className="block text-[11px] tracking-[1px] uppercase mb-1" style={{ color: INK_SOFT }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function AddonSection({ title, items, onUpdate, onAdd, onRemove }) {
  return (
    <Section title={title}>
      {items.map((o, i) => (
        <div key={i} className="p-4 mb-3" style={{ border: `1px solid ${LINE}` }}>
          <div className="grid grid-cols-2 gap-3 mb-2">
            {[
              ['name', 'Name', 'text'],
              ['price', 'Extra Price (₹)', 'number'],
              ['stock', 'Stock', 'number'],
              ['sku', 'SKU (optional)', 'text'],
            ].map(([key, label, inputType]) => (
              <Field key={key} label={label}>
                <input
                  type={inputType}
                  value={o[key]}
                  onChange={(e) => onUpdate(i, key, e.target.value)}
                  className="w-full px-3 py-2 text-sm outline-none"
                  style={fieldInputStyle}
                />
              </Field>
            ))}
          </div>
          <Field label="Image (optional)">
            <ImageUploader
              value={o.image}
              onChange={(val) => onUpdate(i, 'image', val)}
              folder="addons"
              multiple={false}
            />
          </Field>
          <button type="button" onClick={() => onRemove(i)} className="text-[12px] mt-1" style={{ color: RED }}>
            Remove
          </button>
        </div>
      ))}
      <button type="button" onClick={onAdd} className="text-[12px] underline" style={{ color: INK }}>
        + Add Option
      </button>
    </Section>
  );
}