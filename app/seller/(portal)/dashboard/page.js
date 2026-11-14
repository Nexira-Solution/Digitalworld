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
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SellerDashboardPage() {
  const router = useRouter();

  const [me, setMe] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('14d'); // '7d', '14d', 'all'
  const [chartMetric, setChartMetric] = useState('revenue'); // 'revenue' | 'orders'
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Load seller profile & stats
  async function loadDashboardData(showToast = false) {
    try {
      if (showToast) setRefreshing(true);

      const [meRes, statsRes] = await Promise.all([
        fetch('/api/admin/me'),
        fetch('/api/seller/stats'),
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
        toast.success('Dashboard metrics refreshed');
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
  }, []); // eslint-disable-line

  // Compute filtered timeline data for chart
  const timelineData = useMemo(() => {
    if (!stats?.salesTimeline) return [];
    if (timeRange === '7d') return stats.salesTimeline.slice(-7);
    return stats.salesTimeline; // 14d
  }, [stats?.salesTimeline, timeRange]);

  // Compute SVG chart coordinates
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

    // Build smooth cubic bezier curve
    let pathD = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cx = (p0.x + p1.x) / 2;
      pathD += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
    }

    // Closed path for subtle gradient fill
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
  const isRejected = me?.role === 'seller' && me?.status === 'rejected';
  const isSuspended = me?.role === 'seller' && me?.status === 'suspended';

  const sellerName = me?.name || 'Seller Partner';
  const businessName = me?.businessName || stats?.profile?.businessName || 'Merchant Store';
  const profileCompletion = stats?.profile?.completion ?? 25;
  const verificationStatus = stats?.profile?.verificationStatus ?? 'not_submitted';

  return (
    <div className="space-y-8 pb-16">
      {/* ======================= SECTION 1: EXECUTIVE HERO HEADER ======================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0A0E17] text-white p-6 sm:p-8 lg:p-10 shadow-[0_10px_35px_rgba(15,23,42,0.15)] border border-[#C9A227]/20">
        {/* Subtle decorative gold glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#C9A227]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-[#3B82F6]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: Merchant Profile and Greeting */}
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
                  <span>Pending Approval</span>
                </span>
              ) : null}

              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Commerce Engine</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white">
              Welcome back, {sellerName}
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Track real-time orders, manage catalog inventory, and inspect your revenue performance.
            </p>
          </div>

          {/* Right: Quick Action Controls */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => loadDashboardData(true)}
              disabled={refreshing}
              className="p-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white border border-white/15 transition-all active:scale-95 flex items-center justify-center gap-2 text-xs font-semibold backdrop-blur-md"
              title="Refresh Live Data"
            >
              <RefreshCw size={15} className={refreshing ? 'animate-spin text-[#C9A227]' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <Link
              href="/seller/products/add"
              className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all shadow-md flex items-center gap-2 active:scale-95 ${
                isPending || isRejected
                  ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700'
                  : 'bg-gradient-to-r from-[#C9A227] to-[#E5C158] text-[#0A0A0A] hover:opacity-95 shadow-[#C9A227]/20'
              }`}
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Add New Product</span>
            </Link>

            <Link
              href="/"
              target="_blank"
              className="px-4 py-3 rounded-2xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/15 transition-all flex items-center gap-1.5"
            >
              <span>View Storefront</span>
              <ExternalLink size={13} className="text-[#C9A227]" />
            </Link>
          </div>
        </div>

        {/* Account Status Notice Banners */}
        {isPending && (
          <div className="mt-6 pt-5 border-t border-white/10 flex items-start gap-3 bg-amber-500/10 -mx-6 sm:-mx-8 lg:-mx-10 px-6 sm:px-8 lg:px-10 py-4 border-l-4 border-l-amber-400">
            <Clock size={18} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200 leading-relaxed">
              <strong className="text-white font-semibold">Account Pending Superadmin Verification:</strong> Your
              seller registration was received and is under administrative review. You can preview this dashboard
              and configure your profile; products and order dispatch will unlock automatically once verified.
            </div>
          </div>
        )}

        {isRejected && (
          <div className="mt-6 pt-5 border-t border-white/10 flex items-start gap-3 bg-rose-500/10 -mx-6 sm:-mx-8 lg:-mx-10 px-6 sm:px-8 lg:px-10 py-4 border-l-4 border-l-rose-500">
            <AlertTriangle size={18} className="text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-200 leading-relaxed">
              <strong className="text-white font-semibold">Application Rejected:</strong> {me?.rejectionReason || 'Please review your business details and contact administration support.'}
            </div>
          </div>
        )}
      </div>

      {/* ======================= SECTION 2: PROFILE VERIFICATION RADAR ======================= */}
      {profileCompletion < 100 && (
        <div className="rounded-2xl bg-white border border-[#E7E2D6] p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#C9A227]" />
              <h3 className="font-bold text-sm text-[#0F172A]">Complete Your Business Verification</h3>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#FAF7EE] text-[#C9A227] border border-[#E7E2D6]">
                {profileCompletion}% Done
              </span>
            </div>
            <p className="text-xs text-[#64748B] max-w-xl">
              Add your GST certificate, FSSAI licence, and verified bank account details to unlock automated payouts
              and premium seller badges.
            </p>
            {/* Completion Progress Bar */}
            <div className="w-full max-w-md h-2 bg-neutral-100 rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-gradient-to-r from-[#C9A227] to-amber-500 rounded-full transition-all duration-700"
                style={{ width: `${profileCompletion}%` }}
              />
            </div>
          </div>

          <Link
            href="/seller/profile"
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#0F172A] text-white hover:bg-neutral-800 transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0"
          >
            <span>Finish Verification</span>
            <ChevronRight size={14} />
          </Link>
        </div>
      )}

      {/* ======================= SECTION 3: 4 EXECUTIVE KPI STAT CARDS ======================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Gross Sales Revenue */}
        <div className="rounded-2xl bg-white border border-[#E7E2D6] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              Gross Revenue
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#FAF7EE] text-[#C9A227] flex items-center justify-center border border-[#E7E2D6]/80 group-hover:scale-105 transition-transform">
              <IndianRupee size={18} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            ₹{(stats?.revenue || 0).toLocaleString('en-IN')}
          </div>
          <div className="flex items-center gap-2 mt-2.5 text-xs">
            <span className="inline-flex items-center text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
              <TrendingUp size={11} className="mr-1" />
              Active
            </span>
            <span className="text-[#64748B]">
              AOV: ₹{(stats?.averageOrderValue || 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* KPI 2: Total Orders */}
        <div className="rounded-2xl bg-white border border-[#E7E2D6] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              Total Orders
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 group-hover:scale-105 transition-transform">
              <ShoppingBag size={18} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            {stats?.totalOrders || 0}
          </div>
          <div className="flex items-center gap-2 mt-2.5 text-xs text-[#64748B]">
            <span className="font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
              {stats?.pendingOrders || 0} Pending
            </span>
            <span>•</span>
            <span className="font-semibold text-emerald-600">
              {stats?.completedOrders || 0} Delivered
            </span>
          </div>
        </div>

        {/* KPI 3: Active Catalog */}
        <div className="rounded-2xl bg-white border border-[#E7E2D6] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              Active Products
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 group-hover:scale-105 transition-transform">
              <Boxes size={18} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            {stats?.activeProducts || stats?.totalProducts || 0}
          </div>
          <div className="flex items-center gap-2 mt-2.5 text-xs">
            {stats?.lowStockProducts > 0 ? (
              <span className="inline-flex items-center text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md">
                <AlertTriangle size={11} className="mr-1" />
                {stats.lowStockProducts} Low Stock
              </span>
            ) : (
              <span className="inline-flex items-center text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                <CheckCircle2 size={11} className="mr-1" />
                Stock Healthy
              </span>
            )}
            <span className="text-[#64748B]">{stats?.totalProducts || 0} Total</span>
          </div>
        </div>

        {/* KPI 4: Merchant Trust Score */}
        <div className="rounded-2xl bg-white border border-[#E7E2D6] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              Merchant Rating
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 group-hover:scale-105 transition-transform">
              <Award size={18} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight flex items-baseline gap-1">
            <span>4.9</span>
            <span className="text-sm font-semibold text-[#64748B]">/ 5.0</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2.5 text-xs text-emerald-700 font-semibold">
            <Sparkles size={13} className="text-[#C9A227]" />
            <span>High Fulfillment Reliability</span>
          </div>
        </div>
      </div>

      {/* ======================= SECTION 4: INTERACTIVE SALES PERFORMANCE CHART ======================= */}
      <div className="rounded-3xl bg-white border border-[#E7E2D6] p-6 sm:p-8 shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E7E2D6] pb-5">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-[#C9A227]" />
              <h2 className="text-base sm:text-lg font-bold text-[#0F172A]">
                Revenue & Sales Trajectory
              </h2>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Daily revenue generation and order volume analysis across your product catalog.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Metric Switcher */}
            <div className="inline-flex rounded-xl p-1 bg-[#FAF7EE] border border-[#E7E2D6] text-xs font-semibold">
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

            {/* Time Window Switcher */}
            <div className="inline-flex rounded-xl p-1 bg-neutral-100 border border-neutral-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setTimeRange('7d')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  timeRange === '7d' ? 'bg-white text-black shadow-xs' : 'text-neutral-500'
                }`}
              >
                7 Days
              </button>
              <button
                type="button"
                onClick={() => setTimeRange('14d')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  timeRange === '14d' ? 'bg-white text-black shadow-xs' : 'text-neutral-500'
                }`}
              >
                14 Days
              </button>
            </div>
          </div>
        </div>

        {/* SVG Area Chart */}
        <div className="relative w-full overflow-hidden">
          {chartPoints.points.length > 0 ? (
            <div className="w-full">
              <svg
                viewBox="0 0 800 220"
                className="w-full h-56 sm:h-64 overflow-visible"
                preserveAspectRatio="none"
              >
                <defs>
                  {/* Linear gradient under curve */}
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C9A227" stopOpacity="0.25" />
                    <stop offset="85%" stopColor="#C9A227" stopOpacity="0.01" />
                    <stop offset="100%" stopColor="#C9A227" stopOpacity="0" />
                  </linearGradient>

                  {/* Subtle horizontal grid lines */}
                  <pattern id="grid" width="800" height="45" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="45" x2="800" y2="45" stroke="#E7E2D6" strokeDasharray="3 3" strokeWidth="0.8" />
                  </pattern>
                </defs>

                <rect width="800" height="180" fill="url(#grid)" opacity="0.7" />

                {/* Fill Area */}
                {chartPoints.areaD && (
                  <path d={chartPoints.areaD} fill="url(#areaGradient)" />
                )}

                {/* Main Curve Stroke */}
                <path
                  d={chartPoints.pathD}
                  fill="none"
                  stroke="#C9A227"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data Points */}
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
                        className="transition-all duration-200"
                        onMouseEnter={() => setHoveredPoint(pt)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Day Labels along X Axis */}
              <div className="flex items-center justify-between text-[11px] font-semibold text-[#64748B] pt-2 px-6">
                {timelineData.map((d, i) => (
                  <span
                    key={i}
                    className={`transition-colors ${
                      hoveredPoint?.label === d.date ? 'text-[#0F172A] font-bold' : ''
                    }`}
                  >
                    {d.date}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-xs text-[#64748B]">
              No sales data recorded in this period yet.
            </div>
          )}

          {/* Floating Tooltip Hover */}
          {hoveredPoint && (
            <div className="mt-3 p-3 rounded-xl bg-[#0F172A] text-white text-xs shadow-lg inline-flex items-center gap-3 border border-[#C9A227]/40">
              <span className="font-bold text-[#C9A227]">{hoveredPoint.label}</span>
              <span>•</span>
              <span>
                {chartMetric === 'revenue'
                  ? `Revenue: ₹${hoveredPoint.val.toLocaleString('en-IN')}`
                  : `Orders: ${hoveredPoint.val}`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ======================= SECTION 5: OPERATIONAL ACTION HUBS ======================= */}
      <div className="space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-[#0F172A] flex items-center gap-2">
          <Zap size={18} className="text-[#C9A227]" />
          <span>Operational Hubs</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/seller/products"
            className="p-5 rounded-2xl bg-white border border-[#E7E2D6] hover:border-[#0F172A] transition-all shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-md group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#FAF7EE] text-[#C9A227] flex items-center justify-center border border-[#E7E2D6] mb-3 group-hover:scale-105 transition-transform">
                <Package size={18} />
              </div>
              <h3 className="font-bold text-sm text-[#0F172A] group-hover:text-[#C9A227] transition-colors">
                Product Catalog
              </h3>
              <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                Add, edit pricing, manage variants, and configure trust badges.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#E7E2D6] flex items-center justify-between text-xs font-semibold text-[#0F172A]">
              <span>{stats?.totalProducts || 0} Listed Items</span>
              <ArrowUpRight size={14} className="text-[#C9A227]" />
            </div>
          </Link>

          <Link
            href="/seller/orders"
            className="p-5 rounded-2xl bg-white border border-[#E7E2D6] hover:border-[#0F172A] transition-all shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-md group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 mb-3 group-hover:scale-105 transition-transform">
                <Truck size={18} />
              </div>
              <h3 className="font-bold text-sm text-[#0F172A] group-hover:text-blue-600 transition-colors">
                Order Processing
              </h3>
              <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                Fulfill shipments, update tracking numbers, and view customer invoices.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#E7E2D6] flex items-center justify-between text-xs font-semibold text-[#0F172A]">
              <span>{stats?.pendingOrders || 0} Needs Attention</span>
              <ArrowUpRight size={14} className="text-blue-600" />
            </div>
          </Link>

          <Link
            href="/seller/combos"
            className="p-5 rounded-2xl bg-white border border-[#E7E2D6] hover:border-[#0F172A] transition-all shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-md group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 mb-3 group-hover:scale-105 transition-transform">
                <Layers size={18} />
              </div>
              <h3 className="font-bold text-sm text-[#0F172A] group-hover:text-purple-600 transition-colors">
                Combo Bundles
              </h3>
              <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                Create value packages to elevate customer average order value (AOV).
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#E7E2D6] flex items-center justify-between text-xs font-semibold text-[#0F172A]">
              <span>Boost Basket Size</span>
              <ArrowUpRight size={14} className="text-purple-600" />
            </div>
          </Link>

          <Link
            href="/seller/profile"
            className="p-5 rounded-2xl bg-white border border-[#E7E2D6] hover:border-[#0F172A] transition-all shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-md group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 mb-3 group-hover:scale-105 transition-transform">
                <ShieldCheck size={18} />
              </div>
              <h3 className="font-bold text-sm text-[#0F172A] group-hover:text-emerald-600 transition-colors">
                Compliance & Bank
              </h3>
              <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                Manage bank settlement credentials, pickup addresses, and GSTIN.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#E7E2D6] flex items-center justify-between text-xs font-semibold text-[#0F172A]">
              <span>{profileCompletion}% Complete</span>
              <ArrowUpRight size={14} className="text-emerald-600" />
            </div>
          </Link>
        </div>
      </div>

      {/* ======================= SECTION 6: RECENT ORDERS LIVE TABLE ======================= */}
      <div className="rounded-3xl bg-white border border-[#E7E2D6] p-6 sm:p-8 shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-5">
        <div className="flex items-center justify-between border-b border-[#E7E2D6] pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#0F172A]">
              Live Inbound Orders
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Real-time feed of purchases routed to your store.
            </p>
          </div>

          <Link
            href="/seller/orders"
            className="text-xs font-bold text-[#C9A227] hover:underline flex items-center gap-1"
          >
            <span>View All Orders</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {stats?.recentOrders && stats.recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#E7E2D6] text-[#64748B] uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-3 px-2">Order ID</th>
                  <th className="py-3 px-2">Customer & City</th>
                  <th className="py-3 px-2">Primary Item</th>
                  <th className="py-3 px-2 text-right">Amount</th>
                  <th className="py-3 px-2">Payment</th>
                  <th className="py-3 px-2 text-center">Fulfillment</th>
                  <th className="py-3 px-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E2D6]/80 text-[#0F172A]">
                {stats.recentOrders.map((o) => {
                  const statusColors = {
                    placed: 'bg-amber-50 text-amber-700 border-amber-200',
                    confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
                    packed: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                    shipped: 'bg-purple-50 text-purple-700 border-purple-200',
                    delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
                  };

                  const badgeClass = statusColors[o.status] || 'bg-neutral-100 text-neutral-600 border-neutral-200';

                  return (
                    <tr key={o._id} className="hover:bg-[#FAF9F5]/70 transition-colors">
                      <td className="py-3 px-2 font-mono font-bold text-[#0F172A]">
                        {o.orderNumber}
                      </td>
                      <td className="py-3 px-2">
                        <div className="font-semibold text-[#0F172A]">{o.customer.name}</div>
                        <div className="text-[11px] text-[#64748B]">{o.customer.city}</div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-neutral-100 shrink-0 border border-[#E7E2D6]">
                            <Image
                              src={o.primaryItemImage}
                              alt={o.primaryItemName}
                              fill
                              unoptimized
                              className="object-cover"
                            />
                          </div>
                          <div className="truncate max-w-[160px]">
                            <div className="truncate font-medium">{o.primaryItemName}</div>
                            {o.itemCount > 1 && (
                              <div className="text-[10px] text-[#64748B]">
                                +{o.itemCount - 1} more items
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right font-bold text-[#0F172A]">
                        ₹{Number(o.total || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-2">
                        <span className="inline-flex items-center uppercase font-bold text-[10px] text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-md">
                          {o.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border capitalize ${badgeClass}`}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <Link
                          href="/seller/orders"
                          className="px-2.5 py-1.5 rounded-lg border border-[#E7E2D6] text-xs font-semibold text-[#0F172A] hover:bg-[#0F172A] hover:text-white transition-all inline-flex items-center gap-1"
                        >
                          <span>Manage</span>
                          <ChevronRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center gap-2 text-[#64748B]">
            <div className="w-12 h-12 rounded-full bg-[#FAF7EE] text-[#C9A227] flex items-center justify-center border border-[#E7E2D6]">
              <ShoppingBag size={22} />
            </div>
            <p className="font-bold text-sm text-[#0F172A]">No Inbound Orders Yet</p>
            <p className="text-xs max-w-sm">
              When shoppers purchase items from your inventory, live orders will appear here automatically with 1-click fulfillment.
            </p>
            <Link
              href="/seller/products/add"
              className="mt-3 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#0F172A] text-white hover:bg-neutral-800 transition-all shadow-xs"
            >
              List Products Now
            </Link>
          </div>
        )}
      </div>

      {/* ======================= SECTION 7: TWO-COLUMN LOWER SHOWCASE ======================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Top Performing Products */}
        <div className="rounded-3xl bg-white border border-[#E7E2D6] p-6 shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex items-center justify-between border-b border-[#E7E2D6] pb-3">
            <div className="flex items-center gap-2">
              <Award size={18} className="text-[#C9A227]" />
              <h3 className="font-bold text-sm sm:text-base text-[#0F172A]">
                Top Selling Products
              </h3>
            </div>
            <Link href="/seller/products" className="text-xs font-semibold text-[#C9A227] hover:underline">
              View All
            </Link>
          </div>

          {stats?.topProducts && stats.topProducts.length > 0 ? (
            <div className="divide-y divide-[#E7E2D6]/80">
              {stats.topProducts.map((p, idx) => (
                <div key={p._id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-bold font-mono text-[#64748B] w-4">
                      #{idx + 1}
                    </span>
                    <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-neutral-100 shrink-0 border border-[#E7E2D6]">
                      <Image
                        src={p.image}
                        alt={p.name}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs sm:text-sm text-[#0F172A] truncate">
                        {p.name}
                      </h4>
                      <p className="text-[11px] text-[#64748B]">
                        ₹{Number(p.price).toLocaleString('en-IN')} • {p.categoryName}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-bold text-xs text-[#0F172A]">
                      {p.soldCount.toLocaleString('en-IN')} Sold
                    </div>
                    {p.isReadyToShip && (
                      <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                        Ready to Ship
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#64748B] py-6 text-center">
              No product sales recorded yet.
            </p>
          )}
        </div>

        {/* Right: Low Stock & Restock Alerts */}
        <div className="rounded-3xl bg-white border border-[#E7E2D6] p-6 shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex items-center justify-between border-b border-[#E7E2D6] pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-500" />
              <h3 className="font-bold text-sm sm:text-base text-[#0F172A]">
                Restock Radar & Low Stock
              </h3>
            </div>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              {stats?.lowStockProducts || 0} Alerts
            </span>
          </div>

          {stats?.lowStockList && stats.lowStockList.length > 0 ? (
            <div className="divide-y divide-[#E7E2D6]/80">
              {stats.lowStockList.map((item) => (
                <div key={item._id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-neutral-100 shrink-0 border border-[#E7E2D6]">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs text-[#0F172A] truncate">
                        {item.name}
                      </h4>
                      <p className="text-[11px] text-rose-600 font-semibold">
                        Only {item.stock} left in stock
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/seller/products/edit/${item._id}`}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FAF7EE] text-[#0F172A] border border-[#E7E2D6] hover:bg-[#0F172A] hover:text-white transition-all shrink-0"
                  >
                    Restock
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 flex flex-col items-center justify-center text-center gap-2">
              <CheckCircle2 size={28} className="text-emerald-500" />
              <p className="font-bold text-xs text-[#0F172A]">Inventory in Healthy State</p>
              <p className="text-[11px] text-[#64748B] max-w-xs">
                None of your listed products are currently below the critical stock threshold.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
