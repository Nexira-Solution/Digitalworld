'use client';

import UnifiedProductForm from '@/components/product/UnifiedProductForm';

/**
 * Requirement 03: Unified Admin & Seller Add Product Form
 * Uses the exact same component for identical layout, field ordering,
 * category-specific variants, and strict validation.
 */
export default function SellerProductForm(props) {
  return <UnifiedProductForm mode="seller" {...props} />;
}
