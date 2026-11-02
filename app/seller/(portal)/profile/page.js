'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, Store, Phone, MapPin, FileText, Mail, CalendarDays } from 'lucide-react';

const INK = '#000000';
const INK_SOFT = '#6B6B6B';
const ORANGE = '#F97316';
const ORANGE_DARK = '#EA580C';
const ORANGE_WASH = '#FFF1E6';
const HAIRLINE = '#E8E8E8';
const PAPER = '#FFFFFF';
const FONT_SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const STATUS_STYLE = {
  pending: { bg: ORANGE_WASH, color: ORANGE_DARK, label: 'Pending approval' },
  approved: { bg: '#E6F4EA', color: '#1B8A3E', label: 'Approved seller' },
  rejected: { bg: '#FCE8E6', color: '#B3261E', label: 'Rejected' },
};

const formatINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

function stockOf(p) {
  return (p.variants || []).reduce(
    (sum, v) => sum + (v.sizes || []).reduce((s, sz) => s + (sz.stock || 0), 0),
    0
  );
}

export default function SellerProfilePage() {
  const router = useRouter();
  const [seller, setSeller] = useState(null);
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const meRes = await fetch('/api/admin/me');
      if (!meRes.ok) {
        router.push('/seller/login');
        return;
      }
      const me = (await meRes.json()).admin || {};

      // Settings holds the business fields (businessName, phone, address, GST)
      const setRes = await fetch('/api/seller/settings');
      const settings = setRes.ok ? (await setRes.json()).admin || {} : {};
      setSeller({ ...me, ...settings });

      const [statsRes, prodRes] = await Promise.all([
        fetch('/api/seller/stats'),
        fetch('/api/seller/products?limit=8'),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (prodRes.ok) {
        const d = await prodRes.json();
        setProducts(d.products || []);
        setTotalProducts(d.total || 0);
      }
      setLoading(false);
    })();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center" style={{ color: INK_SOFT }}>
        Loading...
      </div>
    );
  }

  const st = STATUS_STYLE[seller?.status] || STATUS_STYLE.approved;
  const displayName = seller?.businessName || seller?.name || 'Seller';
  const initial = displayName.charAt(0).toUpperCase();
  const joined = seller?.createdAt
    ? new Date(seller.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : null;

  const details = [
    { icon: Store, label: 'Business name', value: seller?.businessName },
    { icon: Mail, label: 'Email', value: seller?.email },
    { icon: Phone, label: 'Business phone', value: seller?.businessPhone },
    { icon: MapPin, label: 'Business address', value: seller?.businessAddress },
    { icon: FileText, label: 'GST number', value: seller?.gstNumber },
    { icon: CalendarDays, label: 'Seller since', value: joined },
  ];

  return (
    <div className="max-w-5xl mx-auto" style={{ background: PAPER, fontFamily: FONT_SANS }}>
      {/* Header */}
      <section
        className="flex flex-col sm:flex-row sm:items-center gap-5 p-5 sm:p-6"
        style={{ border: `1px solid ${HAIRLINE}`, borderTop: `3px solid ${ORANGE}` }}
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold shrink-0"
          style={{ background: ORANGE_WASH, color: ORANGE, border: `1px solid ${ORANGE}` }}
        >
          {initial}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-[1px]" style={{ color: INK }}>
              {displayName}
            </h1>
            <span
              className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5"
              style={{ background: st.bg, color: st.color }}
            >
              {st.label}
            </span>
          </div>
          {seller?.name && seller?.businessName && (
            <p className="text-sm mt-1 font-light" style={{ color: INK_SOFT }}>
              Owner: {seller.name}
            </p>
          )}
          {seller?.status === 'rejected' && seller?.rejectionReason && (
            <p className="text-[13px] mt-2" style={{ color: '#B3261E' }}>
              Reason: {seller.rejectionReason}
            </p>
          )}
        </div>

        <Link
          href="/seller/settings"
          className="inline-flex items-center justify-center gap-1.5 h-10 px-4 text-[12px] font-medium tracking-wide bg-[#F97316] text-white border border-[#F97316] hover:bg-[#EA580C] hover:border-[#EA580C] transition-colors"
        >
          <Pencil size={14} /> Edit profile
        </Link>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-3 gap-3 sm:gap-4 mt-6">
        {[
          { label: 'Products', value: stats?.totalProducts ?? totalProducts },
          { label: 'Orders', value: stats?.totalOrders ?? '—' },
          { label: 'Revenue', value: stats ? formatINR(stats.revenue) : '—' },
        ].map((s) => (
          <div key={s.label} className="p-4 sm:p-5 text-center" style={{ border: `1px solid ${HAIRLINE}` }}>
            <div className="text-[11px] tracking-[1.5px] uppercase mb-2" style={{ color: INK_SOFT }}>
              {s.label}
            </div>
            <div className="text-lg sm:text-[22px] font-bold" style={{ color: INK }}>{s.value}</div>
          </div>
        ))}
      </section>

      {/* Business details */}
      <section className="mt-10">
        <h2 className="text-lg sm:text-xl font-bold tracking-[3px] uppercase text-center mb-6" style={{ color: INK }}>
          Business Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {details.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3 p-4" style={{ border: `1px solid ${HAIRLINE}` }}>
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ background: ORANGE_WASH, color: ORANGE }}
              >
                <Icon size={16} />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] tracking-[1.5px] uppercase" style={{ color: INK_SOFT }}>
                  {label}
                </div>
                <div className="text-sm mt-0.5 break-words" style={{ color: value ? INK : INK_SOFT }}>
                  {value || 'Not added yet'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* My products */}
      <section className="mt-12 mb-10 text-center">
        <h2 className="text-lg sm:text-xl font-bold tracking-[3px] uppercase" style={{ color: INK }}>
          My Products
        </h2>

        {products.length === 0 ? (
          <div className="mt-6 text-sm" style={{ color: INK_SOFT }}>
            You haven&apos;t added any products yet.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6 mt-8 text-left">
            {products.map((p) => {
              const variant = p.variants?.[0];
              const image = variant?.images?.[0] || '/placeholder.png';
              const price = p.basePrice || variant?.price || 0;
              const compareAt = variant?.compareAtPrice || 0;
              const pct = compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : 0;
              const stock = stockOf(p);

              return (
                <Link key={p._id} href={`/seller/products/${p._id}/edit`} className="block group">
                  <div className="relative aspect-[3/4] overflow-hidden" style={{ background: ORANGE_WASH }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image}
                      alt={p.name}
                      className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                        stock <= 0 ? 'grayscale opacity-70' : ''
                      }`}
                    />
                    <div className="absolute top-3 left-3">
                      {stock <= 0 ? (
                        <span className="text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full"
                          style={{ background: INK_SOFT, color: PAPER }}>
                          Out of stock
                        </span>
                      ) : stock <= 5 ? (
                        <span className="text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full"
                          style={{ background: INK, color: PAPER }}>
                          {stock} left
                        </span>
                      ) : pct > 0 ? (
                        <span className="text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full"
                          style={{ background: ORANGE, color: PAPER }}>
                          Sale
                        </span>
                      ) : null}
                    </div>
                    {p.isActive === false && (
                      <span className="absolute bottom-3 left-3 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5"
                        style={{ background: PAPER, color: INK_SOFT }}>
                        Hidden
                      </span>
                    )}
                  </div>

                  <h3 className="mt-3 text-[13px] sm:text-sm font-medium line-clamp-2"
                    style={{ color: INK, lineHeight: 1.375, minHeight: '2.75em' }}>
                    {p.name}
                  </h3>
                  <div className="mt-1.5 flex items-baseline gap-2 flex-wrap">
                    <span className="font-bold text-base" style={{ color: INK }}>{formatINR(price)}</span>
                    {compareAt > price && (
                      <span className="text-xs line-through font-light" style={{ color: INK_SOFT }}>
                        {formatINR(compareAt)}
                      </span>
                    )}
                    {pct > 0 && (
                      <span className="text-xs font-medium" style={{ color: ORANGE_DARK }}>{pct}% off</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <Link
          href="/seller/products"
          className="inline-block mt-10 px-8 py-3 text-[12px] font-bold tracking-[2px] uppercase transition-colors bg-[#F97316] text-white border border-[#F97316] hover:bg-[#EA580C] hover:border-[#EA580C]"
        >
          {totalProducts > products.length ? `View all ${totalProducts} products` : 'Manage products'}
        </Link>
      </section>
    </div>
  );
}