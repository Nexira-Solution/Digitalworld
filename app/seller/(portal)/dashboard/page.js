'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  IndianRupee,
  ShoppingBag,
  Package,
  Clock,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Plus,
  ArrowUpRight,
  Eye,
  RefreshCw,
  Layers,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  Boxes,
  Store,
  ExternalLink,
  Award,
  Calendar,
  Filter,
  BarChart3,
  CalendarDays,
} from 'lucide-react';
import toast from 'react-hot-toast';

const PRESET_OPTIONS = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: '7d', label: 'Last 7 Days' },
  { key: '30d', label: 'Last 30 Days' },
  { key: 'this_month', label: 'This Month' },
  { key: 'last_month', label: 'Last Month' },
  { key: 'all', label: 'All Time' },
  { key: 'custom', label: 'Custom Range' },
];

export default function SellerDashboardPage() {
  const router = useRouter();

  const [me, setMe] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Feature 9: Date Range Filters
  const [preset, setPreset] = useState('30d');
  const todayStr = new Date().toISOString().slice(0, 10);
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [customEnd, setCustomEnd] = useState(todayStr);

  const [chartMetric, setChartMetric] = useState('revenue'); // 'revenue' | 'orders'
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Load seller profile & stats with date filtering (Feature 9)
  async function loadDashboardData(showToast = false) {
    try {
      if (showToast) setRefreshing(true);

      const params = new URLSearchParams();
      params.set('preset', preset);
      if (preset === 'custom') {
        if (customStart > customEnd) {
          toast.error('Start date cannot be after end date');
          setRefreshing(false);
          return;
        }
        if (customStart > todayStr) {
          toast.error('Start date cannot be in the future');
          setRefreshing(false);
          return;
        }
        params.set('startDate', customStart);
        params.set('endDate', customEnd);
      }

      const [meRes, statsRes] = await Promise.all([
        fetch('/api/admin/me'),
        fetch(`/api/seller/stats?${params}`),
      ]);

      if (!meRes.ok) {
        router.push('/seller/login');
        return;
      }

      const meData = await meRes.json();
      setMe(meData.admin);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (showToast) {
        toast.success('Analytics metrics updated');
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, [preset]); // Reload when preset changes

  function handleCustomDateApply(e) {
    e.preventDefault();
    if (customStart > customEnd) {
      toast.error('Start date cannot be after end date.');
      return;
    }
    if (customStart > todayStr) {
      toast.error('Start date cannot be in the future.');
      return;
    }
    loadDashboardData(true);
  }

  // Dynamic SVG Chart Coordinates
  const timelineData = stats?.salesTimeline || [];
  const chartPoints = useMemo(() => {
    if (!timelineData || timelineData.length === 0) return { pathD: '', areaD: '', points: [] };

    const values = timelineData.map((d) => (chartMetric === 'revenue' ? d.revenue : d.orders));
    const maxVal = Math.max(...values, chartMetric === 'revenue' ? 1000 : 5);
    const minVal = 0;

    const width = 800;
    const height = 220;
    const paddingX = 40;
    const paddingY = 25;

    const stepX = (width - paddingX * 2) / Math.max(1, timelineData.length - 1);

    const pts = timelineData.map((d, i) => {
      const val = chartMetric === 'revenue' ? d.revenue : d.orders;
      const x = paddingX + i * stepX;
      const y = height - paddingY - ((val - minVal) / (maxVal - minVal || 1)) * (height - paddingY * 2);
      return { x, y, val, label: d.date, raw: d };
    });

    if (pts.length === 1) {
      return { pathD: `M ${pts[0].x} ${pts[0].y}`, areaD: '', points: pts };
    }

    let pathD = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cx = (p0.x + p1.x) / 2;
      pathD += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
    }

    const last = pts[pts.length - 1];
    const first = pts[0];
    const areaD = `${pathD} L ${last.x} ${height - paddingY} L ${first.x} ${height - paddingY} Z`;

    return { pathD, areaD, points: pts };
  }, [timelineData, chartMetric]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <div className="w-9 h-9 rounded-full border-2 border-[#E7E2D6] border-t-[#C9A227] animate-spin" />
        <p className="text-xs font-semibold text-[#64748B] tracking-wide uppercase">
          Loading Executive Dashboard…
        </p>
      </div>
    );
  }

  const isPending = me?.role === 'seller' && me?.status === 'pending';
  const sellerName = me?.name || 'Seller Partner';
  const businessName = me?.businessName || stats?.profile?.businessName || 'Merchant Store';
  const profileCompletion = stats?.profile?.completion ?? 25;

  return (
    <div className="space-y-8 pb-16">
      {/* SECTION 1: EXECUTIVE HERO HEADER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0A0E17] text-white p-6 sm:p-8 lg:p-10 shadow-[0_10px_35px_rgba(15,23,42,0.15)] border border-[#C9A227]/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#C9A227]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-[#C9A227]/20 text-[#E7C86A] border border-[#C9A227]/30">
                <Store size={12} className="text-[#C9A227]" />
                <span>{businessName}</span>
              </span>

              {me?.status === 'approved' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 size={12} />
                  <span>Verified Merchant</span>
                </span>
              ) : isPending ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Clock size={12} />
                  <span>Pending Admin Approval</span>
                </span>
              ) : null}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white">
              Welcome back, {sellerName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Track your authentic supplier revenue, real-time orders, and inventory analytics for any custom period.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => loadDashboardData(true)}
              disabled={refreshing}
              className="p-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white border border-white/15 transition-all active:scale-95 flex items-center justify-center gap-2 text-xs font-semibold backdrop-blur-md"
              title="Refresh Dashboard Data"
            >
              <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>

            <Link
              href="/seller/products/new"
              className="px-5 py-3 rounded-2xl bg-[#C9A227] hover:bg-[#d8b030] text-[#000000] font-bold text-xs shadow-md transition-all flex items-center gap-2"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Add Product</span>
            </Link>
          </div>
        </div>
      </div>

      {/* SECTION 2: FEATURE 9 - CUSTOM DATE RANGE ANALYTICS FILTER BAR */}
      <div className="bg-white p-5 rounded-3xl border border-[#E7E2D6] shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <CalendarDays size={18} className="text-[#C9A227]" />
            <h2 className="font-bold text-sm text-[#0F172A]">
              Analytics Period & Date Filter
            </h2>
          </div>
          <span className="text-xs text-[#64748B]">
            Metrics are scoped strictly to your merchant sales.
          </span>
        </div>

        {/* Preset Range Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {PRESET_OPTIONS.map((opt) => {
            const active = preset === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setPreset(opt.key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  active
                    ? 'bg-[#0F172A] text-white shadow-xs'
                    : 'bg-[#FAF9F5] text-[#64748B] hover:text-[#0F172A] border border-[#E7E2D6]'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Custom Date Range Picker */}
        {preset === 'custom' && (
          <form
            onSubmit={handleCustomDateApply}
            className="pt-3 border-t border-[#F0EFE9] flex flex-col sm:flex-row sm:items-end gap-3"
          >
            <div>
              <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                Start Date (From)
              </label>
              <input
                type="date"
                required
                max={todayStr}
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-3.5 py-2 text-xs rounded-xl border border-[#D6D6D6] outline-none focus:border-[#0F172A]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                End Date (To)
              </label>
              <input
                type="date"
                required
                max={todayStr}
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-3.5 py-2 text-xs rounded-xl border border-[#D6D6D6] outline-none focus:border-[#0F172A]"
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#C9A227] text-black hover:bg-[#d8b030] shadow-2xs"
            >
              Apply Custom Range
            </button>
          </form>
        )}
      </div>

      {/* SECTION 3: 5 FILTERED PERIOD KPI STAT CARDS (Feature 9) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Metric 1: Period Revenue */}
        <div className="rounded-2xl bg-white border border-[#E7E2D6] p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
              Period Revenue
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#FAF7EE] text-[#C9A227] flex items-center justify-center">
              <IndianRupee size={15} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight">
            ₹{(stats?.filteredRevenue ?? stats?.revenue ?? 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] text-[#64748B] mt-1">In selected range</p>
        </div>

        {/* Metric 2: Period Total Orders */}
        <div className="rounded-2xl bg-white border border-[#E7E2D6] p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
              Period Orders
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag size={15} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight">
            {stats?.filteredOrders ?? stats?.totalOrders ?? 0}
          </div>
          <p className="text-[10px] text-[#64748B] mt-1">Total placed</p>
        </div>

        {/* Metric 3: Delivered Orders */}
        <div className="rounded-2xl bg-white border border-[#E7E2D6] p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
              Delivered
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={15} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-700 tracking-tight">
            {stats?.filteredDeliveredOrders ?? stats?.completedOrders ?? 0}
          </div>
          <p className="text-[10px] text-emerald-600 font-semibold mt-1">Fulfilled orders</p>
        </div>

        {/* Metric 4: Pending Orders */}
        <div className="rounded-2xl bg-white border border-[#E7E2D6] p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
              Pending / In-Transit
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={15} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-amber-600 tracking-tight">
            {stats?.filteredPendingOrders ?? stats?.pendingOrders ?? 0}
          </div>
          <p className="text-[10px] text-amber-600 font-semibold mt-1">Action needed</p>
        </div>

        {/* Metric 5: Average Order Value */}
        <div className="rounded-2xl bg-white border border-[#E7E2D6] p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
              Period AOV
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp size={15} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight">
            ₹{(stats?.filteredAOV ?? stats?.averageOrderValue ?? 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] text-[#64748B] mt-1">Avg basket size</p>
        </div>
      </div>

      {/* SECTION 4: DYNAMIC SALES & REVENUE CHART */}
      <div className="bg-white rounded-3xl border border-[#E7E2D6] p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-extrabold text-base text-[#0F172A] tracking-tight">
              Period Performance Trajectory
            </h2>
            <p className="text-xs text-[#64748B]">
              Revenue and order volume trends for the selected date window.
            </p>
          </div>

          <div className="inline-flex rounded-xl p-1 bg-[#FAF7EE] border border-[#E7E2D6] text-xs font-semibold self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setChartMetric('revenue')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                chartMetric === 'revenue'
                  ? 'bg-[#0F172A] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              Revenue (₹)
            </button>
            <button
              type="button"
              onClick={() => setChartMetric('orders')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                chartMetric === 'orders'
                  ? 'bg-[#0F172A] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              Orders Count
            </button>
          </div>
        </div>

        {/* SVG Area Chart */}
        <div className="relative w-full overflow-hidden pt-2">
          {chartPoints.points.length > 0 ? (
            <div className="w-full">
              <svg
                viewBox="0 0 800 220"
                className="w-full h-56 sm:h-64 overflow-visible"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C9A227" stopOpacity="0.25" />
                    <stop offset="85%" stopColor="#C9A227" stopOpacity="0.01" />
                    <stop offset="100%" stopColor="#C9A227" stopOpacity="0" />
                  </linearGradient>

                  <pattern id="grid" width="800" height="45" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="45" x2="800" y2="45" stroke="#E7E2D6" strokeDasharray="3 3" strokeWidth="0.8" />
                  </pattern>
                </defs>

                <rect width="800" height="180" fill="url(#grid)" opacity="0.7" />

                {chartPoints.areaD && (
                  <path d={chartPoints.areaD} fill="url(#areaGradient)" />
                )}

                <path
                  d={chartPoints.pathD}
                  fill="none"
                  stroke="#C9A227"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {chartPoints.points.map((pt, idx) => {
                  const isHovered = hoveredPoint?.label === pt.label;
                  return (
                    <g key={idx} className="cursor-pointer">
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? 6 : 4}
                        fill="#0F172A"
                        stroke="#C9A227"
                        strokeWidth="2.5"
                        onMouseEnter={() => setHoveredPoint(pt)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                    </g>
                  );
                })}
              </svg>

              {/* X Axis Labels */}
              <div className="flex justify-between items-center text-[10px] text-[#64748B] pt-2 px-2 overflow-x-auto no-scrollbar">
                {timelineData.map((d, i) => (
                  <span key={i} className="shrink-0 text-center">
                    {d.date}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-[#64748B]">
              No sales records recorded in this date range.
            </div>
          )}
        </div>
      </div>

      {/* SECTION 5: PRODUCT-WISE SALES BREAKDOWN TABLE (Feature 9) */}
      <div className="bg-white rounded-3xl border border-[#E7E2D6] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-extrabold text-base text-[#0F172A] tracking-tight">
              Product-Wise Sales Breakdown (Selected Period)
            </h2>
            <p className="text-xs text-[#64748B]">
              Units sold and revenue generated by each of your products during this window.
            </p>
          </div>
        </div>

        {stats?.productSalesBreakdown?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F5] text-[#64748B] font-bold uppercase text-[10px] tracking-wider border-b border-[#E7E2D6]">
                <tr>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Units Sold</th>
                  <th className="py-3 px-4 text-right">Period Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EFE9]">
                {stats.productSalesBreakdown.map((item, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50/75 transition-colors">
                    <td className="py-3 px-4 font-bold text-[#0F172A]">
                      {item.name}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#64748B]">
                      {item.sku || '—'}
                    </td>
                    <td className="py-3 px-4 font-bold text-[#0F172A]">
                      {item.unitsSold} units
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-emerald-700">
                      ₹{item.revenue.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-[#64748B] bg-[#FAF9F5] rounded-2xl">
            No product sales recorded in the selected period.
          </div>
        )}
      </div>
    </div>
  );
}
