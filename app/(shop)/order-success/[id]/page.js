'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { formatINR } from '@/lib/utils';

// White, black and gold palette (matches the invoice page)
const PAPER = '#FFFFFF';
const BLACK = '#000000';
const GREY = '#5E5E5E';        // secondary text on white
const LINE = '#E7E2D6';        // hairlines
const GOLD = '#C9A24B';        // rules and accents
const GOLD_DEEP = '#8C6A12';   // gold text on white (readable contrast)
const GOLD_BRIGHT = '#E0BC5F'; // gold on black
const FONT_OUTFIT = "'Outfit', sans-serif";

export default function OrderSuccessPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then((r) => r.json())
      .then((d) => setOrder(d.order));
  }, [id]);

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center text-sm" style={{ color: GREY, fontFamily: FONT_OUTFIT }}>
        Loading…
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-5 py-20 text-center" style={{ background: PAPER, fontFamily: FONT_OUTFIT }}>
      <div
        className="inline-flex items-center justify-center w-16 h-16 mb-5"
        style={{ background: BLACK, borderRadius: '50%', boxShadow: `0 0 0 3px ${PAPER}, 0 0 0 4px ${GOLD}` }}
      >
        <CheckCircle2 size={30} strokeWidth={1.5} style={{ color: GOLD_BRIGHT }} />
      </div>

      <h1 className="text-[24px] sm:text-[28px] font-bold" style={{ color: BLACK }}>
        Order placed successfully
      </h1>

      <div className="mt-6 pt-6 max-w-xs mx-auto space-y-2" style={{ borderTop: `1px solid ${GOLD}` }}>
        <p className="text-sm" style={{ color: GREY }}>
          Order Number <span style={{ color: BLACK, fontWeight: 600 }}>— {order.orderNumber}</span>
        </p>
        <p className="text-sm" style={{ color: GREY }}>
          Total <span className="font-bold" style={{ color: GOLD_DEEP }}>— {formatINR(order.total)}</span>
        </p>
      </div>

      <p className="text-xs mt-5" style={{ color: GREY }}>
        We&rsquo;ll send updates to {order.customer?.phone}
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center mt-9">
        <Link
          href={`/account/orders/${order._id}/tracking`}
          className="px-6 py-3 text-sm font-bold transition-all rounded-xl shadow-sm"
          style={{ background: '#C9A227', color: '#000000' }}
        >
          Track Order
        </Link>
        <Link
          href={`/invoice/${order._id}`}
          className="px-6 py-3 text-sm font-semibold transition-opacity rounded-xl border border-[#000000] text-[#000000] hover:bg-[#FAF7F0]"
        >
          View Invoice
        </Link>
        <Link
          href="/"
          className="px-6 py-3 text-sm font-semibold transition-opacity rounded-xl bg-black text-white hover:bg-neutral-800"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}