'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Settings as SettingsIcon,
  Truck,
  Building,
  Share2,
  Link as LinkIcon,
  Eye,
  Plus,
  Trash2,
  Save,
  CheckCircle,
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('delivery');
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((d) => {
        const s = d.settings || {};
        setForm({
          storeName: s.storeName || 'Digital World',
          aboutUs:
            s.aboutUs ||
            'India’s premier verified multi-vendor marketplace offering authentic electronics, apparel, regional gourmet sweets, snacks, and daily essentials direct from certified suppliers.',
          address: s.address || '123 Commerce Avenue, Cyber City, Chennai, Tamil Nadu, 600001',
          phone: s.phone || '+91 98765 43210',
          email: s.email || 'support@digitalworld.com',
          whatsapp: s.whatsapp || '+91 98765 43210',
          workingHours: s.workingHours || 'Mon - Sat: 9:00 AM - 8:00 PM IST',
          instagram: s.instagram || 'https://instagram.com/digitalworld',
          facebook: s.facebook || 'https://facebook.com/digitalworld',
          twitter: s.twitter || 'https://twitter.com/digitalworld',
          youtube: s.youtube || 'https://youtube.com/digitalworld',
          linkedin: s.linkedin || 'https://linkedin.com/company/digitalworld',
          copyrightText: s.copyrightText || '© {year} Digital World Multi-Vendor Platform. All rights reserved.',

          // Feature 11: Platform Delivery Charge Settings
          deliveryCharge: s.deliveryCharge ?? 49,
          freeDeliveryThreshold: s.freeDeliveryThreshold ?? 499,
          minOrderValue: s.minOrderValue ?? 0,

          // Feature 15: Footer Navigation Links
          quickLinks: s.quickLinks?.length > 0 ? s.quickLinks : [
            { label: 'All Products', url: '/products' },
            { label: 'New Arrivals', url: '/products?sort=newest' },
            { label: 'Best Sellers', url: '/products?sort=bestselling' },
            { label: 'Combo Deals', url: '/combos' },
            { label: 'Become a Seller', url: '/seller/register' },
          ],
          customerServiceLinks: s.customerServiceLinks?.length > 0 ? s.customerServiceLinks : [
            { label: 'Track Order', url: '/track' },
            { label: 'Help & Contact', url: '/contact' },
            { label: 'Shipping Policy', url: '/shipping-policy' },
            { label: 'Returns & Refunds', url: '/returns' },
            { label: 'FAQs', url: '/faq' },
          ],
          policyLinks: s.policyLinks?.length > 0 ? s.policyLinks : [
            { label: 'Privacy Policy', url: '/privacy' },
            { label: 'Terms of Service', url: '/terms' },
            { label: 'Seller Policy', url: '/seller-policy' },
            { label: 'Quality & Authenticity', url: '/security' },
          ],
          sectionVisibility: {
            companyInfo: s.sectionVisibility?.companyInfo ?? true,
            quickLinks: s.sectionVisibility?.quickLinks ?? true,
            categories: s.sectionVisibility?.categories ?? true,
            policies: s.sectionVisibility?.policies ?? true,
            socialLinks: s.sectionVisibility?.socialLinks ?? true,
            paymentIcons: s.sectionVisibility?.paymentIcons ?? true,
          },
        });
      })
      .catch((err) => {
        console.error('Failed to load settings:', err);
        toast.error('Failed to load store settings');
      });
  }, []);

  async function submit(e) {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success('Settings saved successfully');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to save settings');
      }
    } catch {
      toast.error('Error saving settings');
    } finally {
      setSaving(false);
    }
  }

  function handleAddLink(field) {
    setForm((prev) => ({
      ...prev,
      [field]: [...(prev[field] || []), { label: 'New Link', url: '/' }],
    }));
  }

  function handleLinkChange(field, index, key, value) {
    setForm((prev) => {
      const updated = [...(prev[field] || [])];
      updated[index] = { ...updated[index], [key]: value };
      return { ...prev, [field]: updated };
    });
  }

  function handleRemoveLink(field, index) {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  }

  function handleToggleVisibility(key) {
    setForm((prev) => ({
      ...prev,
      sectionVisibility: {
        ...prev.sectionVisibility,
        [key]: !prev.sectionVisibility[key],
      },
    }));
  }

  if (!form) return <div className="p-8 text-[#6B6B6B]">Loading settings…</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[#E8E8E8] pb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#000000] tracking-tight">Platform Settings</h1>
          <p className="text-xs text-[#6B6B6B] mt-1">
            Configure delivery charges, platform business information, and website footer navigation.
          </p>
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#000000] text-white hover:bg-[#C9A227] hover:text-[#000000] transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
        >
          <Save size={15} />
          <span>{saving ? 'Saving…' : 'Save Changes'}</span>
        </button>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-[#E8E8E8] overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('delivery')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'delivery'
              ? 'border-[#000000] text-[#000000]'
              : 'border-transparent text-[#6B6B6B] hover:text-[#000000]'
          }`}
        >
          <Truck size={15} className="text-[#C9A227]" />
          <span>Delivery & Shipping (Feature 11)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('company')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'company'
              ? 'border-[#000000] text-[#000000]'
              : 'border-transparent text-[#6B6B6B] hover:text-[#000000]'
          }`}
        >
          <Building size={15} className="text-[#C9A227]" />
          <span>Company & Contact Info</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('social')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'social'
              ? 'border-[#000000] text-[#000000]'
              : 'border-transparent text-[#6B6B6B] hover:text-[#000000]'
          }`}
        >
          <Share2 size={15} className="text-[#C9A227]" />
          <span>Social Media Links</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('footer')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'footer'
              ? 'border-[#000000] text-[#000000]'
              : 'border-transparent text-[#6B6B6B] hover:text-[#000000]'
          }`}
        >
          <LinkIcon size={15} className="text-[#C9A227]" />
          <span>Footer Links & Visibility (Feature 15)</span>
        </button>
      </div>

      <form onSubmit={submit} className="space-y-6">
        {/* Tab 1: Delivery & Shipping */}
        {activeTab === 'delivery' && (
          <div className="bg-white rounded-2xl p-6 border border-[#E8E8E8] shadow-xs space-y-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-[#F0F0F0]">
              <div className="w-8 h-8 rounded-full bg-[#FAF7F0] flex items-center justify-center text-[#C9A227]">
                <Truck size={17} />
              </div>
              <div>
                <h2 className="font-bold text-sm text-[#000000]">Platform Delivery Charges (Feature 11)</h2>
                <p className="text-xs text-[#6B6B6B]">
                  Applied to platform-owned (admin) products and used as default fallback when sellers have not set custom rates.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#000000] mb-1.5">
                  Default Delivery Fee (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.deliveryCharge}
                  onChange={(e) => setForm({ ...form, deliveryCharge: Number(e.target.value) })}
                  className="w-full text-sm px-4 py-2.5 rounded-xl border border-[#D6D6D6] outline-none focus:border-[#000000]"
                />
                <p className="text-[11px] text-[#6B6B6B] mt-1">Standard shipping charge per supplier</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#000000] mb-1.5">
                  Free Delivery Threshold (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.freeDeliveryThreshold}
                  onChange={(e) => setForm({ ...form, freeDeliveryThreshold: Number(e.target.value) })}
                  className="w-full text-sm px-4 py-2.5 rounded-xl border border-[#D6D6D6] outline-none focus:border-[#000000]"
                />
                <p className="text-[11px] text-[#6B6B6B] mt-1">Orders above this amount get free shipping</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#000000] mb-1.5">
                  Minimum Order Value (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.minOrderValue}
                  onChange={(e) => setForm({ ...form, minOrderValue: Number(e.target.value) })}
                  className="w-full text-sm px-4 py-2.5 rounded-xl border border-[#D6D6D6] outline-none focus:border-[#000000]"
                />
                <p className="text-[11px] text-[#6B6B6B] mt-1">Set to 0 for no minimum purchase</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF7F0] border border-[#E7E2D6] flex items-start gap-3">
              <CheckCircle size={18} className="text-[#C9A227] shrink-0 mt-0.5" />
              <div className="text-xs text-[#5E5E5E] space-y-1">
                <p className="font-bold text-[#000000]">Multi-Seller Cart Delivery Logic</p>
                <p>
                  When a customer buys items from multiple suppliers, the platform evaluates each supplier’s package subtotal independently against their free delivery threshold. Suppliers with subtotal ≥ threshold grant free delivery, while other packages apply their respective delivery fees. The customer sees a transparent itemized breakdown at checkout.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Company Information */}
        {activeTab === 'company' && (
          <div className="bg-white rounded-2xl p-6 border border-[#E8E8E8] shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 pb-4 border-b border-[#F0F0F0]">
              <div className="w-8 h-8 rounded-full bg-[#FAF7F0] flex items-center justify-center text-[#C9A227]">
                <Building size={17} />
              </div>
              <div>
                <h2 className="font-bold text-sm text-[#000000]">Company & Contact Information</h2>
                <p className="text-xs text-[#6B6B6B]">Displayed on website footer and official order communications.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#000000] mb-1.5">
                  Store / Platform Name *
                </label>
                <input
                  type="text"
                  value={form.storeName}
                  onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                  className="w-full text-sm px-4 py-2.5 rounded-xl border border-[#D6D6D6] outline-none focus:border-[#000000]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#000000] mb-1.5">
                  Working Hours
                </label>
                <input
                  type="text"
                  value={form.workingHours}
                  onChange={(e) => setForm({ ...form, workingHours: e.target.value })}
                  className="w-full text-sm px-4 py-2.5 rounded-xl border border-[#D6D6D6] outline-none focus:border-[#000000]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#000000] mb-1.5">
                  Support Phone Number
                </label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full text-sm px-4 py-2.5 rounded-xl border border-[#D6D6D6] outline-none focus:border-[#000000]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#000000] mb-1.5">
                  Support Email Address
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full text-sm px-4 py-2.5 rounded-xl border border-[#D6D6D6] outline-none focus:border-[#000000]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#000000] mb-1.5">
                  WhatsApp Support Number
                </label>
                <input
                  type="text"
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                  className="w-full text-sm px-4 py-2.5 rounded-xl border border-[#D6D6D6] outline-none focus:border-[#000000]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#000000] mb-1.5">
                  Registered Physical Address
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full text-sm px-4 py-2.5 rounded-xl border border-[#D6D6D6] outline-none focus:border-[#000000]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#000000] mb-1.5">
                About Platform (Footer Description)
              </label>
              <textarea
                rows={3}
                value={form.aboutUs}
                onChange={(e) => setForm({ ...form, aboutUs: e.target.value })}
                className="w-full text-sm px-4 py-2.5 rounded-xl border border-[#D6D6D6] outline-none focus:border-[#000000]"
              />
            </div>
          </div>
        )}

        {/* Tab 3: Social Media Links */}
        {activeTab === 'social' && (
          <div className="bg-white rounded-2xl p-6 border border-[#E8E8E8] shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-4 border-b border-[#F0F0F0]">
              <div className="w-8 h-8 rounded-full bg-[#FAF7F0] flex items-center justify-center text-[#C9A227]">
                <Share2 size={17} />
              </div>
              <div>
                <h2 className="font-bold text-sm text-[#000000]">Social Media Links</h2>
                <p className="text-xs text-[#6B6B6B]">URL handles displayed as clickable icons in the footer.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#000000] mb-1.5">
                  Instagram URL
                </label>
                <input
                  type="url"
                  value={form.instagram}
                  onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                  className="w-full text-sm px-4 py-2.5 rounded-xl border border-[#D6D6D6] outline-none focus:border-[#000000]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#000000] mb-1.5">
                  Facebook URL
                </label>
                <input
                  type="url"
                  value={form.facebook}
                  onChange={(e) => setForm({ ...form, facebook: e.target.value })}
                  className="w-full text-sm px-4 py-2.5 rounded-xl border border-[#D6D6D6] outline-none focus:border-[#000000]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#000000] mb-1.5">
                  Twitter / X URL
                </label>
                <input
                  type="url"
                  value={form.twitter}
                  onChange={(e) => setForm({ ...form, twitter: e.target.value })}
                  className="w-full text-sm px-4 py-2.5 rounded-xl border border-[#D6D6D6] outline-none focus:border-[#000000]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#000000] mb-1.5">
                  YouTube Channel URL
                </label>
                <input
                  type="url"
                  value={form.youtube}
                  onChange={(e) => setForm({ ...form, youtube: e.target.value })}
                  className="w-full text-sm px-4 py-2.5 rounded-xl border border-[#D6D6D6] outline-none focus:border-[#000000]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#000000] mb-1.5">
                  LinkedIn Page URL
                </label>
                <input
                  type="url"
                  value={form.linkedin}
                  onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                  className="w-full text-sm px-4 py-2.5 rounded-xl border border-[#D6D6D6] outline-none focus:border-[#000000]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Footer Navigation & Visibility (Feature 15) */}
        {activeTab === 'footer' && (
          <div className="space-y-6">
            {/* Section Visibility Toggles */}
            <div className="bg-white rounded-2xl p-6 border border-[#E8E8E8] shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-4 border-b border-[#F0F0F0]">
                <div className="w-8 h-8 rounded-full bg-[#FAF7F0] flex items-center justify-center text-[#C9A227]">
                  <Eye size={17} />
                </div>
                <div>
                  <h2 className="font-bold text-sm text-[#000000]">Footer Section Visibility</h2>
                  <p className="text-xs text-[#6B6B6B]">Toggle individual footer sections on or off.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { key: 'companyInfo', label: 'Company Info & Address' },
                  { key: 'quickLinks', label: 'Quick Links' },
                  { key: 'categories', label: 'Categories Menu' },
                  { key: 'policies', label: 'Policies & Legal' },
                  { key: 'socialLinks', label: 'Social Media Icons' },
                  { key: 'paymentIcons', label: 'Payment Method Badges' },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center gap-2 p-3 rounded-xl border border-[#E8E8E8] hover:bg-[#FAF7F0] cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={form.sectionVisibility?.[item.key] ?? true}
                      onChange={() => handleToggleVisibility(item.key)}
                      className="accent-[#000000] w-4 h-4 rounded"
                    />
                    <span className="text-xs font-medium text-[#000000]">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Quick Links Manager */}
            <div className="bg-white rounded-2xl p-6 border border-[#E8E8E8] shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#F0F0F0]">
                <div>
                  <h3 className="font-bold text-sm text-[#000000]">Quick Links</h3>
                  <p className="text-xs text-[#6B6B6B]">Navigation links for customers</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleAddLink('quickLinks')}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold border border-[#000000] hover:bg-[#000000] hover:text-white transition-colors flex items-center gap-1"
                >
                  <Plus size={13} />
                  <span>Add Link</span>
                </button>
              </div>

              <div className="space-y-2">
                {form.quickLinks?.map((link, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Label"
                      value={link.label}
                      onChange={(e) => handleLinkChange('quickLinks', idx, 'label', e.target.value)}
                      className="flex-1 text-xs px-3 py-2 rounded-lg border border-[#D6D6D6]"
                    />
                    <input
                      type="text"
                      placeholder="URL (e.g. /products)"
                      value={link.url}
                      onChange={(e) => handleLinkChange('quickLinks', idx, 'url', e.target.value)}
                      className="flex-1 text-xs px-3 py-2 rounded-lg border border-[#D6D6D6]"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveLink('quickLinks', idx)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Care Links */}
            <div className="bg-white rounded-2xl p-6 border border-[#E8E8E8] shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#F0F0F0]">
                <div>
                  <h3 className="font-bold text-sm text-[#000000]">Customer Service Links</h3>
                  <p className="text-xs text-[#6B6B6B]">Support, tracking, and FAQ links</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleAddLink('customerServiceLinks')}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold border border-[#000000] hover:bg-[#000000] hover:text-white transition-colors flex items-center gap-1"
                >
                  <Plus size={13} />
                  <span>Add Link</span>
                </button>
              </div>

              <div className="space-y-2">
                {form.customerServiceLinks?.map((link, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Label"
                      value={link.label}
                      onChange={(e) => handleLinkChange('customerServiceLinks', idx, 'label', e.target.value)}
                      className="flex-1 text-xs px-3 py-2 rounded-lg border border-[#D6D6D6]"
                    />
                    <input
                      type="text"
                      placeholder="URL"
                      value={link.url}
                      onChange={(e) => handleLinkChange('customerServiceLinks', idx, 'url', e.target.value)}
                      className="flex-1 text-xs px-3 py-2 rounded-lg border border-[#D6D6D6]"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveLink('customerServiceLinks', idx)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Policy & Legal Links */}
            <div className="bg-white rounded-2xl p-6 border border-[#E8E8E8] shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#F0F0F0]">
                <div>
                  <h3 className="font-bold text-sm text-[#000000]">Policy & Legal Links</h3>
                  <p className="text-xs text-[#6B6B6B]">Terms, privacy, and compliance links</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleAddLink('policyLinks')}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold border border-[#000000] hover:bg-[#000000] hover:text-white transition-colors flex items-center gap-1"
                >
                  <Plus size={13} />
                  <span>Add Link</span>
                </button>
              </div>

              <div className="space-y-2">
                {form.policyLinks?.map((link, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Label"
                      value={link.label}
                      onChange={(e) => handleLinkChange('policyLinks', idx, 'label', e.target.value)}
                      className="flex-1 text-xs px-3 py-2 rounded-lg border border-[#D6D6D6]"
                    />
                    <input
                      type="text"
                      placeholder="URL"
                      value={link.url}
                      onChange={(e) => handleLinkChange('policyLinks', idx, 'url', e.target.value)}
                      className="flex-1 text-xs px-3 py-2 rounded-lg border border-[#D6D6D6]"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveLink('policyLinks', idx)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Copyright Text */}
            <div className="bg-white rounded-2xl p-6 border border-[#E8E8E8] shadow-xs space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#000000]">
                Copyright Text Notice
              </label>
              <input
                type="text"
                value={form.copyrightText}
                onChange={(e) => setForm({ ...form, copyrightText: e.target.value })}
                className="w-full text-sm px-4 py-2.5 rounded-xl border border-[#D6D6D6] outline-none focus:border-[#000000]"
              />
              <p className="text-[11px] text-[#6B6B6B]">
                Tip: Use <strong>&#123;year&#125;</strong> to automatically display the current year ({new Date().getFullYear()}).
              </p>
            </div>
          </div>
        )}

        {/* Save Footer Button */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl text-xs font-bold bg-[#000000] text-white hover:bg-[#C9A227] hover:text-[#000000] transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            <Save size={15} />
            <span>{saving ? 'Saving Settings…' : 'Save All Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
