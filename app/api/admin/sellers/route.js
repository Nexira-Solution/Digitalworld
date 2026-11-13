export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Admin from '@/models/Admin';
import { requireSuperAdmin } from '@/lib/apiAuth';

export const GET = requireSuperAdmin(async (req) => {
  await dbConnect();
  const searchParams = req.nextUrl.searchParams;
  const status = searchParams.get('status');
  const search = searchParams.get('search')?.trim();

  const filter = { role: 'seller' };

  if (status && status !== 'all') {
    filter.status = status;
  }

  if (search) {
    const rx = new RegExp(search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
    filter.$or = [
      { name: rx },
      { email: rx },
      { businessName: rx },
      { businessPhone: rx },
      { gstNumber: rx },
    ];
  }

  const [sellers, allCount, pendingCount, approvedCount, rejectedCount, suspendedCount] =
    await Promise.all([
      Admin.find(filter)
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .lean(),
      Admin.countDocuments({ role: 'seller' }),
      Admin.countDocuments({ role: 'seller', status: 'pending' }),
      Admin.countDocuments({ role: 'seller', status: 'approved' }),
      Admin.countDocuments({ role: 'seller', status: 'rejected' }),
      Admin.countDocuments({ role: 'seller', status: 'suspended' }),
    ]);

  return NextResponse.json({
    sellers,
    counts: {
      all: allCount,
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
      suspended: suspendedCount,
    },
  });
});
