'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Upload, Loader2, Sparkles, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AddCategoryModal({
  isOpen,
  onClose,
  onSuccess,
  initialData = null,
}) {
  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const isEdit = Boolean(initialData?._id);

  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || '');
      setImage(initialData?.image || '');
      setUploadError('');
      setSaving(false);
      setUploading(false);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  async function handleFileSelect(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      setUploadError('Image must be under 4 MB');
      toast.error('Image must be under 4 MB');
      return;
    }

    setUploading(true);
    setUploadError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'categories');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setImage(data.url);
      toast.success('Category image uploaded!');
    } catch (err) {
      setUploadError(err.message || 'Failed to upload image');
      toast.error(err.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(e) {
    e?.preventDefault?.();
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error('Please enter a category title');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: trimmedName,
        image: image.trim(),
        productType: 'food',
        parent: null,
        isActive: true,
      };

      const url = isEdit ? `/api/categories/${initialData._id}` : '/api/categories';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save category');
      }

      toast.success(
        isEdit
          ? `Category "${data.category?.name || trimmedName}" updated!`
          : `Category "${data.category?.name || trimmedName}" added successfully!`
      );

      if (onSuccess) {
        onSuccess(data.category);
      }
      onClose();
    } catch (err) {
      toast.error(err.message || 'Something went wrong saving category');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-[#FAF9F5]">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#0F172A] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F97316]" />
              {isEdit ? 'Edit Category' : 'Add New Category'}
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Enter title & photo. Showcases in <strong>Shop by Category</strong> circle on Home page.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Home Page Circular Showcase Preview */}
          <div className="p-4 rounded-xl bg-[#FAF9F5] border border-neutral-200 flex flex-col sm:flex-row items-center gap-5">
            <div className="flex flex-col items-center shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] mb-1.5">
                Home Page Circle Preview
              </span>
              <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-full overflow-hidden bg-white border-2 border-[#F97316] shadow-sm flex items-center justify-center transition-all">
                {image ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={image}
                    alt={name || 'Category'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-[#FFF1E6] text-[#F97316] text-[10px] font-semibold text-center p-1.5">
                    <ImageIcon size={18} className="mb-0.5 opacity-70" />
                    <span>Photo</span>
                  </div>
                )}
              </div>
              <span className="mt-1.5 text-xs font-bold text-[#0F172A] max-w-[110px] text-center truncate">
                {name || 'Category Title'}
              </span>
            </div>

            <div className="flex-1 w-full space-y-2 text-center sm:text-left">
              <h4 className="text-xs font-bold uppercase tracking-wide text-[#0F172A] flex items-center gap-1.5 justify-center sm:justify-start">
                <Sparkles size={13} className="text-[#F97316]" />
                Showcase on Home Page
              </h4>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Categories are displayed in circular cards on the storefront homepage and appear in the product category dropdown and filter.
              </p>
            </div>
          </div>

          {/* 1. Category Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-[#0F172A] mb-1.5">
              Category Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Snacks, Saffron & Spices, Dry Fruits & Nuts"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-neutral-300 bg-white text-[#0F172A] placeholder-neutral-400 outline-none focus:border-[#0F172A] focus:ring-1 focus:ring-[#0F172A] transition-all"
              autoFocus
              required
            />
          </div>

          {/* 2. Category Image */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-[#0F172A] mb-1.5">
              Category Image
            </label>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-60 transition-colors shadow-xs"
                >
                  {uploading ? (
                    <>
                      <Loader2 size={14} className="animate-spin text-[#F97316]" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={14} />
                      <span>Upload Image</span>
                    </>
                  )}
                </button>

                {image && (
                  <button
                    type="button"
                    onClick={() => setImage('')}
                    className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <X size={13} />
                    <span>Remove</span>
                  </button>
                )}
              </div>

              {/* Or paste URL */}
              <input
                type="text"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="Or paste image URL (https://...)"
                className="w-full px-3.5 py-2 text-xs rounded-lg border border-neutral-200 bg-neutral-50 text-[#0F172A] placeholder-neutral-400 outline-none focus:border-[#0F172A] focus:bg-white transition-colors"
              />

              {uploadError && (
                <p className="text-xs text-red-600 font-medium">{uploadError}</p>
              )}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-lg bg-[#0F172A] text-white hover:bg-neutral-800 disabled:opacity-60 transition-all shadow-sm"
            >
              {saving && <Loader2 size={14} className="animate-spin text-[#F97316]" />}
              <span>{saving ? 'Saving...' : isEdit ? 'Update Category' : 'Save Category'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
