import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Product from '@/models/Product';
import Order from '@/models/Order';
import Admin from '@/models/Admin';
import { requireAdmin } from '@/lib/apiAuth';

export const GET = requireAdmin(async (req, ctx, admin) => {
  await dbConnect();

  const isSuperadmin = admin.role === 'superadmin';
  const productFilter = isSuperadmin ? {} : { seller: admin.id };
  const orderFilter = isSuperadmin ? {} : { 'items.seller': admin.id };

  // Fetch products and all orders containing seller's items
  const [products, orders, sellerAdmin] = await Promise.all([
    Product.find(productFilter)
      .select('name slug sku images image basePrice variants isReadyToShip isBestSeller isActive soldCount createdAt')
      .populate('category', 'name slug')
      .lean(),
    Order.find(orderFilter)
      .sort({ createdAt: -1 })
      .lean(),
    Admin.findById(admin.id).select('profileCompletion profileVerificationStatus verificationRemarks status businessName').lean(),
  ]);

  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.isActive !== false).length;

  // Stock calculations
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

  // Orders and Revenue breakdown
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  let totalRevenue = 0;
  let todayRevenue = 0;
  let monthlyRevenue = 0;
  let todayOrdersCount = 0;
  let monthlyOrdersCount = 0;

  const orderStatusCounts = {
    placed: 0,
    confirmed: 0,
    packed: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    returned: 0,
  };

  // Day-by-day map for last 14 days
  const dailyMap = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
    const label = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    dailyMap[key] = { date: label, fullDate: key, revenue: 0, orders: 0 };
  }

  const shapedOrders = [];

  for (const o of orders) {
    // Determine seller's items in this order
    const sellerItems = isSuperadmin
      ? o.items
      : o.items.filter((it) => it.seller && String(it.seller) === String(admin.id));

    const sellerSubtotal = sellerItems.reduce(
      (sum, it) => sum + (Number(it.price) || 0) * (Number(it.qty) || 0),
      0
    );

    totalRevenue += sellerSubtotal;

    // Track order status counts
    const st = o.status || 'placed';
    if (orderStatusCounts[st] !== undefined) {
      orderStatusCounts[st] += 1;
    }

    const orderDate = new Date(o.createdAt || Date.now());

    // Today's metrics
    if (orderDate >= startOfToday) {
      todayRevenue += sellerSubtotal;
      todayOrdersCount += 1;
    }

    // Last 30 days metrics
    if (orderDate >= thirtyDaysAgo) {
      monthlyRevenue += sellerSubtotal;
      monthlyOrdersCount += 1;
    }

    // Last 14 days timeline
    const dateKey = orderDate.toISOString().slice(0, 10);
    if (dailyMap[dateKey]) {
      dailyMap[dateKey].revenue += sellerSubtotal;
      dailyMap[dateKey].orders += 1;
    }

    shapedOrders.push({
      _id: o._id,
      orderNumber: o.orderNumber,
      createdAt: o.createdAt,
      status: o.status,
      paymentStatus: o.paymentStatus || 'pending',
      paymentMethod: o.paymentMethod || 'razorpay',
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

  const totalOrders = orders.length;
  const pendingOrders = orderStatusCounts.placed + orderStatusCounts.confirmed;
  const inTransitOrders = orderStatusCounts.packed + orderStatusCounts.shipped;
  const completedOrders = orderStatusCounts.delivered;
  const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  // Timeline list sorted chronologically
  const salesTimeline = Object.values(dailyMap);

  // Top products
  const topProducts = [...products]
    .sort((a, b) => (Number(b.soldCount) || 0) - (Number(a.soldCount) || 0))
    .slice(0, 5)
    .map((p) => ({
      _id: p._id,
      name: p.name,
      slug: p.slug,
      image: p.images?.[0] || p.image || '/images/placeholder.svg',
      price: p.basePrice || 0,
      soldCount: Number(p.soldCount) || 0,
      categoryName: p.category?.name || 'Gourmet',
      isReadyToShip: Boolean(p.isReadyToShip),
    }));

  return NextResponse.json({
    totalProducts,
    activeProducts,
    lowStockProducts,
    outOfStockProducts,
    lowStockList: lowStockList.slice(0, 5),

    totalOrders,
    pendingOrders,
    inTransitOrders,
    completedOrders,
    todayOrdersCount,
    monthlyOrdersCount,

    revenue: totalRevenue,
    todayRevenue,
    monthlyRevenue,
    averageOrderValue,

    orderStatusCounts,
    salesTimeline,
    recentOrders: shapedOrders.slice(0, 6),
    topProducts,

    profile: {
      completion: sellerAdmin?.profileCompletion ?? 25,
      verificationStatus: sellerAdmin?.profileVerificationStatus ?? 'not_submitted',
      verificationRemarks: sellerAdmin?.verificationRemarks || '',
      status: sellerAdmin?.status || 'pending',
      businessName: sellerAdmin?.businessName || admin.name || 'Store',
    },
  });
});
