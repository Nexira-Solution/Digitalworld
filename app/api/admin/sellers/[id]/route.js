export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Admin from '@/models/Admin';
import SellerBusinessProfile from '@/models/SellerBusinessProfile';
import SellerDocument from '@/models/SellerDocument';
import SellerApprovalHistory from '@/models/SellerApprovalHistory';
import Product from '@/models/Product';
import Order from '@/models/Order';
import { requireSuperAdmin } from '@/lib/apiAuth';

export const GET = requireSuperAdmin(async (req, { params }) => {
  try {
    const { id } = await params;
    await dbConnect();

    const seller = await Admin.findById(id).select('-passwordHash').lean();
    if (!seller || seller.role !== 'seller') {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    const [profile, documents, history, productCount, orderCount] = await Promise.all([
      SellerBusinessProfile.findOne({ seller: seller._id }).lean(),
      SellerDocument.find({ seller: seller._id }).sort({ createdAt: -1 }).lean(),
      SellerApprovalHistory.find({ seller: seller._id })
        .populate('admin', 'name email')
        .sort({ createdAt: -1 })
        .lean(),
      Product.countDocuments({ seller: seller._id }),
      Order.countDocuments({ 'items.seller': seller._id }),
    ]);

    return NextResponse.json({
      seller,
      profile: profile || null,
      documents: documents || [],
      history: history || [],
      stats: {
        products: productCount,
        orders: orderCount,
      },
    });
  } catch (err) {
    console.error('GET /api/admin/sellers/[id] error:', err);
    return NextResponse.json({ error: 'Failed to fetch seller details' }, { status: 500 });
  }
});

