import { cookies } from 'next/headers';
import { verifyAdminToken, COOKIE } from '@/lib/auth';
import { dbConnect } from '@/lib/mongodb';
import Admin from '@/models/Admin';

// Fetches the active authenticated user and checks live MongoDB record
export async function getServerAdmin() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;

  const payload = verifyAdminToken(token);
  if (!payload || !payload.id) return null;

  try {
    await dbConnect();
    const liveAdmin = await Admin.findById(payload.id)
      .select('name email role status businessName profileVerificationStatus profileCompletion')
      .lean();

    if (!liveAdmin) return null;

    return {
      id: String(liveAdmin._id),
      email: liveAdmin.email,
      name: liveAdmin.name,
      businessName: liveAdmin.businessName,
      role: liveAdmin.role,
      status: liveAdmin.role === 'superadmin' ? 'approved' : liveAdmin.status,
      profileVerificationStatus: liveAdmin.profileVerificationStatus,
      profileCompletion: liveAdmin.profileCompletion,
    };
  } catch {
    return payload;
  }
}
