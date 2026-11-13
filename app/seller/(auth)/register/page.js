'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Store, User, Mail, Lock, Phone, MessageSquare, MapPin, FileText, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

const INK = '#000000';
const INK_SOFT = '#6B6B6B';
const GOLD = '#C9A227';
const LINE = '#E8E8E8';
const PAPER = '#FFFFFF';

export default function SellerRegisterPage() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    businessName: '',
    businessPhone: '',
    whatsappNumber: '',
    shopAddress: '',
    gstNumber: '',
  });

  const [samePhone, setSamePhone] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submittedData, setSubmittedData] = useState(null);

  function updateField(key, value) {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === 'businessPhone' && samePhone) {
        next.whatsappNumber = value;
      }
      return next;
    });
  }

  function handleSamePhoneToggle(checked) {
    setSamePhone(checked);
    if (checked) {
      setForm((f) => ({ ...f, whatsappNumber: f.businessPhone }));
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/seller/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed. Please check your inputs.');
        setLoading(false);
        return;
      }

      setSubmittedData(data.seller || { id: 'submitted', businessName: form.businessName });
    } catch {
      setError('Network connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (submittedData) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: PAPER }}>
        <div className="w-full max-w-md p-8 rounded-2xl border border-[#E8E8E8] shadow-sm text-center">
          <div className="w-14 h-14 rounded-full bg-[#FAF7F0] flex items-center justify-center mx-auto mb-4 text-[#C9A227]">
            <CheckCircle2 size={32} />
          </div>

          <span className="text-[11px] font-bold tracking-[2px] uppercase text-[#C9A227]">
            Registration Successful
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-[#000000] mt-1 mb-2">
            Application Submitted
          </h1>

          <p className="text-xs sm:text-sm text-[#6B6B6B] leading-relaxed mb-6">
            Thank you for registering <strong>{submittedData.businessName || form.businessName}</strong>.
            Your account is currently under review by our administrator team. You will be able to log in and start adding products as soon as it is approved.
          </p>

          <div className="p-3.5 rounded-xl bg-[#FAFAFA] border border-[#E8E8E8] text-xs text-left mb-6 space-y-1">
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">Seller Account:</span>
              <span className="font-semibold text-black">{form.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">Initial Status:</span>
              <span className="font-bold text-[#C9A227] uppercase">Pending Admin Approval</span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <Link
              href="/seller/login"
              className="w-full py-3 px-6 text-xs font-bold tracking-wider uppercase rounded-xl bg-[#000000] text-white hover:bg-neutral-800 transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>Go to Seller Login</span>
              <ArrowRight size={14} />
            </Link>
            <Link
              href="/"
              className="text-xs text-[#6B6B6B] hover:text-[#000000] transition-colors py-1"
            >
              ← Return to Main Store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-white">
      <div className="w-full max-w-lg p-6 sm:p-8 rounded-2xl border border-[#E8E8E8] shadow-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-[#FAF7F0] flex items-center justify-center mx-auto mb-3 text-[#C9A227]">
            <Store size={24} />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#000000]">
            Become a Verified Seller
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#6B6B6B]">
            Join Z Princess marketplace and expand your business to thousands of shoppers.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-[#FCE8E6] border border-[#B3261E]/20 text-[#B3261E] text-xs flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Full Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#000000] mb-1.5">
                Full Name *
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A9A9A]" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={form.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#D6D6D6] outline-none focus:border-[#000000] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#000000] mb-1.5">
                Email Address *
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A9A9A]" />
                <input
                  type="email"
                  required
                  placeholder="seller@example.com"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#D6D6D6] outline-none focus:border-[#000000] transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#000000] mb-1.5">
              Account Password *
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A9A9A]" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="At least 6 characters"
                value={form.password}
                onChange={(e) => updateField('password', e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#D6D6D6] outline-none focus:border-[#000000] transition-colors"
              />
            </div>
          </div>

          {/* Business / Shop Name */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#000000] mb-1.5">
              Shop / Business Name *
            </label>
            <div className="relative">
              <Store size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A9A9A]" />
              <input
                type="text"
                required
                placeholder="e.g. Royal Spices & Snacks"
                value={form.businessName}
                onChange={(e) => updateField('businessName', e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#D6D6D6] outline-none focus:border-[#000000] transition-colors"
              />
            </div>
          </div>

          {/* Phone Numbers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#000000] mb-1.5">
                Business Phone *
              </label>
              <div className="relative">
                <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A9A9A]" />
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="10-digit mobile"
                  value={form.businessPhone}
                  onChange={(e) => updateField('businessPhone', e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#D6D6D6] outline-none focus:border-[#000000] transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#000000]">
                  WhatsApp Number *
                </label>
                <label className="flex items-center gap-1 text-[10.5px] text-[#6B6B6B] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={samePhone}
                    onChange={(e) => handleSamePhoneToggle(e.target.checked)}
                    className="rounded"
                  />
                  <span>Same</span>
                </label>
              </div>
              <div className="relative">
                <MessageSquare size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A9A9A]" />
                <input
                  type="tel"
                  required
                  disabled={samePhone}
                  maxLength={10}
                  placeholder="WhatsApp number"
                  value={samePhone ? form.businessPhone : form.whatsappNumber}
                  onChange={(e) => updateField('whatsappNumber', e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#D6D6D6] outline-none focus:border-[#000000] disabled:bg-[#FAFAFA] transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Shop / Business Address */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#000000] mb-1.5">
              Shop / Warehouse Address *
            </label>
            <div className="relative">
              <MapPin size={15} className="absolute left-3.5 top-3 text-[#9A9A9A]" />
              <textarea
                required
                rows={2}
                placeholder="Door no, street, city, state, pincode"
                value={form.shopAddress}
                onChange={(e) => updateField('shopAddress', e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#D6D6D6] outline-none focus:border-[#000000] transition-colors"
              />
            </div>
          </div>

          {/* GSTIN (Optional) */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#000000] mb-1.5">
              GST Number (GSTIN, Optional)
            </label>
            <div className="relative">
              <FileText size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A9A9A]" />
              <input
                type="text"
                maxLength={15}
                placeholder="e.g. 22AAAAA0000A1Z5"
                value={form.gstNumber}
                onChange={(e) => updateField('gstNumber', e.target.value.toUpperCase())}
                className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#D6D6D6] outline-none focus:border-[#000000] uppercase font-mono tracking-wider transition-colors"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 text-xs sm:text-sm font-bold tracking-wider uppercase rounded-xl bg-[#000000] text-white hover:bg-neutral-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin text-[#C9A227]" />
                <span>Registering Account…</span>
              </>
            ) : (
              <span>Submit Seller Application</span>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-[#E8E8E8] text-center flex flex-col gap-1.5">
          <Link href="/seller/login" className="text-xs text-[#000000] font-semibold hover:underline">
            Already registered? Log in to your portal →
          </Link>
          <Link href="/" className="text-xs text-[#6B6B6B] hover:text-[#000000] transition-colors">
            ← Back to marketplace
          </Link>
        </div>
      </div>
    </div>
  );
}
