'use client';

import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Plus,
  Trash2,
  X,
  Upload,
  Loader2,
  Pencil,
  Check,
  Ban,
  Calendar,
  Eye,
  Store,
  Layers,
  ArrowUpDown,
  Smartphone,
  Monitor,
} from 'lucide-react';

const emptyForm = {
  title: '',
  subtitle: '',
  description: '',
  image: '',
  mobileImage: '',
  link: '',
  buttonText: 'Shop Now',
  sortOrder: 0,
  isActive: true,
  startDate: '',
  endDate: '',
};

const STATUS_STYLE = {
  pending: { bg: '#FAF7EE', color: '#C9A227', border: '#E7E2D6', label: 'Pending Approval' },
  approved: { bg: '#ECFDF5', color: '#059669', border: '#A7F3D0', label: 'Approved' },
  rejected: { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA', label: 'Rejected' },
};

const FILTERS = [
  { key: 'all', label: 'All Banners' },
  { key: 'admin', label: 'Homepage Banners' },
  { key: 'seller', label: 'Seller Banners' },
  { key: 'pending', label: 'Pending Approval' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

export default function AdminBannersPage() {
  const [banners, setBanners] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [previewModal, setPreviewModal] = useState(null);

  const desktopFileRef = useRef();
  const mobileFileRef = useRef();

  async function load() {
    try {
      const res = await fetch('/api/banners?all=true');
      const data = await res.json();
      setBanners(data.banners || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load banners');
    }
  }

  useEffect(() => {
    load();
  }, []);

  const pendingCount = banners.filter((b) => b.approval === 'pending').length;

  const visible = banners.filter((b) => {
    if (filter === 'all') return true;
    if (filter === 'admin') return !b.seller;
    if (filter === 'seller') return !!b.seller;
    return b.approval === filter;
  });

  async function handleFileUpload(file, isMobile = false) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (isMobile) setUploadingMobile(true);
    else setUploadingDesktop(true);

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'banners');
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      if (isMobile) {
        setForm((f) => ({ ...f, mobileImage: data.url }));
        toast.success('Mobile banner image uploaded');
      } else {
        setForm((f) => ({ ...f, image: data.url }));
        toast.success('Desktop banner image uploaded');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      if (isMobile) setUploadingMobile(false);
      else setUploadingDesktop(false);
    }
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(b) {
    setEditingId(b._id);
    setForm({
      title: b.title || '',
      subtitle: b.subtitle || '',
      description: b.description || '',
      image: b.image || '',
      mobileImage: b.mobileImage || '',
      link: b.link || '',
      buttonText: b.buttonText || 'Shop Now',
      sortOrder: b.sortOrder ?? 0,
      isActive: b.isActive ?? true,
      startDate: b.startDate ? new Date(b.startDate).toISOString().slice(0, 16) : '',
      endDate: b.endDate ? new Date(b.endDate).toISOString().slice(0, 16) : '',
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.image) {
      toast.error('Please upload a desktop banner image');
      return;
    }

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
      toast.success(isEditing ? 'Banner updated successfully' : 'Homepage banner created');
      closeForm();
      load();
    } else {
      const data = await res.json();
      toast.error(data.error || (isEditing ? 'Failed to update banner' : 'Failed to create banner'));
    }
  }

  async function toggleActive(b) {
    const res = await fetch(`/api/banners/${b._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !b.isActive }),
    });
    if (res.ok) {
      toast.success(b.isActive ? 'Banner deactivated' : 'Banner activated');
      load();
    }
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
      toast.error('Could not update banner approval');
    }
  }

  function handleReject(b) {
    const reason = prompt('Specify rejection reason (displayed to seller):', 'Low resolution image or does not meet storefront banner specifications.');
    if (reason === null) return;
    setApproval(b, 'rejected', reason.trim());
  }

  async function removeBanner(id) {
    if (!confirm('Are you sure you want to permanently delete this banner?')) return;
    const res = await fetch(`/api/banners/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Banner deleted');
      load();
    }
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E7E2D6]">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
            Banner Management
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Configure homepage promotional banners, responsive slides, scheduling, and moderate seller storefront banners.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#0F172A] text-white hover:bg-neutral-800 shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus size={15} />
          <span>Add Homepage Banner</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                active
                  ? 'bg-[#0F172A] text-white shadow-xs'
                  : 'bg-white text-[#64748B] hover:text-[#0F172A] border border-[#E7E2D6]'
              }`}
            >
              {f.label}
              {f.key === 'pending' && pendingCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-[#C9A227] text-black text-[10px] font-black">
                  {pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Banner Create / Edit Form Drawer */}
      {showForm && (
        <form
          onSubmit={submit}
          className="bg-white p-6 rounded-3xl border border-[#E7E2D6] shadow-sm space-y-5 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between border-b border-[#F0EFE9] pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#0F172A]">
              {editingId ? 'Edit Banner Configuration' : 'Create Homepage Banner'}
            </h2>
            <button
              type="button"
              onClick={closeForm}
              className="p-1.5 text-neutral-400 hover:text-black rounded-lg"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Images */}
            <div className="space-y-4">
              {/* Desktop Image */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                    <Monitor size={14} className="text-[#C9A227]" />
                    <span>Desktop Banner Image (Required)</span>
                  </label>
                  {form.image && (
                    <button
                      type="button"
                      onClick={() => desktopFileRef.current?.click()}
                      className="text-[11px] font-bold text-[#C9A227] hover:underline"
                    >
                      Replace Image
                    </button>
                  )}
                </div>

                <div
                  onClick={() => !uploadingDesktop && desktopFileRef.current?.click()}
                  className={`relative w-full aspect-[1920/810] flex flex-col items-center justify-center cursor-pointer rounded-2xl overflow-hidden transition-all ${
                    form.image
                      ? 'border-2 border-[#C9A227] bg-white'
                      : 'border-2 border-dashed border-[#D6D6D6] hover:border-[#0F172A] bg-[#FAF9F5]'
                  }`}
                >
                  {form.image ? (
                    <img src={form.image} alt="Desktop Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-xs text-[#64748B]">
                      <Upload size={20} className="text-[#C9A227]" />
                      <span className="font-semibold text-[#0F172A]">Upload 1920 × 810 px Banner</span>
                    </div>
                  )}

                  {uploadingDesktop && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center gap-2">
                      <Loader2 size={22} className="animate-spin text-[#C9A227]" />
                      <span className="text-xs font-bold">Uploading Desktop…</span>
                    </div>
                  )}
                </div>
                <input
                  ref={desktopFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files?.[0], false)}
                />
              </div>

              {/* Mobile Image */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                    <Smartphone size={14} className="text-[#C9A227]" />
                    <span>Mobile Banner Image (Optional)</span>
                  </label>
                  {form.mobileImage && (
                    <button
                      type="button"
                      onClick={() => mobileFileRef.current?.click()}
                      className="text-[11px] font-bold text-[#C9A227] hover:underline"
                    >
                      Replace
                    </button>
                  )}
                </div>

                <div
                  onClick={() => !uploadingMobile && mobileFileRef.current?.click()}
                  className={`relative w-full aspect-[800/600] flex flex-col items-center justify-center cursor-pointer rounded-2xl overflow-hidden transition-all ${
                    form.mobileImage
                      ? 'border-2 border-[#C9A227] bg-white'
                      : 'border-2 border-dashed border-[#D6D6D6] hover:border-[#0F172A] bg-[#FAF9F5]'
                  }`}
                >
                  {form.mobileImage ? (
                    <img src={form.mobileImage} alt="Mobile Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-xs text-[#64748B]">
                      <Smartphone size={18} className="text-[#64748B]" />
                      <span>Upload Mobile Aspect Banner (800 × 600 px)</span>
                    </div>
                  )}

                  {uploadingMobile && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center gap-2">
                      <Loader2 size={22} className="animate-spin text-[#C9A227]" />
                      <span className="text-xs font-bold">Uploading Mobile…</span>
                    </div>
                  )}
                </div>
                <input
                  ref={mobileFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files?.[0], true)}
                />
              </div>
            </div>

            {/* Right: Details & Scheduling */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">
                  Banner Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Grand Festive Sale"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#D6D6D6] outline-none focus:border-[#0F172A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">
                  Description / Promo Caption
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Up to 40% off on premium electronics and traditional sweets."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
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
                    onChange={(e) => setForm({ ...form, buttonText: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#D6D6D6] outline-none focus:border-[#0F172A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">
                    CTA Target URL
                  </label>
                  <input
                    type="text"
                    placeholder="/category/electronics"
                    value={form.link}
                    onChange={(e) => setForm({ ...form, link: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#D6D6D6] outline-none focus:border-[#0F172A]"
                  />
                </div>
              </div>

              {/* Display Order & Scheduling */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#D6D6D6] outline-none focus:border-[#0F172A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">
                    Start Date
                  </label>
                  <input
                    type="datetime-local"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-2.5 py-2.5 text-xs rounded-xl border border-[#D6D6D6] outline-none focus:border-[#0F172A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">
                    End Date
                  </label>
                  <input
                    type="datetime-local"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-2.5 py-2.5 text-xs rounded-xl border border-[#D6D6D6] outline-none focus:border-[#0F172A]"
                  />
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-3 pt-2">
                <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-[#0F172A]">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="rounded text-[#0F172A] focus:ring-0"
                  />
                  <span>Active & Visible in Carousel</span>
                </label>
              </div>

              {/* Form buttons */}
              <div className="pt-3 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={uploadingDesktop || uploadingMobile}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#C9A227] text-black hover:bg-[#d8b030] shadow-sm transition-all"
                >
                  {editingId ? 'Save Changes' : 'Create Banner'}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold border border-[#D6D6D6] text-[#64748B] hover:text-[#0F172A]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Banners Grid */}
      {visible.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#E7E2D6] p-10 text-center space-y-2">
          <Layers size={24} className="mx-auto text-[#64748B]" />
          <p className="text-xs font-semibold text-[#64748B]">No banners found for current filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {visible.map((b) => {
            const st = STATUS_STYLE[b.approval] || STATUS_STYLE.approved;
            const isSellerBanner = Boolean(b.seller);
            const sellerName = b.seller?.businessName || b.seller?.name || 'Seller';

            return (
              <div
                key={b._id}
                className="bg-white rounded-3xl border border-[#E7E2D6] overflow-hidden shadow-xs flex flex-col justify-between"
              >
                {/* Banner Media */}
                <div className="relative w-full aspect-[1920/810] bg-neutral-100 overflow-hidden">
                  <img
                    src={b.image}
                    alt={b.title || 'Banner'}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-xs border"
                      style={{
                        backgroundColor: st.bg,
                        color: st.color,
                        borderColor: st.border,
                      }}
                    >
                      {st.label}
                    </span>
                  </div>

                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    {isSellerBanner ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0F172A] text-white">
                        <Store size={11} />
                        <span>Seller: {sellerName}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF7EE] text-[#C9A227] border border-[#E7E2D6]">
                        Homepage Slide
                      </span>
                    )}
                  </div>
                </div>

                {/* Banner Info */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-sm text-[#0F172A] truncate">
                        {b.title || 'Banner (No title)'}
                      </h3>
                      <span className="text-[11px] text-[#64748B]">Order: {b.sortOrder}</span>
                    </div>

                    {b.description && (
                      <p className="text-xs text-[#64748B] line-clamp-2 mt-1">
                        {b.description}
                      </p>
                    )}

                    {/* Scheduling info */}
                    {(b.startDate || b.endDate) && (
                      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#64748B]">
                        <Calendar size={12} className="text-[#C9A227]" />
                        <span>
                          {b.startDate ? new Date(b.startDate).toLocaleDateString() : 'Immediate'} →{' '}
                          {b.endDate ? new Date(b.endDate).toLocaleDateString() : 'No expiry'}
                        </span>
                      </div>
                    )}

                    {/* Rejection notice */}
                    {b.approval === 'rejected' && b.rejectionReason && (
                      <div className="mt-2.5 p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                        <strong className="block font-bold">Rejection Reason:</strong>
                        <span>{b.rejectionReason}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions & Moderation */}
                  <div className="pt-3 border-t border-[#F0EFE9] space-y-2">
                    {/* Moderation actions for seller banners */}
                    {isSellerBanner && (
                      <div className="flex items-center gap-2">
                        {b.approval !== 'approved' && (
                          <button
                            onClick={() => setApproval(b, 'approved')}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                          >
                            <Check size={13} />
                            <span>Approve Banner</span>
                          </button>
                        )}
                        {b.approval !== 'rejected' && (
                          <button
                            onClick={() => handleReject(b)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition-colors"
                          >
                            <Ban size={13} />
                            <span>Reject Banner</span>
                          </button>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs pt-1">
                      <label className="inline-flex items-center gap-1.5 cursor-pointer font-bold text-[#0F172A]">
                        <input
                          type="checkbox"
                          checked={b.isActive}
                          onChange={() => toggleActive(b)}
                          className="rounded text-[#0F172A] focus:ring-0"
                        />
                        <span>Active</span>
                      </label>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewModal(b)}
                          className="p-1.5 text-neutral-500 hover:text-black rounded-lg"
                          title="Instant Preview"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(b)}
                          className="p-1.5 text-neutral-500 hover:text-black rounded-lg"
                          title="Edit Banner"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeBanner(b._id)}
                          className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Instant Preview Modal */}
      {previewModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewModal(null)}
        >
          <div
            className="bg-white rounded-3xl overflow-hidden max-w-4xl w-full border border-[#E7E2D6] shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-[#F0EFE9] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye size={16} className="text-[#C9A227]" />
                <h3 className="font-bold text-sm text-[#0F172A]">
                  Instant Banner Preview: {previewModal.title || 'Untitled Banner'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModal(null)}
                className="p-1 text-neutral-400 hover:text-black rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="relative w-full aspect-[1920/810] bg-black">
              <img
                src={previewModal.image}
                alt="Banner"
                className="w-full h-full object-cover"
              />
              {(previewModal.title || previewModal.description) && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-6 sm:p-10">
                  <div className="max-w-lg text-white space-y-1.5">
                    <h2 className="text-xl sm:text-2xl font-black">{previewModal.title}</h2>
                    <p className="text-xs sm:text-sm text-white/90">{previewModal.description}</p>
                    {previewModal.buttonText && (
                      <span className="inline-block mt-2 px-4 py-1.5 rounded-full text-xs font-bold bg-[#C9A227] text-black">
                        {previewModal.buttonText}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-[#FAF9F5] border-t border-[#F0EFE9] flex items-center justify-between text-xs text-[#64748B]">
              <span>CTA Target: {previewModal.link || 'None'}</span>
              <span>Sort Priority: {previewModal.sortOrder}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
