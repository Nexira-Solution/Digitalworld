export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Product from '@/models/Product';
import Order from '@/models/Order';
import Admin from '@/models/Admin';
import { requireAdmin } from '@/lib/apiAuth';

export const GET = requireAdmin(async (req, ctx, admin) => {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);

    const isSuperadmin = admin.role === 'superadmin';
    const productFilter = isSuperadmin ? {} : { seller: admin.id };
    const orderFilter = isSuperadmin ? {} : { 'items.seller': admin.id };

    // Parse date filter
    const preset = searchParams.get('preset') || '14d';
    const rawStart = searchParams.get('startDate');
    const rawEnd = searchParams.get('endDate');

    const now = new Date();
    let startDate = null;
    let endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (preset === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    } else if (preset === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      startDate = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 0, 0, 0, 0);
      endDate = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59, 999);
    } else if (preset === '7d') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
    } else if (preset === '14d') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 13);
      startDate.setHours(0, 0, 0, 0);
    } else if (preset === '30d') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 29);
      startDate.setHours(0, 0, 0, 0);
    } else if (preset === 'this_month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    } else if (preset === 'last_month') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else if (preset === 'all') {
      startDate = new Date(2020, 0, 1);
    } else if (preset === 'custom' && rawStart && rawEnd) {
      const parsedStart = new Date(rawStart);
      const parsedEnd = new Date(rawEnd);

      if (parsedStart > parsedEnd) {
        return NextResponse.json({ error: 'Start date cannot be after end date.' }, { status: 400 });
      }
      startDate = new Date(parsedStart.getFullYear(), parsedStart.getMonth(), parsedStart.getDate(), 0, 0, 0, 0);
      endDate = new Date(parsedEnd.getFullYear(), parsedEnd.getMonth(), parsedEnd.getDate(), 23, 59, 59, 999);

      // Prevent future date selection
      if (startDate > now) {
        return NextResponse.json({ error: 'Start date cannot be in the future.' }, { status: 400 });
      }
      if (endDate > now) {
        endDate = now;
      }
    } else {
      // Default to 14 days
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 13);
      startDate.setHours(0, 0, 0, 0);
    }

    // Fetch products, orders, and seller admin profile
    const [products, allOrders, sellerAdmin] = await Promise.all([
      Product.find(productFilter)
        .select('name slug sku images image basePrice variants isReadyToShip isBestSeller isActive soldCount createdAt')
        .populate('category', 'name slug')
        .lean(),
      Order.find(orderFilter).sort({ createdAt: -1 }).lean(),
      Admin.findById(admin.id)
        .select('profileCompletion profileVerificationStatus verificationRemarks status businessName')
        .lean(),
    ]);

    const totalProducts = products.length;
    const activeProducts = products.filter((p) => p.isActive !== false).length;

    // Stock levels
    let lowStockProducts = 0;
    let outOfStockProducts = 0;
    const lowStockList = [];

    for (const p of products) {
      let totalStock = 0;
      let minVariantStock = Infinity;

      if (p.variants && p.variants.length > 0) {
        for (const v of p.variants) {
          if (v.sizes && v.sizes.length > 0) {
            for (const s of v.sizes) {
              const stockVal = Number(s.stock ?? 0);
              totalStock += stockVal;
              if (stockVal < minVariantStock) minVariantStock = stockVal;
            }
          }
        }
      }

      if (totalStock === 0 || minVariantStock === 0) {
        outOfStockProducts++;
      } else if (totalStock < 5 || minVariantStock < 5) {
        lowStockProducts++;
        lowStockList.push({
          _id: p._id,
          name: p.name,
          image: p.images?.[0] || p.image || '/images/placeholder.svg',
          stock: totalStock,
          price: p.basePrice || 0,
        });
      }
    }

    // Filtered Period Metrics
    let periodRevenue = 0;
    let periodOrdersCount = 0;
    let periodDeliveredOrders = 0;
    let periodPendingOrders = 0;
    const productSalesMap = {}; // productId -> { name, image, sku, unitsSold, revenue }

    // Overall Lifetime Metrics
    let lifetimeRevenue = 0;
    const orderStatusCounts = {
      placed: 0,
      confirmed: 0,
      processing: 0,
      packed: 0,
      shipped: 0,
      out_for_delivery: 0,
      delivered: 0,
      cancelled: 0,
      refunded: 0,
    };

    // Build timeline buckets for the selected range
    const daysDiff = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));
    const timelineMap = {};

    if (daysDiff <= 31) {
      // Daily grouping
      const cur = new Date(startDate);
      while (cur <= endDate) {
        const key = cur.toISOString().slice(0, 10);
        const label = cur.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        timelineMap[key] = { date: label, fullDate: key, revenue: 0, orders: 0 };
        cur.setDate(cur.getDate() + 1);
      }
    } else {
      // Weekly grouping
      const cur = new Date(startDate);
      let weekNum = 1;
      while (cur <= endDate) {
        const key = cur.toISOString().slice(0, 10);
        const label = `W${weekNum} (${cur.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })})`;
        timelineMap[key] = { date: label, fullDate: key, revenue: 0, orders: 0 };
        cur.setDate(cur.getDate() + 7);
        weekNum++;
      }
    }

    const shapedOrders = [];

    for (const o of allOrders) {
      // Seller scoping: compute items strictly belonging to this seller
      const sellerItems = isSuperadmin
        ? o.items
        : o.items.filter((it) => it.seller && String(it.seller) === String(admin.id));

      if (!sellerItems.length) continue;

      const sellerSubtotal = sellerItems.reduce(
        (sum, it) => sum + (Number(it.price) || 0) * (Number(it.qty) || 0),
        0
      );

      lifetimeRevenue += sellerSubtotal;

      const st = String(o.status || 'placed').toLowerCase();
      if (orderStatusCounts[st] !== undefined) {
        orderStatusCounts[st] += 1;
      }

      const orderDate = new Date(o.createdAt || Date.now());

      // Check if order falls in selected date range
      if (orderDate >= startDate && orderDate <= endDate) {
        periodRevenue += sellerSubtotal;
        periodOrdersCount += 1;

        if (st === 'delivered') {
          periodDeliveredOrders += 1;
        } else if (st !== 'cancelled' && st !== 'refunded') {
          periodPendingOrders += 1;
        }

        // Product sales breakdown
        sellerItems.forEach((it) => {
          const pid = String(it.product || it._id || it.name);
          if (!productSalesMap[pid]) {
            productSalesMap[pid] = {
              _id: pid,
              name: it.name || 'Product',
              image: it.image || '',
              sku: it.sku || '—',
              unitsSold: 0,
              revenue: 0,
            };
          }
          const qty = Number(it.qty) || 1;
          const price = Number(it.price) || 0;
          productSalesMap[pid].unitsSold += qty;
          productSalesMap[pid].revenue += price * qty;
        });

        // Timeline allocation
        const dayKey = orderDate.toISOString().slice(0, 10);
        if (timelineMap[dayKey]) {
          timelineMap[dayKey].revenue += sellerSubtotal;
          timelineMap[dayKey].orders += 1;
        } else {
          // Find closest bucket for weekly
          const bucketKeys = Object.keys(timelineMap);
          for (let b = bucketKeys.length - 1; b >= 0; b--) {
            if (dayKey >= bucketKeys[b]) {
              timelineMap[bucketKeys[b]].revenue += sellerSubtotal;
              timelineMap[bucketKeys[b]].orders += 1;
              break;
            }
          }
        }
      }

      shapedOrders.push({
        _id: o._id,
        orderNumber: o.orderNumber,
        createdAt: o.createdAt,
        status: o.status,
        paymentStatus: o.paymentStatus || 'pending',
        paymentMethod: o.paymentMethod || 'online',
        total: sellerSubtotal || o.total || 0,
        customer: {
          name: o.customer?.name || 'Customer',
          phone: o.customer?.phone || '',
          city: o.shippingAddress?.city || 'India',
          state: o.shippingAddress?.state || '',
        },
        itemCount: sellerItems.length,
        primaryItemName: sellerItems[0]?.name || 'Product',
        primaryItemImage: sellerItems[0]?.image || '/images/placeholder.svg',
      });
    }

    const filteredAOV = periodOrdersCount > 0 ? Math.round(periodRevenue / periodOrdersCount) : 0;
    const averageOrderValue = allOrders.length > 0 ? Math.round(lifetimeRevenue / allOrders.length) : 0;

    // Timeline array
    const salesTimeline = Object.values(timelineMap);

    // Product breakdown sorted by revenue
    const productSalesBreakdown = Object.values(productSalesMap).sort(
      (a, b) => b.revenue - a.revenue
    );

    return NextResponse.json({
      success: true,
      filter: {
        preset,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },

      // Filtered Period Metrics (Feature 9)
      filteredRevenue: periodRevenue,
      filteredOrders: periodOrdersCount,
      filteredDeliveredOrders: periodDeliveredOrders,
      filteredPendingOrders: periodPendingOrders,
      filteredAOV,
      productSalesBreakdown,
      salesTimeline,

      // Overall Catalog Metrics
      totalProducts,
      activeProducts,
      lowStockProducts,
      outOfStockProducts,
      lowStockList: lowStockList.slice(0, 5),

      // Overall Orders & Revenue
      totalOrders: allOrders.length,
      revenue: lifetimeRevenue,
      averageOrderValue,
      orderStatusCounts,
      recentOrders: shapedOrders.slice(0, 8),

      profile: {
        completion: sellerAdmin?.profileCompletion ?? 25,
        verificationStatus: sellerAdmin?.profileVerificationStatus ?? 'not_submitted',
        verificationRemarks: sellerAdmin?.verificationRemarks || '',
        status: sellerAdmin?.status || 'pending',
        businessName: sellerAdmin?.businessName || admin.name || 'Store',
      },
    });
  } catch (err) {
    console.error('GET /api/seller/stats error:', err);
    return NextResponse.json({ error: err.message || 'Failed to load seller analytics' }, { status: 500 });
  }
});
