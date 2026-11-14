import Link from 'next/link';
import ProductForm from '@/components/seller/ProductForm';

const INK = '#000000';
const PAPER = '#FFFFFF';

export default function AddSellerProductPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10" style={{ background: PAPER }}>
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#E8E8E8]">
        <div>
          <h1 className="text-xl font-bold tracking-tight uppercase" style={{ color: INK }}>
            Add New Product
          </h1>
          <p className="text-xs text-[#6B6B6B] mt-1">
            Create a new product listing with variants, pricing and pack sizes.
          </p>
        </div>
        <Link
          href="/seller/products"
          className="text-xs font-semibold px-4 py-2 border border-[#E8E8E8] rounded hover:bg-neutral-50 transition-colors"
          style={{ color: INK }}
        >
          ← Back to Products
        </Link>
      </div>
      <ProductForm />
    </div>
  );
}

