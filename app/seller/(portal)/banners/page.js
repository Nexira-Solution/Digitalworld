'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  Loader2,
  X,
  Plus,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_STYLE = {
  pending: {
    bg: '#FAF7EE',
    color: '#C9A227',
    border: '#E7E2D6',
    label: 'Pending Approval',
    icon: Clock,
  },
  approved: {
    bg: '#ECFDF5',
    color: '#059669',
    border: '#A7F3D0',
    label: 'Approved & Live',
    icon: CheckCircle2,
  },
  rejected: {
    bg: '#FEF2F2',
    color: '#DC2626',
    border: '#FECACA',
    label: 'Rejected',
    icon: AlertCircle,
  },
};

const EMPTY_FORM = {
  title: '',
  subtitle: '',
  description: '',
  image: '',
  mobileImage: '',
  link: '',
  buttonText: 'Shop Now',
};

function BannerImageUpload({ label, hint, value, onChange, onError }) {
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState('');

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onError('Please choose an image file (PNG, JPG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      onError('Image is too large. Please keep it under 5 MB.');
      return;
    }

    onError('');
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'banners');
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      onChange(data.url);
      toast.success('Banner image uploaded');
    } catch (err) {
      onError(err.message || 'Upload failed');
      setPreview('');
      onChange('');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function clear() {
    setPreview('');
    onChange('');
  }

  const shown = preview || value;

  return (
    <div>
      <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <div
        onClick={() => !uploading && fileRef.current?.click()}
        className={`relative w-full aspect-[1920/810] flex flex-col items-center justify-center cursor-pointer rounded-2xl overflow-hidden transition-all ${
          shown
            ? 'border-2 border-[#C9A227] bg-white shadow-xs'
            : 'border-2 border-dashed border-[#D6D6D6] hover:border-[#0F172A] bg-[#FAF9F5]'
        }`}
      >
        {shown ? (
          <img src={shown} alt="Banner Preview" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-xs text-[#64748B]">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-xs border border-[#E7E2D6] text-[#C9A227]">
              <Upload size={18} />
            </div>
            <span className="font-semibold text-[#0F172A]">Click to select banner image</span>
            <span className="text-[11px] text-[#94A3B8]">PNG, JPG, WebP up to 5MB</span>
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/80 backdrop-blur-xs">
            <Loader2 size={24} className="animate-spin text-[#C9A227]" />
            <span className="text-xs font-bold text-[#0F172A]">Uploading banner…</span>
          </div>
        )}

        {shown && !uploading && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              clear();
            }}
            aria-label="Remove image"
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/95 text-neutral-800 hover:text-black flex items-center justify-center shadow-md border border-[#E7E2D6]"
          >
            <X size={15} />
          </button>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {hint && <p className="text-[11px] text-[#64748B] mt-1.5 leading-relaxed">{hint}</p>}
    </div>
  );
}

export default function SellerBannersPage() {
  const router = useRouter();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formKey, setFormKey] = useState(0);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/seller/banners');
      if (res.status === 401) {
        router.push('/seller/login');
        return;
      }
      const data = await res.json();
      setBanners(data.banners || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load store banners');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onAdd(e) {
    e.preventDefault();
    if (!form.image) {
      setError('Please upload a banner image.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/seller/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit banner');

      toast.success('Banner submitted for admin approval!');
      setForm(EMPTY_FORM);
      setFormKey((k) => k + 1);
      setShowAddForm(false);
      load();
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(b) {
    try {
      const res = await fetch(`/api/seller/banners/${b._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !b.isActive }),
      });
      if (res.ok) {
        toast.success(b.isActive ? 'Banner hidden' : 'Banner activated');
        load();
      }
    } catch (err) {
      toast.error('Failed to update banner status');
    }
  }

  async function onDelete(id) {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    try {
      const res = await fetch(`/api/seller/banners/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Banner deleted');
        load();
      }
    } catch (err) {
      toast.error('Failed to delete banner');
    }
  }

  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E7E2D6]">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight">
            Storefront Banners
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Upload custom branded banners for your public supplier storefront. New banners require admin approval.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#0F172A] text-white hover:bg-neutral-800 shadow-sm transition-all self-start sm:self-auto"
        >
          {showAddForm ? <X size={15} /> : <Plus size={15} />}
          <span>{showAddForm ? 'Close Form' : 'Add Store Banner'}</span>
        </button>
      </div>

      {/* Add Banner Form Drawer */}
      {showAddForm && (
        <form
          onSubmit={onAdd}
          className="bg-white p-6 rounded-3xl border border-[#E7E2D6] shadow-sm space-y-5 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between border-b border-[#F0EFE9] pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#0F172A]">
              Upload New Store Banner
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#FAF7EE] text-[#C9A227] font-semibold border border-[#E7E2D6]">
              Pending Approval Status
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-4">
              <BannerImageUpload
                key={`desktop-${formKey}`}
                label="Storefront Banner Image (Required)"
                hint="Optimal dimensions: 1920 × 810 px (or 16:9 ratio). High resolution JPG or WebP."
                value={form.image}
                onChange={(url) => setForm((f) => ({ ...f, image: url }))}
                onError={setError}
              />

              <BannerImageUpload
                key={`mobile-${formKey}`}
                label="Mobile Banner Image (Optional)"
                hint="Optimal dimensions: 800 × 600 px for enhanced mobile responsiveness."
                value={form.mobileImage}
                onChange={(url) => setForm((f) => ({ ...f, mobileImage: url }))}
                onError={setError}
              />
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">
                  Banner Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Exclusive Festive Collection"
                  value={form.title}
                  onChange={setField('title')}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#D6D6D6] outline-none focus:border-[#0F172A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">
                  Banner Description
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Discover handpicked gourmet sweets and snacks crafted directly from our workshop."
                  value={form.description}
                  onChange={setField('description')}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#D6D6D6] outline-none focus:border-[#0F172A] resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">
                    CTA Button Text
                  </label>
                  <input
                    type="text"
                    placeholder="Shop Now"
                    value={form.buttonText}
                    onChange={setField('buttonText')}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#D6D6D6] outline-none focus:border-[#0F172A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">
                    CTA Target URL
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. /category/sweets"
                    value={form.link}
                    onChange={setField('link')}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#D6D6D6] outline-none focus:border-[#0F172A]"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-medium border border-red-200">
                  {error}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 rounded-xl text-xs font-bold bg-[#C9A227] text-black hover:bg-[#d8b030] transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  <span>{saving ? 'Submitting Banner…' : 'Submit for Admin Approval'}</span>
                </button>
                <p className="text-[11px] text-[#64748B] text-center mt-2">
                  Once approved by Digital World administrators, this banner will automatically showcase on your public storefront.
                </p>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Banner Catalog List */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#0F172A] mb-3">
          Your Store Banners ({banners.length})
        </h2>

        {loading ? (
          <div className="min-h-[250px] flex flex-col items-center justify-center gap-2 bg-white rounded-3xl border border-[#E7E2D6]">
            <Loader2 size={24} className="animate-spin text-[#C9A227]" />
            <p className="text-xs text-[#64748B]">Loading your banners…</p>
          </div>
        ) : banners.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#E7E2D6] p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#FAF7EE] text-[#C9A227] flex items-center justify-center mx-auto border border-[#E7E2D6]">
              <Upload size={20} />
            </div>
            <h3 className="text-sm font-bold text-[#0F172A]">No Storefront Banners Yet</h3>
            <p className="text-xs text-[#64748B] max-w-sm mx-auto">
              Add custom storefront banners to highlight promotions, showcase new arrivals, and build brand identity.
            </p>
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0F172A] text-white hover:bg-neutral-800"
            >
              Add Store Banner
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {banners.map((b) => {
              const st = STATUS_STYLE[b.approval] || STATUS_STYLE.pending;
              const StatusIcon = st.icon;

              return (
                <div
                  key={b._id}
                  className="bg-white rounded-3xl border border-[#E7E2D6] overflow-hidden shadow-xs flex flex-col justify-between"
                >
                  {/* Banner Graphic */}
                  <div className="relative w-full aspect-[1920/810] bg-neutral-100 overflow-hidden">
                    <img
                      src={b.image}
                      alt={b.title || 'Store Banner'}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold shadow-xs border"
                        style={{
                          backgroundColor: st.bg,
                          color: st.color,
                          borderColor: st.border,
                        }}
                      >
                        <StatusIcon size={12} />
                        <span>{st.label}</span>
                      </span>
                    </div>
                  </div>

                  {/* Banner Info */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-sm sm:text-base text-[#0F172A] truncate">
                          {b.title || 'Store Banner (No title)'}
                        </h3>
                        <span className="text-[11px] text-[#64748B]">
                          {new Date(b.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {b.description && (
                        <p className="text-xs text-[#64748B] line-clamp-2 mt-1">
                          {b.description}
                        </p>
                      )}

                      {/* Rejection remarks */}
                      {b.approval === 'rejected' && (
                        <div className="mt-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                          <strong className="block font-bold">Admin Rejection Reason:</strong>
                          <span>{b.rejectionReason || 'Does not comply with storefront banner guidelines.'}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-[#F0EFE9] flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleActive(b)}
                          className={`px-3 py-1.5 rounded-lg font-bold border transition-colors ${
                            b.isActive
                              ? 'bg-[#FAF7EE] text-[#C9A227] border-[#E7E2D6]'
                              : 'bg-neutral-100 text-[#64748B] border-[#D6D6D6]'
                          }`}
                        >
                          {b.isActive ? 'Active on Store' : 'Hidden'}
                        </button>
                        {b.link && (
                          <span className="text-[11px] text-[#64748B] truncate max-w-[120px]">
                            URL: {b.link}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => onDelete(b._id)}
                        className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete banner"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
