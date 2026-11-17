// Single source of truth for "what kind of product is this?".
// Used by the forms (what to render) AND the API routes (what to validate/keep).

export const PRODUCT_TYPES = {
  apparel: {
    label: 'Apparel / Dresses',
    hasColor: true,
    showFabric: true,
    showSizeChart: true,
    showSleeveZip: true,
    showAddons: true,
    sizeLabel: 'Sizes & Stock',
    sizePlaceholder: 'Size (e.g. M, 38, Free Size)',
    defaultSize: '',
    fields: [],
    specs: false,
  },
  clothing: {
    label: 'Clothing & Apparel',
    hasColor: true,
    showFabric: true,
    showSizeChart: true,
    showSleeveZip: false,
    showAddons: false,
    sizeLabel: 'Sizes & Stock',
    sizePlaceholder: 'Size (e.g. S, M, L, XL, 32, Free Size)',
    defaultSize: 'Free Size',
    fields: [
      { key: 'brand', label: 'Brand', required: false },
      { key: 'gender', label: 'Gender', type: 'select', options: ['Men', 'Women', 'Kids', 'Unisex'], required: false },
      { key: 'fabric', label: 'Fabric / Material', required: false },
      { key: 'size', label: 'Primary Size', required: false },
      { key: 'availableSizes', label: 'Available Sizes (e.g. S, M, L, XL)', required: false },
      { key: 'color', label: 'Color', required: false },
      { key: 'pattern', label: 'Pattern', type: 'select', options: ['Solid', 'Printed', 'Striped', 'Checked', 'Embroidered', 'Self Design'], required: false },
      { key: 'fitType', label: 'Fit Type', type: 'select', options: ['Regular Fit', 'Slim Fit', 'Loose Fit', 'Relaxed Fit', 'Tailored Fit'], required: false },
      { key: 'washCare', label: 'Wash Care Instructions', required: false },
    ],
    specs: true,
  },
  electronics: {
    label: 'Electronics',
    hasColor: true,
    showFabric: false,
    showSizeChart: false,
    showSleeveZip: false,
    showAddons: false,
    sizeLabel: 'Configurations & Stock',
    sizePlaceholder: 'Option (e.g. 8GB/128GB, 65W, Standard)',
    defaultSize: 'Standard',
    fields: [
      { key: 'brand', label: 'Brand', required: true },
      { key: 'modelNumber', label: 'Model Number' },
      { key: 'warranty', label: 'Warranty (e.g. 1 Year Manufacturer Warranty)' },
      { key: 'condition', label: 'Condition', type: 'select', options: ['Brand New', 'Refurbished', 'Open Box'], required: false },
      { key: 'color', label: 'Color' },
      { key: 'powerRequirements', label: 'Power Requirements (e.g. 230V / 50Hz, 65W)' },
      { key: 'countryOfOrigin', label: 'Country of Origin' },
      { key: 'technicalSpecifications', label: 'Technical Specifications', type: 'textarea' },
    ],
    specs: true,
  },
  food: {
    label: 'Food & Snacks',
    hasColor: false,
    showFabric: false,
    showSizeChart: false,
    showSleeveZip: false,
    showAddons: false,
    sizeLabel: 'Pack sizes & Stock',
    sizePlaceholder: 'Pack (e.g. 250g, 500g, 1kg, Box of 6)',
    defaultSize: 'Standard',
    fields: [
      { key: 'brand', label: 'Brand' },
      { key: 'foodType', label: 'Food type', type: 'select', options: ['Veg', 'Non-Veg', 'Vegan'], required: true },
      { key: 'netWeight', label: 'Net Weight (e.g. 250g, 1kg)' },
      { key: 'flavour', label: 'Flavour' },
      { key: 'ingredients', label: 'Ingredients', type: 'textarea' },
      { key: 'allergens', label: 'Allergen Information (e.g. nuts, gluten)' },
      { key: 'shelfLife', label: 'Shelf Life (e.g. 6 Months)' },
      { key: 'manufacturingDate', label: 'Manufacturing Date (DD/MM/YYYY)' },
      { key: 'expiryDate', label: 'Expiry Date (DD/MM/YYYY)' },
      { key: 'storage', label: 'Storage instructions' },
      { key: 'fssaiLicense', label: 'FSSAI License Number (14 digits)', required: true },
    ],
    specs: true,
  },
  snacks: {
    label: 'Snacks & Savouries',
    hasColor: false,
    showFabric: false,
    showSizeChart: false,
    showSleeveZip: false,
    showAddons: false,
    sizeLabel: 'Pack sizes & Stock',
    sizePlaceholder: 'Pack (e.g. 100g, 250g, 500g, 1kg)',
    defaultSize: 'Standard',
    fields: [
      { key: 'brand', label: 'Brand', required: true },
      { key: 'ingredients', label: 'Ingredients', type: 'textarea' },
      { key: 'netWeight', label: 'Net Weight (e.g. 250g, 500g, 1kg)', required: true },
      { key: 'flavour', label: 'Flavour' },
      { key: 'foodType', label: 'Vegetarian / Non-Vegetarian', type: 'select', options: ['Vegetarian', 'Non-Vegetarian', 'Vegan'], required: true },
      { key: 'allergens', label: 'Allergen Information' },
      { key: 'shelfLife', label: 'Shelf Life' },
      { key: 'manufacturingDate', label: 'Manufacturing Date (DD/MM/YYYY)' },
      { key: 'expiryDate', label: 'Expiry Date (DD/MM/YYYY)' },
      { key: 'storage', label: 'Storage Instructions' },
      { key: 'fssaiLicense', label: 'FSSAI License Number (14 digits)', required: true },
    ],
    specs: true,
  },
  sweets: {
    label: 'Sweets & Confectionery',
    hasColor: false,
    showFabric: false,
    showSizeChart: false,
    showSleeveZip: false,
    showAddons: false,
    sizeLabel: 'Pack sizes & Stock',
    sizePlaceholder: 'Pack (e.g. 250g, 500g, 1kg, Gift Box)',
    defaultSize: 'Standard',
    fields: [
      { key: 'ingredients', label: 'Ingredients', type: 'textarea', required: true },
      { key: 'netWeight', label: 'Net Weight (e.g. 250g, 500g, 1kg)', required: true },
      { key: 'sweetType', label: 'Sweet Type', type: 'select', options: ['Traditional Sweets', 'Milk Sweets', 'Laddu', 'Halwa', 'Mysore Pak', 'Festival Sweets', 'Dry Fruit Sweets', 'Gift Boxes'], required: false },
      { key: 'shelfLife', label: 'Shelf Life (e.g. 15 Days)' },
      { key: 'manufacturingDate', label: 'Manufacturing Date (DD/MM/YYYY)' },
      { key: 'expiryDate', label: 'Expiry Date (DD/MM/YYYY)' },
      { key: 'storage', label: 'Storage Instructions' },
      { key: 'fssaiLicense', label: 'FSSAI License Number (14 digits)', required: true },
    ],
    specs: true,
  },
  groceries: {
    label: 'Groceries & Essentials',
    hasColor: false,
    showFabric: false,
    showSizeChart: false,
    showSleeveZip: false,
    showAddons: false,
    sizeLabel: 'Pack sizes & Stock',
    sizePlaceholder: 'Pack (e.g. 500g, 1kg, 5kg, 1L)',
    defaultSize: 'Standard',
    fields: [
      { key: 'brand', label: 'Brand', required: true },
      { key: 'netWeight', label: 'Net Weight / Volume', required: true },
      { key: 'packagingType', label: 'Packaging Type', type: 'select', options: ['Pouch', 'Bottle', 'Box', 'Tin', 'Bag', 'Vacuum Pack'], required: false },
      { key: 'ingredients', label: 'Ingredients', type: 'textarea' },
      { key: 'manufacturingDate', label: 'Manufacturing Date (DD/MM/YYYY)' },
      { key: 'expiryDate', label: 'Expiry Date (DD/MM/YYYY)' },
      { key: 'countryOfOrigin', label: 'Country of Origin' },
      { key: 'fssaiLicense', label: 'FSSAI License Number (14 digits)', required: false },
    ],
    specs: true,
  },
  vegetables: {
    label: 'Fresh Vegetables',
    hasColor: false,
    showFabric: false,
    showSizeChart: false,
    showSleeveZip: false,
    showAddons: false,
    sizeLabel: 'Weight / Quantity & Stock',
    sizePlaceholder: 'Unit (e.g. 500g, 1kg, 1 bunch)',
    defaultSize: '1 kg',
    fields: [
      { key: 'productType', label: 'Product Type', type: 'select', options: ['Leafy Vegetables', 'Root Vegetables', 'Fresh Vegetables', 'Organic Vegetables'], required: true },
      { key: 'weightQuantity', label: 'Weight / Quantity', required: true },
      { key: 'freshness', label: 'Freshness', type: 'select', options: ['Farm Fresh (Harvested Today)', 'Fresh Crisp', 'Naturally Ripened'], required: false },
      { key: 'organicStatus', label: 'Organic Status', type: 'select', options: ['100% Certified Organic', 'Naturally Grown', 'Conventional'], required: false },
      { key: 'origin', label: 'Origin (e.g. Local Farms / Ooty)', required: false },
      { key: 'harvestDate', label: 'Harvest Date (DD/MM/YYYY)', required: false },
      { key: 'storage', label: 'Storage Instructions', required: false },
    ],
    specs: true,
  },
  fruits: {
    label: 'Fresh & Seasonal Fruits',
    hasColor: false,
    showFabric: false,
    showSizeChart: false,
    showSleeveZip: false,
    showAddons: false,
    sizeLabel: 'Weight / Quantity & Stock',
    sizePlaceholder: 'Unit (e.g. 500g, 1kg, Box of 6)',
    defaultSize: '1 kg',
    fields: [
      { key: 'fruitType', label: 'Fruit Type', type: 'select', options: ['Fresh Fruits', 'Seasonal Fruits', 'Dry Fruits', 'Organic Fruits'], required: true },
      { key: 'weightQuantity', label: 'Weight / Quantity', required: true },
      { key: 'freshness', label: 'Freshness', type: 'select', options: ['Farm Fresh', 'Tree Ripened', 'Premium Grade'], required: false },
      { key: 'organicStatus', label: 'Organic Status', type: 'select', options: ['100% Certified Organic', 'Naturally Grown', 'Conventional'], required: false },
      { key: 'origin', label: 'Origin (e.g. Kashmir / Shimla / Local)', required: false },
      { key: 'harvestDate', label: 'Harvest Date (DD/MM/YYYY)', required: false },
      { key: 'storage', label: 'Storage Instructions', required: false },
    ],
    specs: true,
  },
  other: {
    label: 'Other / General Products',
    hasColor: true,
    showFabric: false,
    showSizeChart: false,
    showSleeveZip: false,
    showAddons: false,
    sizeLabel: 'Options & Stock',
    sizePlaceholder: 'Option (e.g. Standard, Pack of 1)',
    defaultSize: 'Standard',
    fields: [
      { key: 'brand', label: 'Brand' },
      { key: 'modelNumber', label: 'Model / Type' },
      { key: 'countryOfOrigin', label: 'Country of Origin' },
      { key: 'technicalSpecifications', label: 'Usage / Specifications', type: 'textarea' },
    ],
    specs: true,
  },
  general: {
    label: 'General',
    hasColor: true,
    showFabric: false,
    showSizeChart: false,
    showSleeveZip: false,
    showAddons: false,
    sizeLabel: 'Options & Stock',
    sizePlaceholder: 'Option (e.g. Small, 500ml)',
    defaultSize: 'Standard',
    fields: [{ key: 'brand', label: 'Brand' }],
    specs: true,
  },
};

export const PRODUCT_TYPE_KEYS = Object.keys(PRODUCT_TYPES);

/**
 * Normalizes category / subcategory strings to match field configurations.
 */
function norm(str) {
  return String(str || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
}

/**
 * Returns dynamic conditional fields based on Category and Subcategory.
 * Supports specialized templates for Mobiles, Laptops, Chocolates, etc.
 */
export function getCategorySpecificFields(catName, subcatName, customAttributes = []) {
  const c = norm(catName);
  const s = norm(subcatName);

  // 1. Electronics Specializations
  if (c.includes('electronic')) {
    if (s.includes('mobile') || s.includes('phone') || s.includes('smartphone')) {
      return [
        { key: 'brand', label: 'Brand', required: true },
        { key: 'model', label: 'Model Name / Number', required: true },
        { key: 'ram', label: 'RAM', type: 'select', options: ['4 GB', '6 GB', '8 GB', '12 GB', '16 GB'], required: false },
        { key: 'storage', label: 'Storage Capacity', type: 'select', options: ['64 GB', '128 GB', '256 GB', '512 GB', '1 TB'], required: false },
        { key: 'processor', label: 'Processor', required: false },
        { key: 'batteryCapacity', label: 'Battery Capacity (e.g. 5000 mAh)', required: false },
        { key: 'screenSize', label: 'Screen Size (e.g. 6.7 inch AMOLED)', required: false },
        { key: 'operatingSystem', label: 'Operating System', type: 'select', options: ['Android', 'iOS', 'Other'], required: false },
        { key: 'color', label: 'Color', required: false },
        { key: 'warranty', label: 'Warranty (e.g. 1 Year Brand Warranty)', required: false },
      ];
    }
    if (s.includes('laptop') || s.includes('notebook')) {
      return [
        { key: 'brand', label: 'Brand', required: true },
        { key: 'processor', label: 'Processor', required: true },
        { key: 'ram', label: 'RAM', type: 'select', options: ['8 GB', '16 GB', '32 GB', '64 GB'], required: false },
        { key: 'storage', label: 'Storage', type: 'select', options: ['512 GB SSD', '1 TB SSD', '2 TB SSD'], required: false },
        { key: 'graphicsCard', label: 'Graphics Card', required: false },
        { key: 'screenSize', label: 'Screen Size (e.g. 15.6 inch FHD)', required: false },
        { key: 'operatingSystem', label: 'Operating System', type: 'select', options: ['Windows 11', 'macOS', 'Linux', 'DOS'], required: false },
        { key: 'warranty', label: 'Warranty', required: false },
      ];
    }
    return PRODUCT_TYPES.electronics.fields;
  }

  // 2. Snacks Specializations (Chocolates)
  if (c.includes('snack') || c.includes('chocolate')) {
    if (s.includes('chocolate')) {
      return [
        { key: 'brand', label: 'Brand', required: true },
        { key: 'chocolateType', label: 'Chocolate Type', type: 'select', options: ['Dark Chocolate', 'Milk Chocolate', 'White Chocolate', 'Semi-Sweet', 'Artisanal Truffle'], required: false },
        { key: 'flavour', label: 'Flavour' },
        { key: 'cocoaPercentage', label: 'Cocoa Percentage (e.g. 70%)' },
        { key: 'netWeight', label: 'Net Weight (e.g. 100g, 200g)', required: true },
        { key: 'ingredients', label: 'Ingredients', type: 'textarea' },
        { key: 'allergens', label: 'Allergen Information' },
        { key: 'expiryDate', label: 'Expiry Date (DD/MM/YYYY)' },
        { key: 'storage', label: 'Storage Instructions' },
        { key: 'fssaiLicense', label: 'FSSAI License Number (14 digits)', required: true },
      ];
    }
    return PRODUCT_TYPES.snacks.fields;
  }

  // 3. Clothing / Apparel
  if (c.includes('cloth') || c.includes('apparel') || c.includes('fashion') || c.includes('wear')) {
    return PRODUCT_TYPES.clothing.fields;
  }

  // 4. Sweets
  if (c.includes('sweet')) {
    return PRODUCT_TYPES.sweets.fields;
  }

  // 5. Groceries
  if (c.includes('grocer') || c.includes('staple')) {
    return PRODUCT_TYPES.groceries.fields;
  }

  // 6. Vegetables
  if (c.includes('veg')) {
    return PRODUCT_TYPES.vegetables.fields;
  }

  // 7. Fruits
  if (c.includes('fruit')) {
    return PRODUCT_TYPES.fruits.fields;
  }

  // 8. Other / General
  const baseType = getType(c);
  return baseType.fields.length ? baseType.fields : PRODUCT_TYPES.other.fields;
}

export function getType(key) {
  const k = String(key || '').toLowerCase().trim();
  if (PRODUCT_TYPES[k]) return PRODUCT_TYPES[k];
  if (k.includes('cloth') || k.includes('apparel')) return PRODUCT_TYPES.clothing;
  if (k.includes('electronic')) return PRODUCT_TYPES.electronics;
  if (k.includes('snack')) return PRODUCT_TYPES.snacks;
  if (k.includes('sweet')) return PRODUCT_TYPES.sweets;
  if (k.includes('grocer')) return PRODUCT_TYPES.groceries;
  if (k.includes('veg')) return PRODUCT_TYPES.vegetables;
  if (k.includes('fruit')) return PRODUCT_TYPES.fruits;
  if (k.includes('food')) return PRODUCT_TYPES.food;
  return PRODUCT_TYPES.general;
}

// Server-side: resolve a category's product type
export function resolveProductType(cat) {
  const rawType = cat?.productType || cat?.parent?.productType;
  if (rawType && PRODUCT_TYPES[rawType]) return rawType;
  const name = cat?.name || cat?.parent?.name || '';
  const n = norm(name);
  if (n.includes('cloth') || n.includes('apparel')) return 'clothing';
  if (n.includes('electronic')) return 'electronics';
  if (n.includes('snack')) return 'snacks';
  if (n.includes('sweet')) return 'sweets';
  if (n.includes('grocer')) return 'groceries';
  if (n.includes('veg')) return 'vegetables';
  if (n.includes('fruit')) return 'fruits';
  if (n.includes('food')) return 'food';
  return 'general';
}

// FSSAI 14-digit validator (Indian Food Safety and Standards Authority of India)
export function isValidFSSAI(num) {
  if (!num) return false;
  const clean = String(num).replace(/\D/g, '');
  return /^[0-9]{14}$/.test(clean);
}

// Server-side: drop fields that don't belong to this type, normalize variants,
// validate required attributes including FSSAI for food products. Returns { body } or { error }.
export function sanitizeByType(body, typeKey, categoryDoc = null, subcategoryDoc = null) {
  const t = getType(typeKey);
  const out = { ...body, productType: typeKey };

  if (!t.showSleeveZip) { out.sleeveOptions = []; out.zipOptions = []; }
  if (!t.showAddons) { out.pantOptions = []; out.shawlOptions = []; }
  if (!t.showFabric) out.fabric = '';
  if (!t.showSizeChart) out.sizeChart = [];

  if (Array.isArray(out.variants)) {
    for (const v of out.variants) {
      if (!Number.isFinite(Number(v.price)) || Number(v.price) <= 0) {
        return { error: 'Every variant needs a price greater than 0' };
      }
    }
    out.variants = out.variants.map((v) => {
      const vPrice = Number(v.price) || 0;
      const vCompare = Number(v.compareAtPrice) || 0;
      const vDiscount = vCompare > vPrice ? Math.round(((vCompare - vPrice) / vCompare) * 100) : 0;

      let sizes = (v.sizes || [])
        .map((s) => {
          const sPrice = s.price !== undefined && s.price !== '' ? Number(s.price) : vPrice;
          const sCompare = s.compareAtPrice !== undefined && s.compareAtPrice !== '' ? Number(s.compareAtPrice) : vCompare;
          const sDiscount = sCompare > sPrice ? Math.round(((sCompare - sPrice) / sCompare) * 100) : 0;
          return {
            ...s,
            size: String(s.size || '').trim(),
            stock: Number(s.stock) || 0,
            price: sPrice,
            compareAtPrice: sCompare,
            discountPercentage: sDiscount,
          };
        })
        .filter((s) => s.size);
      if (!sizes.length && t.defaultSize) {
        sizes = [
          {
            size: t.defaultSize,
            stock: Number(v.sizes?.[0]?.stock) || 0,
            price: vPrice,
            compareAtPrice: vCompare,
            discountPercentage: vDiscount,
          },
        ];
      }
      return {
        ...v,
        price: vPrice,
        compareAtPrice: vCompare,
        discountPercentage: vDiscount,
        ...(t.hasColor ? {} : { color: '', colorHex: '#000000' }),
        sizes,
      };
    });
    if (out.variants.some((v) => v.sizes.length === 0)) {
      return { error: `Each variant needs at least one entry under "${t.sizeLabel.replace(' & Stock', '')}"` };
    }
  }

  // Resolve dynamic field list based on category and subcategory
  const catName = categoryDoc?.name || body.categoryName || '';
  const subcatName = subcategoryDoc?.name || body.subcategoryName || '';
  const dynamicFields = getCategorySpecificFields(catName, subcatName);
  const customAttrs = Array.isArray(categoryDoc?.customAttributes) ? categoryDoc.customAttributes : [];
  const allFields = [...dynamicFields, ...customAttrs];

  const attrs = {};
  for (const f of allFields) {
    const raw = body.attributes?.[f.key];
    const val = raw === undefined || raw === null ? '' : String(raw).trim();
    if (f.required && !val) {
      return { error: `${f.label} is required for this product category.` };
    }
    if (f.type === 'select' && val && f.options?.length && !f.options.includes(val)) {
      return { error: `Invalid ${f.label}` };
    }
    if (val) attrs[f.key] = val;
  }

  // Strong FSSAI 14-digit validation for food categories (Snacks, Sweets, Groceries, Food)
  const isFoodCategory = ['food', 'snacks', 'sweets'].includes(typeKey) ||
    norm(catName).includes('snack') ||
    norm(catName).includes('sweet') ||
    norm(catName).includes('food');

  if (isFoodCategory && attrs.fssaiLicense) {
    if (!isValidFSSAI(attrs.fssaiLicense)) {
      return { error: 'FSSAI License Number must be a valid 14-digit registration number.' };
    }
  }

  out.attributes = attrs;

  out.specs = t.specs
    ? (Array.isArray(body.specs) ? body.specs : [])
        .map((s) => ({ key: String(s.key || '').trim(), value: String(s.value || '').trim() }))
        .filter((s) => s.key && s.value)
    : [];

  out.isBestSeller = Boolean(body.isBestSeller);
  out.subcategory = body.subcategory || null;
  out.barcode = body.barcode ? String(body.barcode).trim() : '';
  if (body.isActive !== undefined) out.isActive = Boolean(body.isActive);
  out.offers = Array.isArray(body.offers)
    ? body.offers.map((s) => String(s).trim()).filter(Boolean)
    : typeof body.offers === 'string'
    ? body.offers.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  out.trustBadges = Array.isArray(body.trustBadges)
    ? body.trustBadges
        .map((b) => ({
          title: String(b.title || '').trim(),
          subtitle: String(b.subtitle || '').trim(),
          icon: String(b.icon || 'Leaf').trim(),
        }))
        .filter((b) => b.title)
    : [];

  if (body.deliveryInfo) {
    out.deliveryInfo = {
      estimatedDays: Number(body.deliveryInfo.estimatedDays) || 2,
      dispatchDays: String(body.deliveryInfo.dispatchDays || '1-2 Days'),
      freeDeliveryAbove: Number(body.deliveryInfo.freeDeliveryAbove) || undefined,
    };
  }

  return { body: out };
}
