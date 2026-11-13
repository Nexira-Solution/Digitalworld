'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Clock, CheckCircle2, XCircle, AlertCircle, RefreshCw, ArrowRight, Store } from 'lucide-react';

const INK = '#000000';
const INK_SOFT = '#6B6B6B';
const GOLD = '#C9A227';
const PAPER = '#FFFFFF';

export default function SellerPendingPage() {
  const router = useRouter();
  const [sellerStatus, setSellerStatus] = useState('pending');
  const [sellerData, setSellerData] = useState(null);
  const [checking, setChecking] = useState(false);
  const [approvedRedirecting, setApprovedRedirecting] = useState(false);

  async function checkLiveStatus() {
    setChecking(true);
    try {
      const res = await fetch('/api/seller/status', { cache: 'no-store' });
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/seller/login');
          return;
        }
      }
      const data = await res.json();
      if (data.authenticated && data.seller) {
        setSellerData(data.seller);
        setSellerStatus(data.seller.status);

        if (data.seller.status === 'approved') {
          setApprovedRedirecting(true);
          setTimeout(() => {
            router.push('/seller/dashboard');
            router.refresh();
          }, 1500);
        }
      }
    } catch (err) {
      console.error('Error polling seller status:', err);
    } finally {
      setChecking(false);
    }
  }

  // Automatic real-time polling every 4 seconds
  useEffect(() => {
    checkLiveStatus();
    const interval = setInterval(() => {
      checkLiveStatus();
    }, 4000);

    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: PAPER }}>
      <div className="w-full max-w-md p-8 rounded-2xl border border-[#E8E8E8] shadow-sm text-center">
        {approvedRedirecting ? (
          <div>
            <div className="w-16 h-16 rounded-full bg-[#E3F3E8] text-[#1B8A3E] flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle2 size={36} />
            </div>
            <h1 className="text-xl font-bold text-[#1B8A3E] mb-2">
              Account Approved!
            </h1>
            <p className="text-xs sm:text-sm text-[#6B6B6B] mb-4">
              Your business has been verified. Redirecting you to your seller dashboard…
            </p>
          </div>
        ) : sellerStatus === 'rejected' ? (
          <div>
            <div className="w-16 h-16 rounded-full bg-[#FCE8E6] text-[#B3261E] flex items-center justify-center mx-auto mb-4">
              <XCircle size={36} />
            </div>
            <h1 className="text-xl font-bold text-[#B3261E] mb-1">
              Application Not Approved
            </h1>
            <p className="text-xs sm:text-sm text-[#6B6B6B] mb-4">
              Your application for <strong>{sellerData?.businessName || 'Seller'}</strong> could not be approved at this time.
            </p>

            {sellerData?.rejectionReason && (
              <div className="p-3.5 rounded-xl bg-[#FCE8E6] text-xs text-left mb-6 border border-[#B3261E]/20">
                <span className="font-bold text-[#B3261E] block mb-1">Reason provided by Admin:</span>
                <p className="text-[#333333]">{sellerData.rejectionReason}</p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Link
                href="/seller/register"
                className="py-3 px-6 text-xs font-bold tracking-wider uppercase rounded-xl bg-[#000000] text-white hover:bg-neutral-800 transition-all"
              >
                Re-apply with updated details
              </Link>
              <Link href="/" className="text-xs text-[#6B6B6B] hover:text-[#000000] transition-colors py-1">
                ← Back to store
              </Link>
            </div>
          </div>
        ) : sellerStatus === 'suspended' ? (
          <div>
            <div className="w-16 h-16 rounded-full bg-[#FCE8E6] text-[#B3261E] flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={36} />
            </div>
            <h1 className="text-xl font-bold text-[#B3261E] mb-1">
              Account Suspended
            </h1>
            <p className="text-xs sm:text-sm text-[#6B6B6B] mb-4">
              Your seller account is temporarily suspended.
            </p>

            {sellerData?.suspensionReason && (
              <div className="p-3.5 rounded-xl bg-[#FCE8E6] text-xs text-left mb-6 border border-[#B3261E]/20">
                <span className="font-bold text-[#B3261E] block mb-1">Suspension Reason:</span>
                <p className="text-[#333333]">{sellerData.suspensionReason}</p>
              </div>
            )}

            <Link href="/" className="text-xs text-[#6B6B6B] hover:text-[#000000] transition-colors py-1">
              ← Back to store
            </Link>
          </div>
        ) : (
          /* Normal Pending State */
          <div>
            <div className="w-16 h-16 rounded-full bg-[#FBF3D9] text-[#8A6D1B] flex items-center justify-center mx-auto mb-4">
              <Clock size={32} />
            </div>

            <span className="text-[11px] font-bold tracking-[2px] uppercase text-[#C9A227]">
              Real-time Status
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-[#000000] mt-1 mb-2">
              Pending Admin Approval
            </h1>

            <p className="text-xs sm:text-sm text-[#6B6B6B] leading-relaxed mb-6">
              Your business application for <strong>{sellerData?.businessName || 'your business'}</strong> has been received and is currently under review by our administrators.
            </p>

            <div className="p-3.5 rounded-xl bg-[#FAFAFA] border border-[#E8E8E8] text-xs text-left mb-6 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[#6B6B6B]">Live Status:</span>
                <span className="inline-flex items-center gap-1.5 font-bold text-[#8A6D1B] bg-[#FBF3D9] px-2.5 py-0.5 rounded-full uppercase text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8A6D1B] animate-ping" />
                  <span>Awaiting Review</span>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Auto-checking:</span>
                <span className="font-medium text-[#1A1A1A]">Every 4 seconds</span>
              </div>
            </div>

            <p className="text-[11px] text-[#9A9A9A] mb-5">
              You do not need to refresh this page. As soon as an administrator approves your account, you will be automatically redirected to your seller portal.
            </p>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={checkLiveStatus}
                disabled={checking}
                className="py-2.5 px-4 text-xs font-semibold rounded-xl border border-[#D6D6D6] hover:border-[#000000] text-[#000000] flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <RefreshCw size={13} className={checking ? 'animate-spin' : ''} />
                <span>{checking ? 'Checking Status…' : 'Check Status Now'}</span>
              </button>

              <Link
                href="/seller/login"
                className="text-xs text-[#6B6B6B] hover:text-[#000000] transition-colors py-2"
              >
                Back to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
