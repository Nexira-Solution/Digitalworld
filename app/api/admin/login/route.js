import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { dbConnect } from '@/lib/mongodb';
import Admin from '@/models/Admin';
import { signAdminToken, setAdminCookie } from '@/lib/auth';

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    await dbConnect();

    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (!admin) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    if (admin.role === 'seller' && admin.status === 'rejected') {
      return NextResponse.json(
        {
          error: 'Your seller account has not been approved.',
          status: 'rejected',
          reason: admin.rejectionReason || 'Application criteria were not met. Please review your details and re-apply.',
          contactEmail: 'support@digitalworld.com',
          contactPhone: '+91 98765 43210',
        },
        { status: 403 }
      );
    }

    // Pending sellers ARE allowed to log in, so they can see a "pending
    // approval" screen — they just can't hit product/inventory/order routes
    // (blocked by requireApprovedSeller).
    const token = signAdminToken(admin);

    const res = NextResponse.json({
      ok: true,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        status: admin.role === 'superadmin' ? 'approved' : admin.status,
      },
    });
    setAdminCookie(res, token);
    return res;
  } catch (err) {
    console.error('Admin login error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}