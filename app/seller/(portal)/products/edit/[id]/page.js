'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProductForm from '@/components/seller/ProductForm';

const INK = '#000000';
const INK_SOFT = '#6B6B6B';
const RED = '#B3261E';
const PAPER = '#FFFFFF';

export default function EditProductByIdPage() {
  const params = useParams();
  const id = params?.id;
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`/api/seller/products/${id}`);
        if (res.status === 401) {
          router.push('/seller/login');
          return;
        }
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Failed to load product.');
          setLoading(false);
          return;
        }
        setProduct(data.product);
        setLoading(false);
      } catch {
        setError('Network error loading product details.');
        setLoading(false);
      }
    })();
  }, [id, router]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10" style={{ color: INK_SOFT }}>
        Loading product details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="px-4 py-3 text-[13px] rounded" style={{ background: '#FCE8E6', color: RED }}>
          {error}
        </div>
        <a
          href="/seller/products"
          className="inline-block mt-4 text-xs font-semibold underline"
          style={{ color: INK }}
        >
          ← Back to Products
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10" style={{ background: PAPER }}>
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#E8E8E8]">
        <div>
          <h1 className="text-xl font-bold tracking-tight uppercase" style={{ color: INK }}>
            Edit Product
          </h1>
          <p className="text-xs text-[#6B6B6B] mt-1">
            Updating: <span className="font-semibold text-black">{product?.name}</span> (SKU: {product?.sku})
          </p>
        </div>
        <a
          href="/seller/products"
          className="text-xs font-semibold px-4 py-2 border border-[#E8E8E8] rounded hover:bg-neutral-50 transition-colors"
          style={{ color: INK }}
        >
          ← Back to Products
        </a>
      </div>
      <ProductForm productId={id} initialProduct={product} />
    </div>
  );
}

