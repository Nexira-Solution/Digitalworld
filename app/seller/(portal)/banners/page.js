'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Loader2, X } from 'lucide-react';

const INK = '#000000';
const INK_SOFT = '#6B6B6B';
const ORANGE = '#F97316';
const ORANGE_WASH = '#FFF1E6';
const LINE = '#E8E8E8';
const PAPER = '#FFFFFF';

const STATUS_STYLE = {
  pending: { bg: '#FFF1E6', color: '#EA580C', label: 'Pending approval' },
  approved: { bg: '#E6F4EA', color: '#1B8A3E', label: 'Live' },
  rejected: { bg: '#FCE8E6', color: '#B3261E', label: 'Rejected' },
};

const EMPTY = { title: '', subtitle: '', image: '', mobileImage: '', link: '', buttonText: 'Shop Now' };

// Click-to-upload box. Uploads the file to /api/upload and returns the URL via onChange.
function ImageUpload({ label, hint, value, onChange, onError }) {
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState('');

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onError('Please choose an image file.');
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
      <p className="text-[11px] tracking-[1.5px] uppercase mb-1.5" style={{ color: INK_SOFT }}>{label}</p>
      <div
        onClick={() => !uploading && fileRef.current?.click()}
        className="relative w-full aspect-[1920/810] flex flex-col items-center justify-center cursor-pointer overflow-hidden"
        style={{ border: `2px dashed ${shown ? ORANGE : LINE}`, background: shown ? PAPER : ORANGE_WASH }}
      >
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shown} alt="Preview" className="w-full h-full object-contain" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-[12px]" style={{ color: INK_SOFT }}>
            <Upload size={22} />
            <span>Click to choose image</span>
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.7)' }}>
            <Loader2 size={24} className="animate-spin" style={{ color: ORANGE }} />
          </div>
        )}

        {shown && !uploading && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); clear(); }}
            aria-label="Remove image"
            className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.95)', color: INK }}
          >
            <X size={14} />
          </button>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {hint && <p className="text-[11px] mt-1.5" style={{ color: INK_SOFT }}>{hint}</p>}
    </div>
  );
}

export default function SellerBannersPage() {
  const router = useRouter();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(EMPTY);
  const [formKey, setFormKey] = useState(0);

  async function load() {
    const res = await fetch('/api/seller/banners');
    if (res.status === 401) {
      router.push('/seller/login');
      return;
    }
    const data = await res.json();
    setBanners(data.banners || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []); // eslint-disable-line

  async function onAdd(e) {
    e.preventDefault();
    if (!form.image) {
      setError('Please upload a banner image.');
      return;
    }
    setSaving(true);
    setError('');
    const res = await fetch('/api/seller/banners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || 'Failed to add banner.');
      return;
    }
    setForm(EMPTY);
    setFormKey((k) => k + 1);
    load();
  }

  async function toggleActive(b) {
    await fetch(`/api/seller/banners/${b._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !b.isActive }),
    });
    load();
  }

  async function onDelete(id) {
    if (!confirm('Delete this banner?')) return;
    await fetch(`/api/seller/banners/${id}`, { method: 'DELETE' });
    load();
  }

  const input = 'px-3 py-2.5 text-sm outline-none';
  const inputStyle = { border: `1px solid ${LINE}`, color: INK };
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="max-w-5xl mx-auto px-6 py-10" style={{ background: PAPER }}>
      <h1 className="text-[18px] tracking-[1.5px] uppercase mb-6" style={{ color: INK }}>My Banners</h1>

      <form onSubmit={onAdd} className="flex flex-col gap-3 mb-10 p-4 max-w-lg" style={{ border: `1px solid ${LINE}` }}>
        <div className="text-[12px] tracking-[1.5px] uppercase" style={{ color: INK_SOFT }}>Add Banner</div>

        <ImageUpload
          key={`main-${formKey}`}
          label="Banner image (required)"
          hint="Size: 1920 × 810 px. JPG or WebP, under 300 KB loads fastest. The same image shows on desktop and mobile, so keep text large and bold."
          value={form.image}
          onChange={(url) => setForm((f) => ({ ...f, image: url }))}
          onError={setError}
        />

        <input placeholder="Title (optional)" value={form.title} onChange={set('title')} className={input} style={inputStyle} />
        <input placeholder="Subtitle (optional)" value={form.subtitle} onChange={set('subtitle')} className={input} style={inputStyle} />
        <input placeholder="Link, e.g. /product/my-product (optional)" value={form.link} onChange={set('link')} className={input} style={inputStyle} />
        <input placeholder="Button text" value={form.buttonText} onChange={set('buttonText')} className={input} style={inputStyle} />

        {error && <div className="text-[13px]" style={{ color: '#B3261E' }}>{error}</div>}

        <button
          type="submit"
          disabled={saving}
          className="py-2.5 text-[12px] tracking-[1.5px] uppercase"
          style={{ background: ORANGE, color: PAPER, opacity: saving ? 0.6 : 1 }}
        >
          {saving ? 'Submitting...' : 'Submit for approval'}
        </button>
        <p className="text-[11px]" style={{ color: INK_SOFT }}>
          New banners appear on the homepage once a superadmin approves them.
        </p>
      </form>

      {loading ? (
        <div style={{ color: INK_SOFT }}>Loading...</div>
      ) : banners.length === 0 ? (
        <div style={{ color: INK_SOFT }}>No banners yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {banners.map((b) => {
            const st = STATUS_STYLE[b.approval] || STATUS_STYLE.pending;
            return (
              <div key={b._id} style={{ border: `1px solid ${LINE}` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.image} alt={b.title || 'Banner'} className="w-full aspect-[1920/810] object-cover" />
                <div className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[13px]" style={{ color: INK }}>{b.title || 'Untitled'}</span>
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5"
                      style={{ background: st.bg, color: st.color }}
                    >
                      {st.label}
                    </span>
                  </div>
                  {b.approval === 'rejected' && b.rejectionReason && (
                    <p className="text-[12px] mb-2" style={{ color: '#B3261E' }}>Reason: {b.rejectionReason}</p>
                  )}
                  <div className="flex items-center justify-between text-[12px]">
                    <button onClick={() => toggleActive(b)} className="underline" style={{ color: INK }}>
                      {b.isActive ? 'Hide' : 'Show'}
                    </button>
                    <button onClick={() => onDelete(b._id)} style={{ color: '#B3261E' }}>Delete</button>
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