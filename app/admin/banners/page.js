'use client';

import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, X, Upload, Loader2, Pencil, Check, Ban } from 'lucide-react';

const emptyForm = {
  title: '', subtitle: '', image: '', link: '',
  buttonText: 'Shop Now', sortOrder: 0, isActive: true,
};

const STATUS_STYLE = {
  pending:  { bg: '#FFF1E6', color: '#EA580C', label: 'Pending' },
  approved: { bg: '#E6F4EA', color: '#1B8A3E', label: 'Approved' },
  rejected: { bg: '#FCE8E6', color: '#B3261E', label: 'Rejected' },
};

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

export default function AdminBannersPage() {
  const [banners, setBanners] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState('all');
  const fileRef = useRef();

  async function load() {
    const res = await fetch('/api/banners?all=true');
    const data = await res.json();
    setBanners(data.banners || []);
  }
  useEffect(() => { load(); }, []);

  const pendingCount = banners.filter((b) => b.approval === 'pending').length;
  const visible = filter === 'all' ? banners : banners.filter((b) => b.approval === filter);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'banners');
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setForm((f) => ({ ...f, image: data.url }));
      toast.success('Image uploaded');
    } catch (err) {
      toast.error(err.message);
      setPreview('');
    } finally {
      setUploading(false);
    }
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setPreview('');
    setShowForm(true);
  }

  function openEdit(b) {
    setEditingId(b._id);
    setForm({
      title: b.title || '',
      subtitle: b.subtitle || '',
      image: b.image || '',
      link: b.link || '',
      buttonText: b.buttonText || 'Shop Now',
      sortOrder: b.sortOrder ?? 0,
      isActive: b.isActive ?? true,
    });
    setPreview(b.image || '');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.image) { toast.error('Please upload an image'); return; }

    const isEditing = Boolean(editingId);
    const res = await fetch(
      isEditing ? `/api/banners/${editingId}` : '/api/banners',
      {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      }
    );

    if (res.ok) {
      toast.success(isEditing ? 'Banner updated' : 'Banner added');
      closeForm();
      load();
    } else {
      toast.error(isEditing ? 'Failed to update banner' : 'Failed to add banner');
    }
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setPreview('');
  }

  async function toggleActive(b) {
    await fetch(`/api/banners/${b._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !b.isActive }),
    });
    load();
  }

  async function setApproval(b, approval, rejectionReason = '') {
    const res = await fetch(`/api/banners/${b._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approval, rejectionReason }),
    });
    if (res.ok) {
      toast.success(approval === 'approved' ? 'Banner approved' : 'Banner rejected');
      load();
    } else {
      toast.error('Could not update banner');
    }
  }

  function reject(b) {
    const reason = prompt('Reason for rejection (shown to the seller):');
    if (reason === null) return;
    setApproval(b, 'rejected', reason.trim());
  }

  async function remove(id) {
    if (!confirm('Delete this banner?')) return;
    await fetch(`/api/banners/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-display text-2xl font-bold text-brand-magenta">Homepage Banners</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-1 text-sm">
          <Plus size={16} /> Add Banner
        </button>
      </div>

      {/* Approval filter */}
      <div className="flex flex-wrap gap-2 mb-5">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="text-xs font-medium px-3 py-1.5 rounded-full border transition-colors"
              style={{
                background: active ? '#F97316' : '#FFFFFF',
                color: active ? '#FFFFFF' : '#6B6B6B',
                borderColor: active ? '#F97316' : '#E8E8E8',
              }}
            >
              {f.label}
              {f.key === 'pending' && pendingCount > 0 && ` (${pendingCount})`}
            </button>
          );
        })}
      </div>

      {showForm && (
        <form onSubmit={submit} className="card-soft p-5 mb-6 space-y-3">
          <div className="flex justify-between">
            <h2 className="font-semibold">{editingId ? 'Edit Banner' : 'New Banner'}</h2>
            <button type="button" onClick={closeForm}><X size={18} /></button>
          </div>

          <div>
            <p className="text-xs font-medium text-brand-ink/60 mb-1">Banner Image (required)</p>
            <div
              onClick={() => !uploading && fileRef.current?.click()}
              className="w-full aspect-[1920/810] border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-brand-magenta transition-colors overflow-hidden relative"
            >
              {preview ? (
                <img src={preview} alt="banner preview" className="w-full h-full object-contain" />
              ) : (
                <div className="flex flex-col items-center gap-1 text-brand-ink/40 text-sm">
                  <Upload size={24} />
                  <span>Click to choose image</span>
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                  <Loader2 size={24} className="animate-spin text-brand-magenta" />
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

            <div className="mt-2 rounded-lg bg-brand-ink/5 p-3 text-xs text-brand-ink/70 space-y-0.5">
              <p><b>Size:</b> 1920 × 810 px (ratio ≈ 2.37 : 1)</p>
              <p><b>Format:</b> JPG or WebP, under 300 KB for fast loading</p>
              <p>The same image shows on desktop and mobile. On mobile the full image is shown (nothing is cropped), just smaller — so keep text large and bold.</p>
            </div>
          </div>

          <input placeholder="Title" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input placeholder="Subtitle" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
          <input placeholder="Link (e.g. /category/umbrella-kurtis)" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} />
          <input placeholder="Button text" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.buttonText} onChange={(e) => setForm({ ...form, buttonText: e.target.value })} />
          <input type="number" placeholder="Sort order" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />

          <label className="text-sm flex items-center gap-2">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active
          </label>

          <button className="btn-primary text-sm" disabled={uploading}>
            {uploading ? 'Uploading…' : editingId ? 'Save Changes' : 'Create'}
          </button>
        </form>
      )}

      {visible.length === 0 ? (
        <p className="text-sm text-brand-ink/50">No banners in this view.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {visible.map((b) => {
            const st = STATUS_STYLE[b.approval] || STATUS_STYLE.approved;
            const sellerName = b.seller?.businessName || b.seller?.name;
            return (
              <div key={b._id} className="card-soft overflow-hidden">
                <div className="w-full aspect-[1920/810] bg-white">
                  <img src={b.image} alt={b.title} className="w-full h-full object-contain" />
                </div>

                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{b.title || '(no title)'}</p>
                      <p className="text-xs text-brand-ink/50">
                        Order: {b.sortOrder} · {b.seller ? `Seller: ${sellerName || 'Unknown'}` : 'Admin'}
                      </p>
                    </div>
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 shrink-0"
                      style={{ background: st.bg, color: st.color }}
                    >
                      {st.label}
                    </span>
                  </div>

                  {b.approval === 'rejected' && b.rejectionReason && (
                    <p className="text-xs mt-2" style={{ color: '#B3261E' }}>
                      Reason: {b.rejectionReason}
                    </p>
                  )}

                  {b.approval !== 'approved' && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => setApproval(b, 'approved')}
                        className="flex items-center gap-1 text-xs font-medium px-3 py-1.5"
                        style={{ background: '#1B8A3E', color: '#fff' }}
                      >
                        <Check size={14} /> Approve
                      </button>
                      {b.approval === 'pending' && (
                        <button
                          onClick={() => reject(b)}
                          className="flex items-center gap-1 text-xs font-medium px-3 py-1.5"
                          style={{ background: '#B3261E', color: '#fff' }}
                        >
                          <Ban size={14} /> Reject
                        </button>
                      )}
                    </div>
                  )}
                  {b.approval === 'approved' && b.seller && (
                    <button
                      onClick={() => reject(b)}
                      className="flex items-center gap-1 text-xs mt-3 underline"
                      style={{ color: '#B3261E' }}
                    >
                      <Ban size={13} /> Revoke approval
                    </button>
                  )}

                  <div className="flex items-center justify-end gap-2 mt-3">
                    <label className="text-xs flex items-center gap-1">
                      <input type="checkbox" checked={b.isActive} onChange={() => toggleActive(b)} /> Active
                    </label>
                    <button onClick={() => openEdit(b)} className="text-brand-ink/60 hover:text-brand-magenta"><Pencil size={16} /></button>
                    <button onClick={() => remove(b._id)} className="text-brand-magenta"><Trash2 size={16} /></button>
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