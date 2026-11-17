'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Plus, Trash2, X, Pencil, Eye, EyeOff, Layers, ExternalLink } from 'lucide-react';
import ComboForm from '@/components/combo/ComboForm';

function stockLabel(c) {
  const s = c.stockInfo;
  if (!s) return null;
  if (!s.inStock) return { text: 'Out of stock', bad: true };
  if (s.available === null) return { text: 'In stock', bad: false };
  return { text: `${s.available} available`, bad: s.available <= 3 };
}

export default function AdminCombosPage() {
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null); // combo being edited, or null for "new"

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/combos?all=true');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load combos');
      setCombos(data.combos || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() { setEditing(null); setShowForm(true); }
  function openEdit(combo) { setEditing(combo); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function closeForm() { setShowForm(false); setEditing(null); }

  function onSaved() {
    toast.success(editing ? 'Combo updated' : 'Combo created');
    closeForm();
    load();
  }

  async function remove(id) {
    if (!confirm('Delete this combo? This cannot be undone.')) return;
    const res = await fetch(`/api/combos/${id}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error(data.error || 'Failed to delete');
    toast.success('Combo deleted');
    load();
  }

  async function toggleActive(c) {
    const res = await fetch(`/api/combos/${c._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !c.isActive }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error(data.error || 'Failed to update');
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E2D6]">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-2">
            <Layers size={20} className="text-[#C9A227]" />
            <span>Manage Combo Offers</span>
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Publish, edit, and organize marketplace bundles and multipacks across all categories.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/combos/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#0F172A] text-white hover:bg-[#1E293B] shadow-2xs transition-all"
          >
            <Plus size={15} /> Add Combo
          </Link>
        </div>
      </div>

      {showForm && (
        <div className="card-soft p-5 mb-6">
          <div className="flex justify-between mb-4">
            <h2 className="font-semibold">{editing ? 'Edit Combo' : 'New Combo'}</h2>
            <button type="button" onClick={closeForm} aria-label="Close"><X size={18} /></button>
          </div>
          <ComboForm
            key={editing?._id || 'new'}
            mode="admin"
            comboId={editing?._id}
            initialCombo={editing}
            onSaved={onSaved}
            onCancel={closeForm}
          />
        </div>
      )}

      {loading ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : combos.length === 0 ? (
        <p className="text-sm text-neutral-500">No combos yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {combos.map((c) => {
            const isPack = c.type === 'color-pack';
            const priceLabel = isPack
              ? c.packOptions?.length ? `From ₹${Math.min(...c.packOptions.map((p) => p.price))}` : '—'
              : `₹${c.comboPrice}`;
            const cover = c.images?.[0] || c.image;
            const stock = stockLabel(c);
            return (
              <div key={c._id} className="card-soft overflow-hidden" style={{ opacity: c.isActive ? 1 : 0.6 }}>
                <div className="h-32 bg-brand-cream">
                  {cover && <img src={cover} alt={c.name} className="w-full h-full object-cover" />}
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{c.name}</p>
                    {isPack && <span className="text-[10px] bg-pink-50 text-pink-600 px-1.5 py-0.5 rounded-full">Color Pack</span>}
                    {!c.isActive && <span className="text-[10px] bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded-full">Hidden</span>}
                  </div>
                  <p className="text-brand-magenta font-semibold text-sm">{priceLabel}</p>
                  {stock && (
                    <p className={`text-xs mt-0.5 ${stock.bad ? 'text-red-600' : 'text-neutral-500'}`}>{stock.text}</p>
                  )}
                  <div className="flex items-center gap-3 mt-3 pt-2 border-t border-[#F0EFE9]">
                    <Link href={`/admin/combos/${c._id}/edit`} className="text-[#64748B] hover:text-[#0F172A]" title="Edit Details">
                      <Pencil size={15} />
                    </Link>
                    <button onClick={() => toggleActive(c)} className="text-[#64748B] hover:text-[#0F172A]" title={c.isActive ? 'Hide' : 'Show'}>
                      {c.isActive ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                    <button onClick={() => remove(c._id)} className="text-red-600 hover:text-red-700 ml-auto" title="Delete">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}