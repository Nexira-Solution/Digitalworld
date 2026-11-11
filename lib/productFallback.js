/**
 * Dynamic Product Utilities for Storefront & Product Cards
 * Pure real-time MongoDB data mapping with zero dummy data dependencies.
 */

export function calculateDiscount(sellingPrice, originalPrice) {
  if (!originalPrice || originalPrice <= sellingPrice || originalPrice <= 0) return 0;
  return Math.round(((originalPrice - sellingPrice) / originalPrice) * 100);
}

export function calculateSavings(sellingPrice, originalPrice) {
  if (!originalPrice || originalPrice <= sellingPrice) return 0;
  return Math.max(0, originalPrice - sellingPrice);
}

export function getProductStockStatus(stock, threshold = 5) {
  const numStock = Number(stock) || 0;
  if (numStock <= 0) {
    return {
      status: 'out',
      label: 'Out of Stock',
      isLow: false,
      isOut: true,
      shouldShow: true,
    };
  }
  // Show stock warning ONLY when stock is strictly less than 5
  if (numStock < threshold) {
    return {
      status: 'low',
      label: numStock === 1 ? 'Only 1 Pack Left' : `Only ${numStock} Packs Left`,
      isLow: true,
      isOut: false,
      shouldShow: true,
    };
  }
  // When stock is 5 or more, do not show any stock indicator
  return {
    status: 'normal',
    label: '',
    isLow: false,
    isOut: false,
    shouldShow: false,
  };
}

export function getDisplayProductData(product, index = 0) {
  if (!product) {
    return {
      id: `empty-${index}`,
      slug: '',
      name: '',
      image: '/images/placeholder.svg',
      description: '',
      packs: [{ size: 'Standard', price: 0, originalPrice: 0, stock: 0 }],
      rating: 0,
      reviewCount: 0,
      isBestSeller: false,
      offers: [],
      rawProduct: null,
    };
  }

  const variant = product.variants?.[0];
  const backendImage =
    variant?.images?.[0] ||
    product.images?.[0] ||
    product.image;

  const image = backendImage && typeof backendImage === 'string' && backendImage.trim()
    ? backendImage
    : '/images/placeholder.svg';

  const name = product.name || 'Product';
  const description = product.description || '';

  // Determine pack sizes from real variant sizes
  const backendSizes = variant?.sizes || [];
  let packs = [];
  if (backendSizes.length > 0) {
    packs = backendSizes.map((s) => {
      const price =
        s.price !== undefined && s.price !== null && Number(s.price) > 0
          ? Number(s.price)
          : Number(variant?.price || product.basePrice || 0);
      const originalPrice =
        s.compareAtPrice !== undefined && s.compareAtPrice !== null && Number(s.compareAtPrice) > 0
          ? Number(s.compareAtPrice)
          : Number(variant?.compareAtPrice || 0);
      return {
        size: s.size || 'Standard',
        stock: s.stock ?? 0,
        price,
        originalPrice: originalPrice > 0 ? originalPrice : price,
        sku: s.sku || '',
      };
    });
  } else {
    const price = Number(variant?.price || product.basePrice || 0);
    const originalPrice = Number(variant?.compareAtPrice || 0);
    packs = [
      {
        size: 'Standard',
        stock: Number(variant?.sizes?.[0]?.stock ?? (product.stock ?? 0)),
        price,
        originalPrice: originalPrice > 0 ? originalPrice : price,
        sku: product.sku || '',
      },
    ];
  }

  const rating = Number(product.rating || 0);
  const reviewCount = Number(product.numReviews || product.reviewCount || 0);
  const isBestSeller = Boolean(product.isBestSeller);
  const offers = Array.isArray(product.offers) ? product.offers : [];

  return {
    id: product._id || product.id || `prod-${index}`,
    slug: product.slug || (name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : ''),
    name,
    image,
    description,
    packs,
    rating,
    reviewCount,
    isBestSeller,
    offers,
    rawProduct: product,
  };
}
