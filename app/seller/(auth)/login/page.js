'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Clock, XCircle, AlertCircle, Mail, Phone, ArrowRight, ShieldAlert } from 'lucide-react';

const INK = '#000000';
const INK_SOFT = '#6B6B6B';
const GOLD = '#C9A227';
const LINE = '#E8E8E8';
const PAPER = '#FFFFFF';

export default function SellerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingSeller, setPendingSeller] = useState(null);
  const [rejectedInfo, setRejectedInfo] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setPendingSeller(null);
    setRejectedInfo(null);
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403 && data.status === 'rejected') {
          setRejectedInfo({
            reason: data.reason,
            contactEmail: data.contactEmail || 'support@digitalworld.com',
            contactPhone: data.contactPhone || '+91 98765 43210',
          });
          setLoading(false);
          return;
        }
        setError(data.error || 'Login failed.');
        setLoading(false);
        return;
      }

      const { role, status } = data.admin;

      if (role === 'superadmin') {
        router.push('/admin/dashboard');
      } else if (status === 'pending') {
        // Requirement 10: Show pending approval message with registration & contact info
        setPendingSeller({
          name: data.admin.name,
          email: data.admin.email,
          contactEmail: 'support@digitalworld.com',
          contactPhone: '+91 98765 43210',
        });
        setLoading(false);
        return;
      } else {
        router.push('/seller/dashboard');
      }
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: PAPER }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-[16px] font-bold tracking-[2px] uppercase text-[#000000]">
            Seller Portal Login
          </h1>
          <div className="mt-2 mx-auto" style={{ width: '36px', height: '2px', background: GOLD }} />
        </div>

        {/* STATE A: Pending Admin Approval Alert (Requirement 10) */}
        {pendingSeller ? (
          <div className="p-6 rounded-2xl border border-[#C9A227]/40 bg-[#FAF7EE] shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#F5E8BE] text-[#8A6D1B] flex items-center justify-center mx-auto">
              <Clock size={24} />
            </div>

            <div className="text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F5E8BE] text-[#8A6D1B]">
                Approval Status: Pending
              </span>
              <h2 className="text-base font-bold text-[#000000] pt-1">
                Awaiting Admin Verification
              </h2>
              <p className="text-xs text-[#5E5E5E] leading-relaxed">
                Your seller account is currently awaiting admin approval. You will be able to access your seller dashboard once your account has been approved.
              </p>
            </div>

            {/* Registration Details */}
            <div className="p-3.5 rounded-xl bg-white border border-[#E7E2D6] text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Registered Name:</span>
                <span className="font-semibold text-[#0F172A]">{pendingSeller.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Registered Email:</span>
                <span className="font-semibold text-[#0F172A]">{pendingSeller.email}</span>
              </div>
            </div>

            {/* Next Step & Contact Information */}
            <div className="p-3.5 rounded-xl bg-white border border-[#E7E2D6] text-xs space-y-1.5">
              <span className="text-[10px] font-bold uppercase text-[#64748B] block">Contact Support</span>
              <div className="flex items-center gap-2 text-[#0F172A]">
                <Mail size={13} className="text-[#C9A227]" />
                <a href={`mailto:${pendingSeller.contactEmail}`} className="hover:underline">
                  {pendingSeller.contactEmail}
                </a>
              </div>
              <div className="flex items-center gap-2 text-[#0F172A]">
                <Phone size={13} className="text-[#C9A227]" />
                <span>{pendingSeller.contactPhone}</span>
              </div>
            </div>

            <p className="text-[11px] text-[#64748B] text-center">
              Our compliance team reviews applications within 24 hours. You will receive an email confirmation once activated.
            </p>

            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/seller/pending"
                className="w-full py-2.5 text-xs font-bold rounded-xl bg-[#000000] text-white text-center hover:bg-neutral-800 transition-colors"
              >
                View Live Verification Status →
              </Link>
              <button
                type="button"
                onClick={() => setPendingSeller(null)}
                className="text-xs text-[#64748B] hover:text-[#000000] text-center py-1 font-medium"
              >
                Sign in with another account
              </button>
            </div>
          </div>
        ) : rejectedInfo ? (
          /* STATE B: Rejected Application Alert (Requirement 10) */
          <div className="p-6 rounded-2xl border border-[#B3261E]/30 bg-[#FCE8E6] shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-full bg-white text-[#B3261E] flex items-center justify-center mx-auto border border-[#B3261E]/20">
              <XCircle size={26} />
            </div>

            <div className="text-center space-y-1">
              <h2 className="text-base font-bold text-[#B3261E]">
                Your seller account has not been approved.
              </h2>
              <p className="text-xs text-[#5E5E5E]">
                We are unable to activate your seller account at this time based on the criteria below.
              </p>
            </div>

            {rejectedInfo.reason && (
              <div className="p-3.5 rounded-xl bg-white border border-[#B3261E]/20 text-xs text-left">
                <span className="font-bold text-[#B3261E] block mb-1">Rejection Remarks:</span>
                <p className="text-[#333333] leading-relaxed">{rejectedInfo.reason}</p>
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-white border border-[#B3261E]/20 text-xs space-y-1.5">
              <span className="text-[10px] font-bold uppercase text-[#64748B] block">Contact Support</span>
              <div className="flex items-center gap-2 text-[#0F172A]">
                <Mail size={13} className="text-[#B3261E]" />
                <a href={`mailto:${rejectedInfo.contactEmail}`} className="hover:underline">
                  {rejectedInfo.contactEmail}
                </a>
              </div>
              <div className="flex items-center gap-2 text-[#0F172A]">
                <Phone size={13} className="text-[#B3261E]" />
                <span>{rejectedInfo.contactPhone}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/seller/register"
                className="w-full py-2.5 text-xs font-bold rounded-xl bg-[#000000] text-white text-center hover:bg-neutral-800 transition-colors uppercase tracking-wider"
              >
                Re-apply with updated details
              </Link>
              <button
                type="button"
                onClick={() => setRejectedInfo(null)}
                className="text-xs text-[#64748B] hover:text-[#000000] text-center py-1 font-medium"
              >
                Back to Login
              </button>
            </div>
          </div>
        ) : (
          /* Normal Login Form */
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-[11px] tracking-[1.5px] uppercase mb-1.5" style={{ color: INK_SOFT }}>
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#D6D6D6] outline-none focus:border-[#000000]"
                placeholder="you@sellerbrand.com"
              />
            </div>

            <div>
              <label className="block text-[11px] tracking-[1.5px] uppercase mb-1.5" style={{ color: INK_SOFT }}>
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#D6D6D6] outline-none focus:border-[#000000]"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-[#B3261E] flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 py-3 text-[12px] font-bold tracking-[1.5px] uppercase rounded-xl transition-all shadow-sm"
              style={{ background: INK, color: PAPER, opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Authenticating…' : 'Access Seller Portal'}
            </button>

            <div className="mt-6 text-center flex flex-col gap-2">
              <Link href="/seller/register" className="text-xs text-[#64748B] hover:text-[#000000] font-medium">
                New supplier? Register business profile →
              </Link>
              <Link href="/" className="text-xs text-[#64748B] hover:text-[#000000]">
                ← Back to marketplace
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
