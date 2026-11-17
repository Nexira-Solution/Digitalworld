'use client';

import { useEffect, useState, useRef, useId } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Plus,
  Trash2,
  Upload,
  Loader2,
  X,
  AlertCircle,
  Package,
  CheckCircle2,
  Tag,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { getType, getCategorySpecificFields, isValidFSSAI } from '@/lib/productTypes';
import ProductTypeFields from '@/components/ProductTypeFields';

const INK = '#0F172A';
const INK_SOFT = '#64748B';
const LINE = '#E7E2D6';
const PAPER = '#FFFFFF';
const CANVAS = '#FAF9F5';
const GOLD = '#C9A227';
const RED = '#B3261E';

// Common Indian & Standard Barcode formats validator
export function isValidBarcode(barcode, format = 'AUTO') {
  if (!barcode) return true; // optional
  const b = String(barcode).trim();
  if (format === 'EAN13' || (/^\d{13}$/.test(b) && (format === 'AUTO' || format === 'EAN13'))) {
    return /^\d{13}$/.test(b);
  }
  if (format === 'UPCA' || (/^\d{12}$/.test(b) && (format === 'AUTO' || format === 'UPCA'))) {
    return /^\d{12}$/.test(b);
  }
  if (format === 'EAN8' || (/^\d{8}$/.test(b) && (format === 'AUTO' || format === 'EAN8'))) {
    return /^\d{8}$/.test(b);
  }
  // Generic alphanumeric barcode (Code 128 / Code 39)
  return /^[A-Za-z0-9\-_]{6,20}$/.test(b);
}

// Indian mobile format
export function isValidMobile(phone) {
  if (!phone) return true;
  return /^[6-9]\d{9}$/.test(String(phone).trim());
}

// Indian pincode format
export function isValidPincode(pin) {
  if (!pin) return true;
  return /^[1-9][0-9]{5}$/.test(String(pin).trim());
}

// Indian GSTIN format
export function isValidGSTIN(gst) {
  if (!gst) return true;
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(String(gst).trim().toUpperCase());
}

export default function UnifiedProductForm({
  mode = 'seller', // 'admin' | 'seller'
  productId,
  initialProduct,
  initial,
}) {
  const router = useRouter();
  const formRef = useRef(null);
  const isEdit = Boolean(productId || initialProduct?._id || initial?._id);
  const p = initialProduct || initial;

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewProductId, setPreviewProductId] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');

  // Primary Form State
  const [form, setForm] = useState({
    name: '',
    category: '',
    subcategory: '',
    barcode: '',
    barcodeFormat: 'AUTO',
    description: '',
    fabric: '',
    tags: '',
    isBestSeller: false,
    isActive: true,
    attributes: {},
    specs: [],
    // For products without variants
    singlePrice: '',
    singleCompareAtPrice: '',
    singleStock: '',
    singleSku: '',
  });

  // Category-specific Variants State (Requirement 04)
  // Each category type handles its own dimensions
  const [variantType, setVariantType] = useState('pack'); // 'pack' | 'electronics' | 'clothing' | 'footwear' | 'general'
  const [hasVariants, setHasVariants] = useState(true);

  // 1. Pack-based variants (Snacks, Sweets, Chocolates, Groceries)
  const [packVariants, setPackVariants] = useState([
    { size: '100g', price: '', compareAtPrice: '', stock: '', sku: '', barcode: '' },
    { size: '200g', price: '', compareAtPrice: '', stock: '', sku: '', barcode: '' },
  ]);

  // 2. Electronics variants (Model, RAM, Storage, Color, Warranty)
  const [electronicsVariants, setElectronicsVariants] = useState([
    { model: '', ram: '8GB', storage: '128GB', color: 'Black', price: '', compareAtPrice: '', stock: '', sku: '', barcode: '', warranty: '1 Year' },
  ]);

  // 3. Clothing variants (Size, Color, Fabric, Style)
  const [clothingVariants, setClothingVariants] = useState([
    { color: 'Black', colorHex: '#000000', size: 'M', fabric: '', style: '', price: '', compareAtPrice: '', stock: '', sku: '', barcode: '' },
    { color: 'Black', colorHex: '#000000', size: 'L', fabric: '', style: '', price: '', compareAtPrice: '', stock: '', sku: '', barcode: '' },
  ]);

  // 4. Footwear variants (UK Size, EU Size, Color, Brand, Material)
  const [footwearVariants, setFootwearVariants] = useState([
    { ukSize: 'UK 7', euSize: 'EU 41', color: 'Black', material: 'Mesh / Rubber', price: '', compareAtPrice: '', stock: '', sku: '', barcode: '' },
    { ukSize: 'UK 8', euSize: 'EU 42', color: 'Black', material: 'Mesh / Rubber', price: '', compareAtPrice: '', stock: '', sku: '', barcode: '' },
  ]);

  // 5. General variants
  const [generalVariants, setGeneralVariants] = useState([
    { option: 'Standard', price: '', compareAtPrice: '', stock: '', sku: '', barcode: '' },
  ]);

  // Images state
  const [images, setImages] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  // 1. Fetch Categories dynamically on mount (Requirement 02)
  useEffect(() => {
    let alive = true;
    fetch('/api/categories?all=true')
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        const list = Array.isArray(d) ? d : d.topLevel || d.categories || [];
        setCategories(list.filter((c) => c.isActive !== false));
      })
      .catch(() => {
        if (alive) toast.error('Failed to load categories');
      });
    return () => {
      alive = false;
    };
  }, []);

  // 2. Populate existing product data if editing
  useEffect(() => {
    if (!p) {
      setLoading(false);
      return;
    }

    const catId = p.category?._id || p.category || '';
    const subcatId = p.subcategory?._id || p.subcategory || '';

    setForm({
      name: p.name || '',
      category: catId,
      subcategory: subcatId,
      barcode: p.barcode || '',
      barcodeFormat: 'AUTO',
      description: p.description || '',
      fabric: p.fabric || '',
      tags: Array.isArray(p.tags) ? p.tags.join(', ') : '',
      isBestSeller: Boolean(p.isBestSeller),
      isActive: p.isActive !== false,
      attributes: { ...(p.attributes || {}) },
      specs: Array.isArray(p.specs) ? p.specs.map((s) => ({ key: s.key || '', value: s.value || '' })) : [],
      singlePrice: p.basePrice || '',
      singleCompareAtPrice: p.compareAtPrice || '',
      singleStock: p.totalStock ?? p.stock ?? '',
      singleSku: p.sku || '',
    });

    if (p.productId) setPreviewProductId(p.productId);
    if (Array.isArray(p.images)) setImages(p.images);

    // Populate category-specific variants
    if (Array.isArray(p.variants) && p.variants.length > 0) {
      setHasVariants(true);
      const first = p.variants[0];
      const hasSizes = Array.isArray(first.sizes) && first.sizes.length > 0;

      if (hasSizes) {
        // Flatten into pack / clothing variant format
        const packs = [];
        p.variants.forEach((v) => {
          (v.sizes || []).forEach((s) => {
            packs.push({
              size: s.size || 'Standard',
              price: s.price ?? v.price ?? '',
              compareAtPrice: s.compareAtPrice ?? v.compareAtPrice ?? '',
              stock: s.stock ?? '',
              sku: s.sku || v.sku || '',
              barcode: s.barcode || v.barcode || '',
              color: v.color || '',
              colorHex: v.colorHex || '#000000',
              ram: s.ram || v.ram || '',
              storage: s.storage || v.storage || '',
              warranty: s.warranty || v.warranty || '',
              ukSize: s.ukSize || v.ukSize || '',
              euSize: s.euSize || v.euSize || '',
            });
          });
        });
        if (packs.length > 0) setPackVariants(packs);
      }
    } else {
      setHasVariants(false);
    }

    setLoading(false);
  }, [p]);

  // 3. Resolve active category doc & variant type
  const selectedCat = categories.find((c) => String(c._id) === String(form.category));
  const catSlug = (selectedCat?.slug || selectedCat?.name || '').toLowerCase();

  useEffect(() => {
    if (!catSlug) return;
    if (catSlug.includes('snack') || catSlug.includes('sweet') || catSlug.includes('grocer') || catSlug.includes('choco')) {
      setVariantType('pack');
    } else if (catSlug.includes('elect') || catSlug.includes('mobile') || catSlug.includes('laptop')) {
      setVariantType('electronics');
    } else if (catSlug.includes('cloth') || catSlug.includes('apparel') || catSlug.includes('wear')) {
      setVariantType('clothing');
    } else if (catSlug.includes('foot') || catSlug.includes('shoe')) {
      setVariantType('footwear');
    } else {
      setVariantType('general');
    }
  }, [catSlug]);

  // 4. Update Subcategories & Peek Next Product ID when category changes (Requirements 02 & 05)
  useEffect(() => {
    if (!form.category) {
      setSubcategories([]);
      return;
    }

    // Set subcategories from category doc if embedded, or fetch
    const cat = categories.find((c) => String(c._id) === String(form.category));
    if (cat?.subcategories?.length) {
      setSubcategories(cat.subcategories.filter((s) => s.isActive !== false));
    } else {
      fetch(`/api/categories/${form.category}`)
        .then((r) => r.json())
        .then((d) => {
          setSubcategories((d.subcategories || []).filter((s) => s.isActive !== false));
        })
        .catch(() => {});
    }

    // Update Product ID preview dynamically if not editing existing
    if (!isEdit || !previewProductId) {
      fetch(`/api/products/next-id?categoryId=${form.category}&subcategoryId=${form.subcategory || ''}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.previewId) setPreviewProductId(d.previewId);
        })
        .catch(() => {});
    }
  }, [form.category, form.subcategory, isEdit, categories, previewProductId]);

  // Calculate live total stock (Requirement 04)
  const totalCalculatedStock = (() => {
    if (!hasVariants) return Math.max(0, Number(form.singleStock) || 0);
    let sum = 0;
    if (variantType === 'pack') {
      packVariants.forEach((v) => { sum += Math.max(0, Number(v.stock) || 0); });
    } else if (variantType === 'electronics') {
      electronicsVariants.forEach((v) => { sum += Math.max(0, Number(v.stock) || 0); });
    } else if (variantType === 'clothing') {
      clothingVariants.forEach((v) => { sum += Math.max(0, Number(v.stock) || 0); });
    } else if (variantType === 'footwear') {
      footwearVariants.forEach((v) => { sum += Math.max(0, Number(v.stock) || 0); });
    } else {
      generalVariants.forEach((v) => { sum += Math.max(0, Number(v.stock) || 0); });
    }
    return sum;
  })();

  // Image uploader handler
  async function handleImageUpload(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadingImage(true);
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('folder', 'products');
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (res.ok && data.url) {
          setImages((prev) => [...prev, data.url]);
        } else {
          toast.error(data.error || 'Failed to upload image');
        }
      }
    } catch {
      toast.error('Image upload failed');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  }

  function removeImage(idx) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  // Strict Field Validation & First-Invalid Navigation (Requirement 03)
  function validateForm() {
    const errors = {};

    if (!form.name.trim()) {
      errors.name = 'Product Name is required.';
    }

    if (!form.category) {
      errors.category = 'Please select a valid category.';
    }

    if (form.barcode && !isValidBarcode(form.barcode, form.barcodeFormat)) {
      errors.barcode = 'Barcode format is invalid for the selected barcode standard.';
    }

    // Food category: exact 14-digit FSSAI check
    const isFood = ['snacks', 'sweets', 'groceries', 'chocolates'].some((k) => catSlug.includes(k));
    if (isFood && form.attributes?.fssaiLicense) {
      if (!isValidFSSAI(form.attributes.fssaiLicense)) {
        errors.fssaiLicense = 'FSSAI License Number must contain exactly 14 digits.';
      }
    }

    // Required Category-specific attributes
    const dynamicFields = getCategorySpecificFields(catSlug);
    dynamicFields.forEach((df) => {
      if (df.required && !form.attributes?.[df.key]?.trim()) {
        errors[df.key] = `${df.label} is required for this category.`;
      }
    });

    // Variant & Stock Validation
    if (!hasVariants) {
      if (!form.singlePrice || Number(form.singlePrice) <= 0) {
        errors.singlePrice = 'Selling price is required and must be greater than 0.';
      }
      if (form.singleStock === '' || Number(form.singleStock) < 0) {
        errors.singleStock = 'Stock quantity is required.';
      }
    } else {
      let activeList = [];
      if (variantType === 'pack') activeList = packVariants;
      else if (variantType === 'electronics') activeList = electronicsVariants;
      else if (variantType === 'clothing') activeList = clothingVariants;
      else if (variantType === 'footwear') activeList = footwearVariants;
      else activeList = generalVariants;

      if (!activeList.length) {
        errors.variants = 'At least one product variant is required.';
      } else {
        activeList.forEach((v, idx) => {
          if (!v.price || Number(v.price) <= 0) {
            errors[`variant_price_${idx}`] = `Variant ${idx + 1} requires a valid selling price.`;
          }
          if (v.stock === '' || Number(v.stock) < 0) {
            errors[`variant_stock_${idx}`] = `Variant ${idx + 1} stock quantity is required.`;
          }
        });
      }
    }

    setFieldErrors(errors);
    return errors;
  }

  // Scroll to first invalid field and focus it without page jump
  function scrollToFirstError(errors) {
    const errorKeys = Object.keys(errors);
    if (!errorKeys.length) return;

    const firstKey = errorKeys[0];
    const el =
      formRef.current?.querySelector(`[name="${firstKey}"]`) ||
      formRef.current?.querySelector(`[data-field="${firstKey}"]`) ||
      formRef.current?.querySelector('.border-red-500');

    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (typeof el.focus === 'function') {
        el.focus();
      }
    }
  }

  // Build Payload conforming to Product model
  function buildPayload() {
    let variantsPayload = [];

    if (!hasVariants) {
      variantsPayload = [
        {
          color: 'Standard',
          price: Number(form.singlePrice),
          compareAtPrice: Number(form.singleCompareAtPrice) || Number(form.singlePrice),
          sku: form.singleSku || '',
          barcode: form.barcode || '',
          stock: Number(form.singleStock) || 0,
          sizes: [
            {
              size: 'Standard',
              price: Number(form.singlePrice),
              compareAtPrice: Number(form.singleCompareAtPrice) || Number(form.singlePrice),
              stock: Number(form.singleStock) || 0,
              sku: form.singleSku || '',
              barcode: form.barcode || '',
            },
          ],
        },
      ];
    } else if (variantType === 'pack') {
      // Group by pack size
      variantsPayload = [
        {
          color: 'Standard',
          price: Math.min(...packVariants.map((p) => Number(p.price) || 0)),
          compareAtPrice: Math.max(...packVariants.map((p) => Number(p.compareAtPrice) || 0)),
          sizes: packVariants.map((p) => ({
            size: p.size,
            price: Number(p.price) || 0,
            compareAtPrice: Number(p.compareAtPrice) || Number(p.price) || 0,
            stock: Number(p.stock) || 0,
            sku: p.sku || '',
            barcode: p.barcode || '',
          })),
        },
      ];
    } else if (variantType === 'electronics') {
      variantsPayload = electronicsVariants.map((e, i) => ({
        color: e.color || 'Standard',
        model: e.model || '',
        ram: e.ram || '',
        storage: e.storage || '',
        warranty: e.warranty || '',
        price: Number(e.price) || 0,
        compareAtPrice: Number(e.compareAtPrice) || Number(e.price) || 0,
        sku: e.sku || '',
        barcode: e.barcode || '',
        stock: Number(e.stock) || 0,
        sizes: [
          {
            size: `${e.storage || ''} ${e.ram ? `/ ${e.ram}` : ''}`.trim() || `Config ${i + 1}`,
            ram: e.ram,
            storage: e.storage,
            warranty: e.warranty,
            price: Number(e.price) || 0,
            compareAtPrice: Number(e.compareAtPrice) || Number(e.price) || 0,
            stock: Number(e.stock) || 0,
            sku: e.sku || '',
            barcode: e.barcode || '',
          },
        ],
      }));
    } else if (variantType === 'clothing') {
      // Group by color
      const colorMap = {};
      clothingVariants.forEach((c) => {
        const key = c.color || 'Standard';
        if (!colorMap[key]) {
          colorMap[key] = {
            color: key,
            colorHex: c.colorHex || '#000000',
            fabric: c.fabric || '',
            style: c.style || '',
            price: Number(c.price) || 0,
            compareAtPrice: Number(c.compareAtPrice) || 0,
            sizes: [],
          };
        }
        colorMap[key].sizes.push({
          size: c.size || 'M',
          price: Number(c.price) || 0,
          compareAtPrice: Number(c.compareAtPrice) || Number(c.price) || 0,
          stock: Number(c.stock) || 0,
          sku: c.sku || '',
          barcode: c.barcode || '',
        });
      });
      variantsPayload = Object.values(colorMap);
    } else if (variantType === 'footwear') {
      variantsPayload = footwearVariants.map((f, i) => ({
        color: f.color || 'Standard',
        ukSize: f.ukSize || '',
        euSize: f.euSize || '',
        material: f.material || '',
        price: Number(f.price) || 0,
        compareAtPrice: Number(f.compareAtPrice) || Number(f.price) || 0,
        sku: f.sku || '',
        barcode: f.barcode || '',
        stock: Number(f.stock) || 0,
        sizes: [
          {
            size: f.ukSize || `Size ${i + 1}`,
            ukSize: f.ukSize,
            euSize: f.euSize,
            price: Number(f.price) || 0,
            compareAtPrice: Number(f.compareAtPrice) || Number(f.price) || 0,
            stock: Number(f.stock) || 0,
            sku: f.sku || '',
            barcode: f.barcode || '',
          },
        ],
      }));
    } else {
      variantsPayload = [
        {
          color: 'Standard',
          price: Math.min(...generalVariants.map((g) => Number(g.price) || 0)),
          sizes: generalVariants.map((g) => ({
            size: g.option || 'Standard',
            price: Number(g.price) || 0,
            compareAtPrice: Number(g.compareAtPrice) || 0,
            stock: Number(g.stock) || 0,
            sku: g.sku || '',
            barcode: g.barcode || '',
          })),
        },
      ];
    }

    return {
      name: form.name.trim(),
      category: form.category,
      subcategory: form.subcategory || null,
      barcode: form.barcode.trim(),
      description: form.description,
      fabric: form.fabric,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      isBestSeller: form.isBestSeller,
      isActive: form.isActive,
      attributes: form.attributes,
      specs: form.specs,
      images,
      variants: variantsPayload,
      basePrice: hasVariants
        ? Math.min(...variantsPayload.map((v) => Number(v.price) || 0))
        : Number(form.singlePrice) || 0,
    };
  }

  // Handle Form Submission
  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormError('Please review and correct the highlighted fields before submitting.');
      scrollToFirstError(errors);
      return;
    }

    setSaving(true);
    const payload = buildPayload();

    try {
      const url = isEdit ? `/api/products/${p?._id || productId}` : '/api/products';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to save product.');
        setSaving(false);
        return;
      }

      toast.success(isEdit ? 'Product updated successfully!' : 'Product created successfully!');
      router.push(mode === 'admin' ? '/admin/products' : '/seller/products');
      router.refresh();
    } catch {
      setFormError('Network error. Please try again.');
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-3 text-sm text-[#64748B]">
        <Loader2 className="w-6 h-6 animate-spin text-[#C9A227]" />
        <span>Loading product configuration…</span>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-8 max-w-4xl pb-16">
      {/* Top Banner Alert on Error */}
      {formError && (
        <div className="p-4 rounded-xl bg-[#FCE8E6] border border-[#B3261E]/30 text-[#B3261E] flex items-center gap-3 text-xs sm:text-sm font-medium">
          <AlertCircle size={18} className="shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* SECTION 1: Product Identification & Categorization (Requirement 02 & 05) */}
      <div className="p-6 rounded-2xl bg-white border border-[#E7E2D6] shadow-2xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#E7E2D6]">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-2">
            <Package size={16} className="text-[#C9A227]" />
            <span>Product Identification & Classification</span>
          </h2>
          <span className="text-[11px] font-semibold text-[#64748B]">
            {mode === 'admin' ? 'Admin Catalog' : 'Seller Catalog'}
          </span>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* Product Name */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-1.5">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              type="text"
              value={form.name}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, name: e.target.value }));
                if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }));
              }}
              placeholder="e.g. Traditional Spicy Banana Chips"
              className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border outline-none transition-colors ${
                fieldErrors.name ? 'border-red-500 bg-red-50/20' : 'border-[#D6D6D6] focus:border-[#0F172A]'
              }`}
            />
            {fieldErrors.name && (
              <p className="text-[11px] text-red-600 font-medium mt-1 flex items-center gap-1">
                <AlertCircle size={12} /> {fieldErrors.name}
              </p>
            )}
          </div>

          {/* Category Dropdown (Requirement 02) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-1.5">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={form.category}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, category: e.target.value, subcategory: '' }));
                if (fieldErrors.category) setFieldErrors((prev) => ({ ...prev, category: '' }));
              }}
              className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border outline-none transition-colors bg-white ${
                fieldErrors.category ? 'border-red-500 bg-red-50/20' : 'border-[#D6D6D6] focus:border-[#0F172A]'
              }`}
            >
              <option value="">-- Select Active Category --</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} {c.isActive === false ? '(Inactive)' : ''}
                </option>
              ))}
            </select>
            {fieldErrors.category && (
              <p className="text-[11px] text-red-600 font-medium mt-1 flex items-center gap-1">
                <AlertCircle size={12} /> {fieldErrors.category}
              </p>
            )}
          </div>

          {/* Subcategory Dropdown */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-1.5">
              Subcategory (Optional)
            </label>
            <select
              name="subcategory"
              value={form.subcategory}
              onChange={(e) => setForm((prev) => ({ ...prev, subcategory: e.target.value }))}
              disabled={!subcategories.length}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#D6D6D6] outline-none focus:border-[#0F172A] bg-white disabled:bg-neutral-100 disabled:text-neutral-400"
            >
              <option value="">
                {subcategories.length ? '-- Select Subcategory --' : '-- No Subcategories Available --'}
              </option>
              {subcategories.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Read-Only Auto Product ID (Requirement 05) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-1.5 flex items-center justify-between">
              <span>Unique Product ID</span>
              <span className="text-[10px] text-[#C9A227] font-semibold">Auto-Generated</span>
            </label>
            <input
              type="text"
              value={previewProductId || (form.category ? 'Calculating…' : 'Select Category')}
              readOnly
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E7E2D6] bg-[#FAF9F5] text-[#0F172A] font-mono font-bold cursor-not-allowed select-all"
            />
            <p className="text-[10.5px] text-[#64748B] mt-1">
              Confirmed atomically by server sequence upon creation.
            </p>
          </div>

          {/* Barcode / Standard */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-1.5">
              Barcode / EAN / UPC
            </label>
            <input
              name="barcode"
              type="text"
              value={form.barcode}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, barcode: e.target.value }));
                if (fieldErrors.barcode) setFieldErrors((prev) => ({ ...prev, barcode: '' }));
              }}
              placeholder="e.g. 8901234567890"
              className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border outline-none font-mono ${
                fieldErrors.barcode ? 'border-red-500 bg-red-50/20' : 'border-[#D6D6D6] focus:border-[#0F172A]'
              }`}
            />
            {fieldErrors.barcode && (
              <p className="text-[11px] text-red-600 font-medium mt-1 flex items-center gap-1">
                <AlertCircle size={12} /> {fieldErrors.barcode}
              </p>
            )}
          </div>
        </div>

        {/* Short Description */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-1.5">
            Product Description
          </label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Detailed description, taste profile, craftsmanship or specifications…"
            className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#D6D6D6] outline-none focus:border-[#0F172A]"
          />
        </div>
      </div>

      {/* SECTION 2: Category-Specific Attributes (Requirement 01 & 03) */}
      {selectedCat && (
        <div className="p-6 rounded-2xl bg-white border border-[#E7E2D6] shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E7E2D6]">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#C9A227]" />
              <span>{selectedCat.name} Attributes & Compliance</span>
            </h2>
            <span className="text-[11px] font-semibold text-[#64748B]">Category Specific</span>
          </div>

          <ProductTypeFields
            productType={catSlug}
            attributes={form.attributes}
            onChange={(key, val) => {
              setForm((prev) => ({
                ...prev,
                attributes: { ...(prev.attributes || {}), [key]: val },
              }));
              if (fieldErrors[key]) setFieldErrors((prev) => ({ ...prev, [key]: '' }));
            }}
          />

          {fieldErrors.fssaiLicense && (
            <p className="text-[11px] text-red-600 font-medium mt-1 flex items-center gap-1">
              <AlertCircle size={12} /> {fieldErrors.fssaiLicense}
            </p>
          )}
        </div>
      )}

      {/* SECTION 3: Category-Specific Pricing, Stock & Variants (Requirement 04) */}
      <div className="p-6 rounded-2xl bg-white border border-[#E7E2D6] shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E7E2D6]">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-2">
              <Tag size={16} className="text-[#C9A227]" />
              <span>Pricing, Inventory & Product Variants</span>
            </h2>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              Category-tuned variant schemas with independent pricing, barcodes and stock caps.
            </p>
          </div>

          {/* Total Product Stock Pill */}
          <div className="flex items-center gap-2 bg-[#FAF7EE] border border-[#C9A227]/40 px-3 py-1.5 rounded-full">
            <span className="text-xs font-bold text-[#0F172A]">Total Inventory Stock:</span>
            <span className="font-mono font-bold text-xs text-[#C9A227]">{totalCalculatedStock} Units</span>
          </div>
        </div>

        {/* VARIANT STRUCTURE A: Food / Snacks / Sweets (Pack & Weight Based) */}
        {variantType === 'pack' && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-[#0F172A]">Weight / Pack-Based Variants:</p>
            <div className="space-y-3">
              {packVariants.map((v, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-[#E7E2D6] bg-[#FAF9F5] grid grid-cols-2 sm:grid-cols-6 gap-2.5 items-center">
                  <div className="col-span-1">
                    <label className="text-[10px] font-bold uppercase text-[#64748B] block mb-1">Pack Size</label>
                    <input
                      type="text"
                      value={v.size}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPackVariants((list) => list.map((item, i) => (i === idx ? { ...item, size: val } : item)));
                      }}
                      placeholder="e.g. 100g, 1kg"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#D6D6D6] bg-white font-semibold"
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="text-[10px] font-bold uppercase text-[#64748B] block mb-1">Actual (MRP)</label>
                    <input
                      type="number"
                      value={v.compareAtPrice}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPackVariants((list) => list.map((item, i) => (i === idx ? { ...item, compareAtPrice: val } : item)));
                      }}
                      placeholder="₹ MRP"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#D6D6D6] bg-white"
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="text-[10px] font-bold uppercase text-[#64748B] block mb-1">Selling Price *</label>
                    <input
                      type="number"
                      value={v.price}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPackVariants((list) => list.map((item, i) => (i === idx ? { ...item, price: val } : item)));
                      }}
                      placeholder="₹ Price"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#D6D6D6] bg-white font-bold text-[#0F172A]"
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="text-[10px] font-bold uppercase text-[#64748B] block mb-1">Stock Qty *</label>
                    <input
                      type="number"
                      value={v.stock}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPackVariants((list) => list.map((item, i) => (i === idx ? { ...item, stock: val } : item)));
                      }}
                      placeholder="Units"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#D6D6D6] bg-white font-bold"
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="text-[10px] font-bold uppercase text-[#64748B] block mb-1">SKU Code</label>
                    <input
                      type="text"
                      value={v.sku}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPackVariants((list) => list.map((item, i) => (i === idx ? { ...item, sku: val } : item)));
                      }}
                      placeholder="SKU-100G"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#D6D6D6] bg-white font-mono"
                    />
                  </div>

                  <div className="col-span-1 flex items-end justify-between gap-1 pt-4 sm:pt-0">
                    <div className="flex-1">
                      <label className="text-[10px] font-bold uppercase text-[#64748B] block mb-1">Barcode</label>
                      <input
                        type="text"
                        value={v.barcode}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPackVariants((list) => list.map((item, i) => (i === idx ? { ...item, barcode: val } : item)));
                        }}
                        placeholder="EAN/UPC"
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#D6D6D6] bg-white font-mono"
                      />
                    </div>
                    {packVariants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setPackVariants((list) => list.filter((_, i) => i !== idx))}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg shrink-0"
                        title="Remove Variant"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                setPackVariants((list) => [
                  ...list,
                  { size: '500g', price: '', compareAtPrice: '', stock: '', sku: '', barcode: '' },
                ])
              }
              className="text-xs font-bold text-[#0F172A] hover:text-[#C9A227] flex items-center gap-1.5 pt-1"
            >
              <Plus size={14} /> Add Weight / Pack Size
            </button>
          </div>
        )}

        {/* VARIANT STRUCTURE B: Electronics (RAM, Storage, Model, Warranty) */}
        {variantType === 'electronics' && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-[#0F172A]">Hardware & Capacity Variants:</p>
            <div className="space-y-3">
              {electronicsVariants.map((e, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-[#E7E2D6] bg-[#FAF9F5] grid grid-cols-2 sm:grid-cols-7 gap-2.5 items-center">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#64748B] block mb-1">RAM</label>
                    <input
                      type="text"
                      value={e.ram}
                      onChange={(ev) => {
                        const val = ev.target.value;
                        setElectronicsVariants((list) => list.map((item, i) => (i === idx ? { ...item, ram: val } : item)));
                      }}
                      placeholder="e.g. 8GB"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#D6D6D6] bg-white font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#64748B] block mb-1">Storage</label>
                    <input
                      type="text"
                      value={e.storage}
                      onChange={(ev) => {
                        const val = ev.target.value;
                        setElectronicsVariants((list) => list.map((item, i) => (i === idx ? { ...item, storage: val } : item)));
                      }}
                      placeholder="e.g. 256GB"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#D6D6D6] bg-white font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#64748B] block mb-1">Color / Finish</label>
                    <input
                      type="text"
                      value={e.color}
                      onChange={(ev) => {
                        const val = ev.target.value;
                        setElectronicsVariants((list) => list.map((item, i) => (i === idx ? { ...item, color: val } : item)));
                      }}
                      placeholder="Titanium Black"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#D6D6D6] bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#64748B] block mb-1">Actual (MRP)</label>
                    <input
                      type="number"
                      value={e.compareAtPrice}
                      onChange={(ev) => {
                        const val = ev.target.value;
                        setElectronicsVariants((list) => list.map((item, i) => (i === idx ? { ...item, compareAtPrice: val } : item)));
                      }}
                      placeholder="₹ MRP"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#D6D6D6] bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#64748B] block mb-1">Selling Price *</label>
                    <input
                      type="number"
                      value={e.price}
                      onChange={(ev) => {
                        const val = ev.target.value;
                        setElectronicsVariants((list) => list.map((item, i) => (i === idx ? { ...item, price: val } : item)));
                      }}
                      placeholder="₹ Price"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#D6D6D6] bg-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#64748B] block mb-1">Stock Qty *</label>
                    <input
                      type="number"
                      value={e.stock}
                      onChange={(ev) => {
                        const val = ev.target.value;
                        setElectronicsVariants((list) => list.map((item, i) => (i === idx ? { ...item, stock: val } : item)));
                      }}
                      placeholder="Units"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#D6D6D6] bg-white font-bold"
                    />
                  </div>

                  <div className="flex items-end justify-between gap-1 pt-4 sm:pt-0">
                    <div className="flex-1">
                      <label className="text-[10px] font-bold uppercase text-[#64748B] block mb-1">Warranty</label>
                      <input
                        type="text"
                        value={e.warranty}
                        onChange={(ev) => {
                          const val = ev.target.value;
                          setElectronicsVariants((list) => list.map((item, i) => (i === idx ? { ...item, warranty: val } : item)));
                        }}
                        placeholder="1 Year"
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#D6D6D6] bg-white"
                      />
                    </div>
                    {electronicsVariants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setElectronicsVariants((list) => list.filter((_, i) => i !== idx))}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg shrink-0"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                setElectronicsVariants((list) => [
                  ...list,
                  { model: '', ram: '12GB', storage: '256GB', color: 'Silver', price: '', compareAtPrice: '', stock: '', sku: '', barcode: '', warranty: '1 Year' },
                ])
              }
              className="text-xs font-bold text-[#0F172A] hover:text-[#C9A227] flex items-center gap-1.5 pt-1"
            >
              <Plus size={14} /> Add Hardware Specification Variant
            </button>
          </div>
        )}

        {/* VARIANT STRUCTURE C: Clothing (Size, Color, Fabric, Style) */}
        {variantType === 'clothing' && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-[#0F172A]">Apparel Size & Color Combinations:</p>
            <div className="space-y-3">
              {clothingVariants.map((c, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-[#E7E2D6] bg-[#FAF9F5] grid grid-cols-2 sm:grid-cols-6 gap-2.5 items-center">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#64748B] block mb-1">Size</label>
                    <input
                      type="text"
                      value={c.size}
                      onChange={(ev) => {
                        const val = ev.target.value;
                        setClothingVariants((list) => list.map((item, i) => (i === idx ? { ...item, size: val } : item)));
                      }}
                      placeholder="S, M, L, XL"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#D6D6D6] bg-white font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#64748B] block mb-1">Color Name</label>
                    <input
                      type="text"
                      value={c.color}
                      onChange={(ev) => {
                        const val = ev.target.value;
                        setClothingVariants((list) => list.map((item, i) => (i === idx ? { ...item, color: val } : item)));
                      }}
                      placeholder="Black, Navy"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#D6D6D6] bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#64748B] block mb-1">Actual (MRP)</label>
                    <input
                      type="number"
                      value={c.compareAtPrice}
                      onChange={(ev) => {
                        const val = ev.target.value;
                        setClothingVariants((list) => list.map((item, i) => (i === idx ? { ...item, compareAtPrice: val } : item)));
                      }}
                      placeholder="₹ MRP"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#D6D6D6] bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#64748B] block mb-1">Selling Price *</label>
                    <input
                      type="number"
                      value={c.price}
                      onChange={(ev) => {
                        const val = ev.target.value;
                        setClothingVariants((list) => list.map((item, i) => (i === idx ? { ...item, price: val } : item)));
                      }}
                      placeholder="₹ Price"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#D6D6D6] bg-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#64748B] block mb-1">Stock Qty *</label>
                    <input
                      type="number"
                      value={c.stock}
                      onChange={(ev) => {
                        const val = ev.target.value;
                        setClothingVariants((list) => list.map((item, i) => (i === idx ? { ...item, stock: val } : item)));
                      }}
                      placeholder="Units"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#D6D6D6] bg-white font-bold"
                    />
                  </div>

                  <div className="flex items-end justify-between gap-1 pt-4 sm:pt-0">
                    <div className="flex-1">
                      <label className="text-[10px] font-bold uppercase text-[#64748B] block mb-1">SKU</label>
                      <input
                        type="text"
                        value={c.sku}
                        onChange={(ev) => {
                          const val = ev.target.value;
                          setClothingVariants((list) => list.map((item, i) => (i === idx ? { ...item, sku: val } : item)));
                        }}
                        placeholder="SKU"
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#D6D6D6] bg-white font-mono"
                      />
                    </div>
                    {clothingVariants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setClothingVariants((list) => list.filter((_, i) => i !== idx))}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg shrink-0"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                setClothingVariants((list) => [
                  ...list,
                  { color: 'Black', colorHex: '#000000', size: 'XL', fabric: '', style: '', price: '', compareAtPrice: '', stock: '', sku: '', barcode: '' },
                ])
              }
              className="text-xs font-bold text-[#0F172A] hover:text-[#C9A227] flex items-center gap-1.5 pt-1"
            >
              <Plus size={14} /> Add Size / Color Variant
            </button>
          </div>
        )}

        {/* VARIANT STRUCTURE D: Footwear (UK Size, EU Size, Color) */}
        {variantType === 'footwear' && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-[#0F172A]">Footwear Size Variants:</p>
            <div className="space-y-3">
              {footwearVariants.map((f, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-[#E7E2D6] bg-[#FAF9F5] grid grid-cols-2 sm:grid-cols-6 gap-2.5 items-center">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#64748B] block mb-1">UK Size</label>
                    <input
                      type="text"
                      value={f.ukSize}
                      onChange={(ev) => {
                        const val = ev.target.value;
                        setFootwearVariants((list) => list.map((item, i) => (i === idx ? { ...item, ukSize: val } : item)));
                      }}
                      placeholder="UK 8"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#D6D6D6] bg-white font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#64748B] block mb-1">Color</label>
                    <input
                      type="text"
                      value={f.color}
                      onChange={(ev) => {
                        const val = ev.target.value;
                        setFootwearVariants((list) => list.map((item, i) => (i === idx ? { ...item, color: val } : item)));
                      }}
                      placeholder="Black"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#D6D6D6] bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#64748B] block mb-1">Selling Price *</label>
                    <input
                      type="number"
                      value={f.price}
                      onChange={(ev) => {
                        const val = ev.target.value;
                        setFootwearVariants((list) => list.map((item, i) => (i === idx ? { ...item, price: val } : item)));
                      }}
                      placeholder="₹ Price"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#D6D6D6] bg-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#64748B] block mb-1">Stock Qty *</label>
                    <input
                      type="number"
                      value={f.stock}
                      onChange={(ev) => {
                        const val = ev.target.value;
                        setFootwearVariants((list) => list.map((item, i) => (i === idx ? { ...item, stock: val } : item)));
                      }}
                      placeholder="Units"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#D6D6D6] bg-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#64748B] block mb-1">SKU</label>
                    <input
                      type="text"
                      value={f.sku}
                      onChange={(ev) => {
                        const val = ev.target.value;
                        setFootwearVariants((list) => list.map((item, i) => (i === idx ? { ...item, sku: val } : item)));
                      }}
                      placeholder="SKU"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#D6D6D6] bg-white font-mono"
                    />
                  </div>

                  <div className="flex items-end justify-end pt-4 sm:pt-0">
                    {footwearVariants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setFootwearVariants((list) => list.filter((_, i) => i !== idx))}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg shrink-0"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                setFootwearVariants((list) => [
                  ...list,
                  { ukSize: 'UK 9', euSize: 'EU 43', color: 'Black', material: 'Mesh / Rubber', price: '', compareAtPrice: '', stock: '', sku: '', barcode: '' },
                ])
              }
              className="text-xs font-bold text-[#0F172A] hover:text-[#C9A227] flex items-center gap-1.5 pt-1"
            >
              <Plus size={14} /> Add Footwear Size Option
            </button>
          </div>
        )}

        {/* VARIANT STRUCTURE E: General */}
        {variantType === 'general' && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-[#0F172A]">Product Options & Pricing:</p>
            <div className="space-y-3">
              {generalVariants.map((g, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-[#E7E2D6] bg-[#FAF9F5] grid grid-cols-2 sm:grid-cols-5 gap-2.5 items-center">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#64748B] block mb-1">Option Name</label>
                    <input
                      type="text"
                      value={g.option}
                      onChange={(ev) => {
                        const val = ev.target.value;
                        setGeneralVariants((list) => list.map((item, i) => (i === idx ? { ...item, option: val } : item)));
                      }}
                      placeholder="Standard"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#D6D6D6] bg-white font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#64748B] block mb-1">Selling Price *</label>
                    <input
                      type="number"
                      value={g.price}
                      onChange={(ev) => {
                        const val = ev.target.value;
                        setGeneralVariants((list) => list.map((item, i) => (i === idx ? { ...item, price: val } : item)));
                      }}
                      placeholder="₹ Price"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#D6D6D6] bg-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#64748B] block mb-1">Stock Qty *</label>
                    <input
                      type="number"
                      value={g.stock}
                      onChange={(ev) => {
                        const val = ev.target.value;
                        setGeneralVariants((list) => list.map((item, i) => (i === idx ? { ...item, stock: val } : item)));
                      }}
                      placeholder="Units"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#D6D6D6] bg-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#64748B] block mb-1">SKU</label>
                    <input
                      type="text"
                      value={g.sku}
                      onChange={(ev) => {
                        const val = ev.target.value;
                        setGeneralVariants((list) => list.map((item, i) => (i === idx ? { ...item, sku: val } : item)));
                      }}
                      placeholder="SKU"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#D6D6D6] bg-white font-mono"
                    />
                  </div>

                  <div className="flex items-end justify-end pt-4 sm:pt-0">
                    {generalVariants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setGeneralVariants((list) => list.filter((_, i) => i !== idx))}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg shrink-0"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                setGeneralVariants((list) => [
                  ...list,
                  { option: 'Option', price: '', compareAtPrice: '', stock: '', sku: '', barcode: '' },
                ])
              }
              className="text-xs font-bold text-[#0F172A] hover:text-[#C9A227] flex items-center gap-1.5 pt-1"
            >
              <Plus size={14} /> Add Product Option
            </button>
          </div>
        )}
      </div>

      {/* SECTION 4: Product Images Upload */}
      <div className="p-6 rounded-2xl bg-white border border-[#E7E2D6] shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E7E2D6]">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-2">
            <Upload size={16} className="text-[#C9A227]" />
            <span>Product Images & Media</span>
          </h2>
          <span className="text-[11px] font-semibold text-[#64748B]">Multi-Angle Photos</span>
        </div>

        {/* Existing uploaded images preview */}
        {images.length > 0 && (
          <div className="flex items-center gap-3 flex-wrap">
            {images.map((img, i) => (
              <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#E7E2D6] group">
                <img src={img} alt={`Product image ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        <label className="border-2 border-dashed border-[#D6D6D6] hover:border-[#0F172A] rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors text-center">
          <Upload className="w-6 h-6 text-[#64748B]" />
          <span className="text-xs font-bold text-[#0F172A]">
            {uploadingImage ? 'Uploading image…' : 'Click to upload product image(s)'}
          </span>
          <span className="text-[11px] text-[#64748B]">PNG, JPG, WEBP up to 5MB</span>
          <input
            type="file"
            multiple
            accept="image/*"
            disabled={uploadingImage}
            onChange={handleImageUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* SECTION 5: Status & Submit Bar */}
      <div className="p-4 rounded-2xl bg-white border border-[#E7E2D6] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <label className="flex items-center gap-2.5 text-xs font-bold text-[#0F172A] cursor-pointer">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
            className="w-4 h-4 rounded accent-[#0F172A]"
          />
          <span>Publish as Active Product Listing</span>
        </label>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 sm:flex-none px-5 py-2.5 text-xs font-bold rounded-xl border border-[#D6D6D6] hover:border-[#0F172A] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 sm:flex-none px-7 py-2.5 text-xs font-bold rounded-xl bg-[#0F172A] text-white hover:bg-[#1E293B] disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Saving Product…</span>
              </>
            ) : isEdit ? (
              'Save Product Changes'
            ) : (
              'Publish Product Listing'
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
