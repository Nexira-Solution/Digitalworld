import mongoose from 'mongoose';
import slugify from 'slugify';
import Product from '@/models/Product';
import Combo from '@/models/Combo';
import { optionLabel } from '@/lib/comboStock';

// True if `admin` may touch this combo: superadmin, or the seller who owns it.
export function ownsCombo(admin, combo) {
  if (admin.role === 'superadmin') return true;
  if (!combo?.seller) return false;
  return String(combo.seller._id || combo.seller) === String(admin.id);
}

const isId = (v) => mongoose.isValidObjectId(v);
const toNumOrNull = (v) => (v === '' || v === null || v === undefined ? null : Number(v));
const ownerOf = (product) => (product.seller ? String(product.seller) : null);

export async function uniqueComboSlug(name) {
  const base = slugify(name, { lower: true, strict: true }) || 'combo';
  let slug = base;
  for (let n = 2; await Combo.exists({ slug }); n++) slug = `${base}-${n}`;
  return slug;
}

// Creates the combo with a unique slug, retrying if two requests race on the same slug.
export async function createCombo(data) {
  let lastErr;
  for (let i = 0; i < 3; i++) {
    const slug = await uniqueComboSlug(data.name);
    try {
      return await Combo.create({ ...data, slug });
    } catch (err) {
      if (err?.code !== 11000) throw err;
      lastErr = err;
    }
  }
  throw lastErr;
}

// Feature 5 Permissions:
// - Admin can create combos using admin-owned products (seller === null)
// - Seller can create combos using only their own products (seller === admin.id)
// - Cross-seller product additions are strictly blocked.
function resolveOwner(admin, products, where) {
  if (admin.role !== 'superadmin') {
    if (products.some((p) => ownerOf(p) !== String(admin.id))) {
      return { error: `Sellers may only create combos from their own products ${where}. Cross-seller products are not permitted.` };
    }
    return { owner: String(admin.id) };
  }

  // Superadmin
  const owners = new Set(products.map(ownerOf));
  if (owners.size > 1) {
    return { error: 'A combo cannot mix products from different suppliers. All items must belong to the same supplier or official platform.' };
  }
  return { owner: [...owners][0] ?? null };
}

// Validates a combo payload and returns { data } ready for Combo.create / set,
// or { error }. Recalculates prices and discounts to prevent client-side manipulation.
export async function buildComboData(body, admin) {
  const rawType = body?.type;
  const isMultipack = rawType === 'color-pack' || rawType === 'multipack';
  const type = isMultipack ? 'color-pack' : 'multi-product';

  const name = String(body?.name || '').trim();
  if (!name) return { error: 'Combo name is required' };
  if (name.length > 120) return { error: 'Combo name is too long (max 120 characters)' };

  const rawImages = Array.isArray(body.images) ? body.images : typeof body.images === 'string' ? [body.images] : [];
  const images = rawImages.map((s) => String(s).trim()).filter(Boolean).slice(0, 10);

  const data = {
    type,
    name,
    sku: String(body.sku || '').trim(),
    description: String(body.description || '').trim(),
    images,
    isActive: body.isActive !== false,
    comboStock: toNumOrNull(body.comboStock),
    seller: null,
    // reset fields of the other type
    products: [],
    comboPrice: 0,
    originalPrice: 0,
    discountType: body.discountType === 'percentage' ? 'percentage' : 'fixed',
    discountValue: Number(body.discountValue) || 0,
    savingsAmount: 0,
    savingsPercentage: 0,
    baseProduct: null,
    colors: [],
    packOptions: [],
    sizeChart: [],
  };

  return isMultipack ? buildColorPack(body, admin, data) : buildBundle(body, admin, data);
}

async function buildBundle(body, admin, data) {
  const rawItems = (Array.isArray(body.products) ? body.products : []).filter((p) => p?.product);
  if (!rawItems.length) return { error: 'Add at least one product to the combo' };
  if (rawItems.length > 20) return { error: 'A combo can have at most 20 product lines' };

  const ids = [...new Set(rawItems.map((i) => String(i.product)))];
  if (!ids.every(isId)) return { error: 'Invalid product selected' };

  const found = await Product.find({ _id: { $in: ids } })
    .populate('category', 'name')
    .select('name seller variants isActive productType brand sku basePrice');
  if (found.length !== ids.length) return { error: 'One or more selected products no longer exist' };
  const byId = new Map(found.map((p) => [String(p._id), p]));

  // Merge duplicate SKU lines so stock is checked / reduced once per SKU.
  const merged = new Map();
  for (const it of rawItems) {
    const p = byId.get(String(it.product));
    if (p.isActive === false) return { error: `"${p.name}" is inactive — remove it or activate it first` };

    if (!it.variantId || !isId(it.variantId)) return { error: `Choose a variant for "${p.name}"` };
    const v = p.variants.id(it.variantId);
    if (!v) return { error: `Selected variant not found on "${p.name}"` };

    const size = String(it.size || '').trim();
    if (!size) return { error: `Choose a ${optionLabel(p.productType).toLowerCase()} for "${p.name}" — stock is tracked per option/size` };
    const sizeObj = v.sizes.find((s) => s.size === size);
    if (!sizeObj) return { error: `${optionLabel(p.productType)} "${size}" not found on "${p.name}"` };

    const qty = Number(it.qty ?? 1);
    if (!Number.isInteger(qty) || qty < 1 || qty > 50) {
      return { error: `Quantity for "${p.name}" must be a whole number from 1 to 50` };
    }

    const unitPrice = Number(sizeObj.sellingPrice || sizeObj.price || v.sellingPrice || v.price || p.basePrice || 0);

    const key = `${p._id}:${v._id}:${size}`;
    const existing = merged.get(key);
    if (existing) {
      existing.qty += qty;
    } else {
      merged.set(key, {
        product: p._id,
        variantId: String(v._id),
        size,
        qty,
        unitPrice,
      });
    }
  }

  const lines = [...merged.values()];
  const totalUnits = lines.reduce((s, l) => s + l.qty, 0);
  if (totalUnits < 2) return { error: 'A combo needs at least 2 items (two products, or one product with quantity 2+)' };

  const { owner, error } = resolveOwner(admin, found, 'in a combo');
  if (error) return { error };

  // Recalculate original items total from verified database prices
  const itemsTotal = lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);
  if (itemsTotal <= 0) return { error: 'Products in combo must have valid prices greater than 0' };

  let comboPrice = Number(body.comboPrice);
  const discountType = body.discountType === 'percentage' ? 'percentage' : 'fixed';
  const discountVal = Number(body.discountValue) || 0;

  // Real-time server-side recalculation of combo pricing & discounts
  if (discountType === 'percentage' && discountVal > 0) {
    if (discountVal >= 100) return { error: 'Discount percentage must be less than 100%' };
    const savings = Math.round(itemsTotal * (discountVal / 100));
    comboPrice = itemsTotal - savings;
  } else if (discountType === 'fixed' && discountVal > 0) {
    comboPrice = itemsTotal - discountVal;
  }

  if (!Number.isFinite(comboPrice) || comboPrice <= 0) {
    return { error: 'Valid combo price greater than ₹0 is required' };
  }

  if (comboPrice >= itemsTotal) {
    return { error: `Combo price (₹${comboPrice}) must be strictly less than individual total prices (₹${itemsTotal}) to offer genuine customer savings.` };
  }

  const savingsAmount = itemsTotal - comboPrice;
  const savingsPercentage = Math.round((savingsAmount / itemsTotal) * 100);

  data.products = lines.map(({ unitPrice, ...line }) => line);
  data.comboPrice = comboPrice;
  data.originalPrice = itemsTotal;
  data.discountType = discountType;
  data.discountValue = discountType === 'percentage' ? discountVal : savingsAmount;
  data.savingsAmount = savingsAmount;
  data.savingsPercentage = savingsPercentage;
  data.seller = owner;

  return { data };
}

async function buildColorPack(body, admin, data) {
  if (!body.baseProduct || !isId(body.baseProduct)) {
    return { error: 'Select the base product for this multipack' };
  }
  const base = await Product.findById(body.baseProduct).select('name seller variants isActive productType');
  if (!base) return { error: 'Base product not found' };
  if (base.isActive === false) return { error: `"${base.name}" is inactive — activate it first` };

  const { owner, error } = resolveOwner(admin, [base], 'as the base');
  if (error) return { error };

  const colors = [];
  const seenNames = new Set();
  for (const c of Array.isArray(body.colors) ? body.colors : []) {
    const cname = String(c.name || '').trim();
    if (!cname) continue;
    if (seenNames.has(cname.toLowerCase())) return { error: `Option "${cname}" is listed twice` };
    seenNames.add(cname.toLowerCase());

    let variantId = String(c.variantId || '');
    let size = String(c.size || '').trim();
    if (variantId) {
      const v = isId(variantId) ? base.variants.id(variantId) : null;
      if (!v) return { error: `Option "${cname}" points to a variant that isn't on ${base.name}` };
      if (!size && v.sizes.length === 1) size = v.sizes[0].size;
      if (size && !v.sizes.some((s) => s.size === size)) {
        return { error: `Size "${size}" for option "${cname}" isn't available on that variant` };
      }
    } else {
      size = '';
    }

    const stock = toNumOrNull(c.stock);
    if (stock !== null && (!Number.isInteger(stock) || stock < 0)) {
      return { error: `Stock for option "${cname}" must be a whole number` };
    }
    if (!variantId && stock === null) {
      return { error: `Option "${cname}" needs a linked variant or a stock number` };
    }

    const hex = /^#[0-9a-f]{6}$/i.test(c.hex || '') ? c.hex : '';
    colors.push({ name: cname, hex, variantId, size, stock });
  }

  const packs = [];
  const seenSizes = new Set();
  for (const p of Array.isArray(body.packOptions) ? body.packOptions : []) {
    if (p.size === '' || p.size === null || p.size === undefined) continue;
    const size = Number(p.size);
    const price = Number(p.price);
    if (!Number.isInteger(size) || size <= 0) return { error: 'Pack size must be a whole number of pieces' };
    if (seenSizes.has(size)) return { error: `Pack of ${size} is listed twice` };
    seenSizes.add(size);
    if (!Number.isFinite(price) || price <= 0) return { error: `Enter a price for the pack of ${size}` };

    const originalPrice = Number(p.originalPrice) || 0;
    if (originalPrice && originalPrice < price) {
      return { error: `Original price for the pack of ${size} must be higher than its price` };
    }
    const stock = toNumOrNull(p.stock);
    if (stock !== null && (!Number.isInteger(stock) || stock < 0)) {
      return { error: `Stock for the pack of ${size} must be a whole number` };
    }
    packs.push({ size, price, originalPrice, stock });
  }
  if (!packs.length && !colors.length) return { error: 'Add at least one pack option or option item' };

  data.baseProduct = base._id;
  data.colors = colors;
  data.packOptions = packs.sort((a, b) => a.size - b.size);

  const isApparel = !base.productType || base.productType === 'apparel' || base.productType === 'clothing';
  data.sizeChart = (isApparel && Array.isArray(body.sizeChart) ? body.sizeChart : [])
    .filter((r) => String(r.size || '').trim())
    .map((r) => ({
      size: String(r.size).trim(),
      chest: String(r.chest || ''),
      waist: String(r.waist || ''),
      length: String(r.length || ''),
    }));
  data.seller = owner;
  return { data };
}
