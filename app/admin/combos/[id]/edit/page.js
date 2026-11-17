'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ComboForm from '@/components/combo/ComboForm';

export default function AdminEditComboPage() {
  const { id } = useParams();
  const router = useRouter();
  const [combo, setCombo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    fetch(`/api/combos/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.combo) setCombo(d.combo);
        else setError(d.error || 'Failed to load combo details');
      })
      .catch(() => setError('Network error loading combo'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-sm text-[#64748B]">
        Loading combo details…
      </div>
    );
  }

  if (error || !combo) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center space-y-4">
        <p className="text-sm text-red-600 font-medium">{error || 'Combo not found'}</p>
        <Link href="/admin/combos" className="text-xs font-bold underline text-[#0F172A]">
          ← Back to Manage Combos
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#E7E2D6]">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-wider text-[#0F172A]">
            Edit Combo Offer
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Update pricing, items, discounts, or stock for {combo.name}.
          </p>
        </div>
        <Link
          href="/admin/combos"
          className="text-xs font-semibold px-4 py-2 border border-[#E7E2D6] rounded-xl hover:bg-neutral-50 transition-colors text-[#0F172A]"
        >
          ← Manage Combos
        </Link>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-[#E7E2D6] shadow-2xs">
        <ComboForm
          mode="admin"
          comboId={id}
          initialCombo={combo}
          onSaved={() => {
            router.push('/admin/combos');
            router.refresh();
          }}
          onCancel={() => router.push('/admin/combos')}
        />
      </div>
    </div>
  );
}
