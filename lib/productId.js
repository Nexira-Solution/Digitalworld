import Counter from '@/models/Counter';
import Category from '@/models/Category';

const CATEGORY_PREFIX_MAP = {
  electronics: 'ELE',
  mobiles: 'MOB',
  mobile: 'MOB',
  laptops: 'LAP',
  laptop: 'LAP',
  clothing: 'CLO',
  clothes: 'CLO',
  apparel: 'CLO',
  snacks: 'SNK',
  snack: 'SNK',
  chocolates: 'CHO',
  chocolate: 'CHO',
  sweets: 'SWT',
  sweet: 'SWT',
  groceries: 'GRO',
  grocery: 'GRO',
  vegetables: 'VEG',
  vegetable: 'VEG',
  fruits: 'FRT',
  fruit: 'FRT',
  footwear: 'FTW',
  shoes: 'FTW',
  other: 'PRD',
  general: 'PRD',
};

/**
 * Resolves the uppercase 3-letter prefix for a given category/subcategory name or slug.
 */
export function resolveCategoryPrefix(catNameOrSlug = '') {
  if (!catNameOrSlug) return 'PRD';
  const clean = String(catNameOrSlug).toLowerCase().replace(/[^a-z0-9]/g, '');

  for (const [key, prefix] of Object.entries(CATEGORY_PREFIX_MAP)) {
    if (clean.includes(key)) return prefix;
  }

  // Fallback: take first 3 letters uppercase or PRD
  const letters = clean.replace(/[^a-z]/g, '').slice(0, 3).toUpperCase();
  return letters.length === 3 ? letters : 'PRD';
}

/**
 * Given a Category document or category ID, finds its prefix (checking subcategory first if provided).
 */
export async function getPrefixForCategory(categoryId, subcategoryId = null) {
  if (subcategoryId) {
    const sub = await Category.findById(subcategoryId).lean();
    if (sub) {
      const subPrefix = resolveCategoryPrefix(sub.slug || sub.name);
      if (subPrefix !== 'PRD') return subPrefix;
    }
  }

  if (categoryId) {
    const cat = await Category.findById(categoryId).lean();
    if (cat) {
      return resolveCategoryPrefix(cat.slug || cat.name);
    }
  }

  return 'PRD';
}

/**
 * Atomically increments the counter and generates the confirmed unique Product ID.
 * e.g. "ELE-00001"
 */
export async function getNextProductId(prefix = 'PRD') {
  const counterId = `PID_${prefix.toUpperCase()}`;
  const counter = await Counter.findByIdAndUpdate(
    counterId,
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  const numStr = String(counter.seq).padStart(5, '0');
  return `${prefix.toUpperCase()}-${numStr}`;
}

/**
 * Read-only peek of what the next Product ID will be (without incrementing).
 * Used for previewing in the Add Product form.
 */
export async function peekNextProductId(prefix = 'PRD') {
  const counterId = `PID_${prefix.toUpperCase()}`;
  const counter = await Counter.findById(counterId).lean();
  const nextSeq = (counter?.seq || 0) + 1;
  const numStr = String(nextSeq).padStart(5, '0');
  return `${prefix.toUpperCase()}-${numStr}`;
}
