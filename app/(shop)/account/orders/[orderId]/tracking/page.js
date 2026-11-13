'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  ChevronRight,
  Home,
  ShieldCheck,
  CreditCard,
  IndianRupee,
  Phone,
  ArrowLeft,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { formatINR } from '@/lib/utils';

export default function OrderTrackingPage() {
  const params = useParams();
  const orderId = params.orderId || params.id;
  const router = useRouter();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  function loadTracking(isRefresh = false) {
    if (!orderId) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    fetch(`/api/orders/${orderId}/tracking`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setData(res);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }

  useEffect(() => {
    loadTracking();
  }, [orderId]); // eslint-disable-line

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 bg-[#FAFAFA]">
        <div className="w-10 h-10 rounded-full border-2 border-[#E8E8E8] border-t-[#C9A227] animate-spin" />
        <p className="text-xs font-semibold text-[#6B6B6B] tracking-wider uppercase">
          Loading Order Tracking…
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4 bg-[#FAFAFA]">
        <div className="w-14 h-14 rounded-full bg-[#FAF7EE] text-[#C9A227] flex items-center justify-center border border-[#E7E2D6]">
          <Package size={26} />
        </div>
        <h1 className="text-2xl font-bold text-[#000000]">Order Not Found</h1>
        <p className="text-sm text-[#6B6B6B] max-w-md">
          We could not locate this order tracking reference. Please check your order ID or phone number.
        </p>
        <Link
          href="/orders"
          className="px-6 py-2.5 rounded-full text-xs font-bold bg-[#000000] text-white hover:bg-neutral-800 transition-all shadow-sm"
        >
          Check My Orders
        </Link>
      </div>
    );
  }

  const {
    orderNumber,
    createdAt,
    currentStatus,
    paymentStatus,
    paymentMethod,
    total,
    subtotal,
    shippingFee,
    items,
    customer,
    courier,
    estimatedDelivery,
    trackingEvents,
    stages,
  } = data;

  const formattedDate = new Date(createdAt || Date.now()).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-24">
      {/* ======================= BREADCRUMB ======================= */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <nav className="flex items-center gap-2 text-xs text-[#6B6B6B]">
          <Link href="/" className="flex items-center gap-1 hover:text-[#000000] transition-colors">
            <Home size={13} />
            <span>Home</span>
          </Link>
          <ChevronRight size={12} className="text-[#CCCCCC]" />
          <Link href="/orders" className="hover:text-[#000000] transition-colors">
            Orders
          </Link>
          <ChevronRight size={12} className="text-[#CCCCCC]" />
          <span className="font-semibold text-[#000000]">Tracking #{orderNumber}</span>
        </nav>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* ======================= ORDER SUMMARY CARD ======================= */}
        <div className="rounded-3xl bg-white border border-[#E8E8E8] p-6 sm:p-8 shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E8E8] pb-5">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider">
                  Order ID
                </span>
                <span className="font-mono font-bold text-base text-[#000000]">
                  #{orderNumber}
                </span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                    currentStatus === 'delivered'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : currentStatus === 'cancelled'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-[#FAF7EE] text-[#000000] border border-[#E7E2D6]'
                  }`}
                >
                  {currentStatus.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs text-[#6B6B6B] mt-1">Placed on {formattedDate}</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => loadTracking(true)}
                disabled={refreshing}
                className="p-2.5 rounded-xl border border-[#E8E8E8] text-[#000000] hover:bg-neutral-50 transition-all flex items-center gap-1.5 text-xs font-semibold"
                title="Refresh tracking status"
              >
                <RefreshCw size={14} className={refreshing ? 'animate-spin text-[#C9A227]' : ''} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <Link
                href={`/invoice/${orderId}`}
                target="_blank"
                className="px-4 py-2.5 rounded-xl bg-[#000000] text-white hover:bg-neutral-800 transition-all text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <span>Invoice</span>
                <ExternalLink size={12} className="text-[#C9A227]" />
              </Link>
            </div>
          </div>

          {/* Delivery & Payment Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Estimated Range */}
            <div className="rounded-2xl bg-[#FAF7EE] p-4 border border-[#E7E2D6]">
              <div className="flex items-center gap-2 text-xs font-bold text-[#000000]">
                <Clock size={16} className="text-[#C9A227]" />
                <span>Estimated Delivery</span>
              </div>
              <div className="text-base font-extrabold text-[#000000] mt-1.5">
                {estimatedDelivery?.formattedRange || '5 - 6 Days'}
              </div>
              <p className="text-[11px] text-[#6B6B6B] mt-0.5">Dispatched via insured express logistics</p>
            </div>

            {/* Courier Details */}
            <div className="rounded-2xl bg-white p-4 border border-[#E8E8E8]">
              <div className="flex items-center gap-2 text-xs font-bold text-[#000000]">
                <Truck size={16} className="text-[#C9A227]" />
                <span>Logistics Partner</span>
              </div>
              <div className="text-sm font-bold text-[#000000] mt-1.5">
                {courier?.partner || 'Express Surface Logistics'}
              </div>
              <p className="text-[11px] font-mono text-[#6B6B6B] mt-0.5 truncate">
                {courier?.awbNumber || courier?.trackingId
                  ? `AWB: ${courier?.awbNumber || courier?.trackingId}`
                  : 'Tracking AWB will generate upon dispatch'}
              </p>
            </div>

            {/* Payment Method */}
            <div className="rounded-2xl bg-white p-4 border border-[#E8E8E8]">
              <div className="flex items-center gap-2 text-xs font-bold text-[#000000]">
                <CreditCard size={16} className="text-[#C9A227]" />
                <span>Payment Summary</span>
              </div>
              <div className="text-sm font-bold text-[#000000] mt-1.5 uppercase">
                {paymentMethod} •{' '}
                <span className={paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}>
                  {paymentStatus}
                </span>
              </div>
              <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                Total Payable: <strong className="text-black">{formatINR(total)}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* ======================= TRACKING PROGRESS STEPPER ======================= */}
        <div className="rounded-3xl bg-white border border-[#E8E8E8] p-6 sm:p-8 shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-6">
          <h2 className="text-base sm:text-lg font-bold text-[#000000] flex items-center gap-2">
            <Truck size={18} className="text-[#C9A227]" />
            <span>Shipment Lifecycle Progress</span>
          </h2>

          {/* Horizontal Desktop Stepper */}
          <div className="hidden lg:flex items-center justify-between relative px-2">
            {/* Background progress bar line */}
            <div className="absolute left-8 right-8 top-5 h-1 bg-[#E8E8E8] z-0" />

            {stages.map((stage, idx) => (
              <div key={stage.key} className="relative z-10 flex flex-col items-center text-center max-w-[110px]">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                    stage.isCompleted
                      ? 'bg-[#C9A227] text-white shadow-sm'
                      : stage.isCurrent
                      ? 'bg-[#000000] text-[#C9A227] ring-4 ring-[#FAF7EE] shadow-md scale-110'
                      : 'bg-white border-2 border-[#E8E8E8] text-[#999999]'
                  }`}
                >
                  {stage.isCompleted ? (
                    <CheckCircle2 size={18} strokeWidth={2.5} />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                <div className="mt-3">
                  <div
                    className={`text-xs font-bold leading-tight ${
                      stage.isCurrent
                        ? 'text-[#000000]'
                        : stage.isCompleted
                        ? 'text-[#000000]'
                        : 'text-[#888888]'
                    }`}
                  >
                    {stage.label}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Vertical Mobile Stepper */}
          <div className="flex lg:hidden flex-col gap-6 pl-2">
            {stages.map((stage, idx) => (
              <div key={stage.key} className="flex items-start gap-4 relative">
                {idx < stages.length - 1 && (
                  <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-[#E8E8E8]" />
                )}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 z-10 ${
                    stage.isCompleted
                      ? 'bg-[#C9A227] text-white'
                      : stage.isCurrent
                      ? 'bg-[#000000] text-[#C9A227] ring-4 ring-[#FAF7EE]'
                      : 'bg-white border-2 border-[#E8E8E8] text-[#999999]'
                  }`}
                >
                  {stage.isCompleted ? <CheckCircle2 size={16} /> : <span>{idx + 1}</span>}
                </div>
                <div>
                  <div
                    className={`text-sm font-bold ${
                      stage.isCurrent ? 'text-[#000000]' : stage.isCompleted ? 'text-[#000000]' : 'text-[#888888]'
                    }`}
                  >
                    {stage.label}
                  </div>
                  <p className="text-xs text-[#6B6B6B] mt-0.5">{stage.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ======================= EVENT TIMELINE & ACTIVITY LOG ======================= */}
        {trackingEvents && trackingEvents.length > 0 && (
          <div className="rounded-3xl bg-white border border-[#E8E8E8] p-6 sm:p-8 shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-[#000000] flex items-center gap-2">
              <Clock size={18} className="text-[#C9A227]" />
              <span>Real-Time Event Audit Trail</span>
            </h2>

            <div className="divide-y divide-[#E8E8E8]">
              {trackingEvents.map((evt, idx) => {
                const evtDate = new Date(evt.timestamp || Date.now()).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                });
                return (
                  <div key={idx} className="py-3.5 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#C9A227] mt-1.5 shrink-0" />
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-[#000000]">{evt.title}</h4>
                        {evt.description && (
                          <p className="text-xs text-[#6B6B6B] mt-0.5">{evt.description}</p>
                        )}
                        {evt.location && (
                          <div className="flex items-center gap-1 text-[11px] text-[#6B6B6B] mt-1">
                            <MapPin size={11} className="text-[#C9A227]" />
                            <span>{evt.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-[11px] font-mono font-medium text-[#6B6B6B] shrink-0">
                      {evtDate}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================= ORDERED ITEMS & DELIVERY ADDRESS ======================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ordered Products (2 Cols) */}
          <div className="lg:col-span-2 rounded-3xl bg-white border border-[#E8E8E8] p-6 shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-4">
            <h3 className="font-bold text-base text-[#000000]">Purchased Products ({items.length})</h3>

            <div className="divide-y divide-[#E8E8E8]">
              {items.map((item, idx) => (
                <div key={idx} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-neutral-100 shrink-0 border border-[#E8E8E8]">
                      <Image
                        src={item.image || '/images/placeholder.svg'}
                        alt={item.name}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs sm:text-sm text-[#000000] truncate">
                        {item.name}
                      </h4>
                      <p className="text-[11px] text-[#6B6B6B]">
                        Pack: {item.size || 'Standard'} • Qty: {item.qty}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-extrabold text-sm text-[#000000]">
                      {formatINR((item.price || 0) * (item.qty || 1))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Address & Contact (1 Col) */}
          <div className="rounded-3xl bg-white border border-[#E8E8E8] p-6 shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-3">
            <h3 className="font-bold text-base text-[#000000] flex items-center gap-1.5">
              <MapPin size={17} className="text-[#C9A227]" />
              <span>Shipping Destination</span>
            </h3>

            <div className="text-xs text-[#333333] space-y-1.5 pt-1">
              <p className="font-bold text-[#000000] text-sm">{customer?.name}</p>
              {customer?.line1 && <p>{customer.line1}</p>}
              <p>
                {customer?.city}, {customer?.state} - {customer?.pincode}
              </p>
              <p className="pt-2 text-[#6B6B6B] flex items-center gap-1 text-[11px]">
                <ShieldCheck size={13} className="text-emerald-600" />
                <span>Verified Doorstep Delivery</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

