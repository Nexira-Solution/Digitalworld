import Link from 'next/link';
import ComboForm from '@/components/combo/ComboForm';

export const metadata = {
  title: 'Add Combo Offer | Admin HQ',
};

export default function AdminNewComboPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#E7E2D6]">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-wider text-[#0F172A]">
            Add Combo Offer
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Create high-converting multipacks or cross-category product bundles for the storefront.
          </p>
        </div>
        <Link
          href="/admin/combos"
          className="text-xs font-semibold px-4 py-2 border border-[#E7E2D6] rounded-xl hover:bg-neutral-50 transition-colors text-[#0F172A]"
        >
          ← Manage Combos
        </Link>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-[#E7E2D6] shadow-2xs">
        <ComboForm mode="admin" />
      </div>
    </div>
  );
}
