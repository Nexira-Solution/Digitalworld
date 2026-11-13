'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileCheck,
  ExternalLink,
  Store,
  Phone,
  Mail,
  MapPin,
  Calendar,
  X,
  Loader2,
  Ban,
  Check,
  RefreshCw,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';

const INK = '#000000';
const INK_SOFT = '#6B6B6B';
const GOLD = '#C9A227';
const LINE = '#E8E8E8';
const PAPER = '#FFFFFF';
const RED = '#B3261E';
const GREEN = '#1B8A3E';

const TABS = [
  { key: 'all', label: 'All Sellers' },
  { key: 'pending', label: 'Pending Approval' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'suspended', label: 'Suspended' },
];

export default function AdminSellersPage() {
  const router = useRouter();
  const [tab, setTab] = useState('pending');
  const [search, setSearch] = useState('');
  const [sellers, setSellers] = useState([]);
  const [counts, setCounts] = useState({ all: 0, pending: 0, approved: 0, rejected: 0, suspended: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState(null);

  // Modal dialog states
  const [actionTarget, setActionTarget] = useState(null); // { seller, type: 'reject' | 'suspend' }
  const [actionReason, setActionReason] = useState('');

  // Drawer / modal for reviewing detailed profile & documents
  const [selectedSellerDetail, setSelectedSellerDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [docRejectTarget, setDocRejectTarget] = useState(null); // { doc, remarks }
  const [docRejectRemarks, setDocRejectRemarks] = useState('');

  const loadSellers = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setRefreshing(true);

    try {
      const q = new URLSearchParams();
      if (tab !== 'all') q.set('status', tab);
      if (search.trim()) q.set('search', search.trim());

      const res = await fetch(`/api/admin/sellers?${q.toString()}`, { cache: 'no-store' });
      if (res.status === 401 || res.status === 403) {
        router.push('/seller/login');
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setSellers(data.sellers || []);
        if (data.counts) setCounts(data.counts);
      }
    } catch (err) {
      console.error('Error fetching sellers:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tab, search, router]);

  // Initial load and filter change
  useEffect(() => {
    loadSellers(false);
  }, [loadSellers]);

  // Real-time synchronization polling every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      loadSellers(true);
    }, 5000);
    return () => clearInterval(timer);
  }, [loadSellers]);

  // Approve Seller
  async function handleApprove(id) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/sellers/${id}/approve`, {
        method: 'PATCH',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve seller');
      toast.success(data.message || 'Seller approved successfully!');
      loadSellers(false);
      if (selectedSellerDetail && selectedSellerDetail.seller._id === id) {
        openSellerDetail(id);
      }
    } catch (err) {
      toast.error(err.message || 'Approve error');
    } finally {
      setBusyId(null);
    }
  }

  // Confirm Reject or Suspend
  async function handleConfirmAction() {
    if (!actionTarget || !actionReason.trim()) {
      toast.error('Please provide a reason.');
      return;
    }
    const { seller, type } = actionTarget;
    setBusyId(seller._id);

    try {
      const endpoint =
        type === 'suspend'
          ? `/api/admin/sellers/${seller._id}/suspend`
          : `/api/admin/sellers/${seller._id}/reject`;

      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: actionReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${type} seller`);

      toast.success(data.message || `Seller ${type}ed successfully.`);
      setActionTarget(null);
      setActionReason('');
      loadSellers(false);
      if (selectedSellerDetail && selectedSellerDetail.seller._id === seller._id) {
        openSellerDetail(seller._id);
      }
    } catch (err) {
      toast.error(err.message || 'Action error');
    } finally {
      setBusyId(null);
    }
  }

  // Load detailed seller data & documents
  async function openSellerDetail(id) {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/sellers/${id}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load details');
      setSelectedSellerDetail(data);
    } catch (err) {
      toast.error(err.message || 'Error loading seller profile');
    } finally {
      setDetailLoading(false);
    }
  }

  // Verify Document
  async function handleVerifyDoc(docId) {
    if (!selectedSellerDetail) return;
    const sellerId = selectedSellerDetail.seller._id;
    try {
      const res = await fetch(`/api/admin/sellers/${sellerId}/documents/${docId}/verify`, {
        method: 'PATCH',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');
      toast.success('Document verified!');
      openSellerDetail(sellerId);
    } catch (err) {
      toast.error(err.message || 'Error');
    }
  }

  // Reject Document
  async function handleConfirmDocReject() {
    if (!docRejectTarget || !docRejectRemarks.trim() || !selectedSellerDetail) {
      toast.error('Please enter rejection remarks.');
      return;
    }
    const sellerId = selectedSellerDetail.seller._id;
    const docId = docRejectTarget._id;
    try {
      const res = await fetch(`/api/admin/sellers/${sellerId}/documents/${docId}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remarks: docRejectRemarks.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Rejection failed');
      toast.success('Document marked as rejected.');
      setDocRejectTarget(null);
      setDocRejectRemarks('');
      openSellerDetail(sellerId);
    } catch (err) {
      toast.error(err.message || 'Error');
    }
  }

  // Verify full seller profile
  async function handleVerifySellerProfile(status, remarks = '') {
    if (!selectedSellerDetail) return;
    const sellerId = selectedSellerDetail.seller._id;
    try {
      const res = await fetch(`/api/admin/sellers/${sellerId}/profile/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, remarks }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Profile status update failed');
      toast.success(data.message || `Profile marked as ${status}`);
      openSellerDetail(sellerId);
      loadSellers(false);
    } catch (err) {
      toast.error(err.message || 'Error');
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#000000]">
            Seller Applications & Verification
          </h1>
          <p className="text-xs text-[#6B6B6B] mt-1">
            Review business credentials, verify uploaded documents, and approve seller stores.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadSellers(false)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-[#D6D6D6] hover:border-black transition-all self-start"
        >
          <RefreshCw size={12} className={refreshing ? 'animate-spin text-[#C9A227]' : ''} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Search & Tabs */}
      <div className="bg-white rounded-2xl border border-[#E8E8E8] p-4 shadow-xs space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A9A9A]" />
          <input
            type="text"
            placeholder="Search by seller name, business name, email, phone, or GST number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-[#D6D6D6] outline-none focus:border-black"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar border-b border-[#E8E8E8] pb-1">
          {TABS.map((t) => {
            const count = counts[t.key] ?? 0;
            const isActive = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${isActive
                    ? 'border-black text-black'
                    : 'border-transparent text-[#6B6B6B] hover:text-black'
                  }`}
              >
                <span>{t.label}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full ${isActive ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-600'
                    }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sellers List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-[#6B6B6B]">
          <Loader2 size={24} className="animate-spin text-[#C9A227] mx-auto mb-2" />
          <span>Loading sellers from MongoDB Atlas…</span>
        </div>
      ) : sellers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E8E8E8] p-12 text-center">
          <Store size={32} className="mx-auto text-[#9A9A9A] mb-2" />
          <h3 className="text-sm font-bold text-[#000000]">No {tab !== 'all' ? tab : ''} sellers found</h3>
          <p className="text-xs text-[#6B6B6B] mt-1">
            {search ? 'Try clearing your search query.' : 'There are currently no seller accounts matching this status.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sellers.map((s) => (
            <div
              key={s._id}
              className="bg-white rounded-2xl border border-[#E8E8E8] p-5 shadow-xs hover:border-[#D6D6D6] transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-sm sm:text-base text-[#000000]">
                    {s.businessName || s.name}
                  </h3>
                  <StatusBadge status={s.status} />
                  {s.profileVerificationStatus === 'verified' ? (
                    <span className="text-[10px] font-semibold text-[#1B8A3E] bg-[#E3F3E8] px-2 py-0.5 rounded-full">
                      ✓ Profile Verified
                    </span>
                  ) : s.profileVerificationStatus === 'in_review' ? (
                    <span className="text-[10px] font-semibold text-[#8A6D1B] bg-[#FBF3D9] px-2 py-0.5 rounded-full">
                      Documents In Review
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center gap-4 text-xs text-[#6B6B6B] flex-wrap">
                  <span>Owner: <strong className="text-black">{s.name}</strong></span>
                  <span>•</span>
                  <span>{s.email}</span>
                  {s.businessPhone && (
                    <>
                      <span>•</span>
                      <span>Ph: {s.businessPhone}</span>
                    </>
                  )}
                  {s.gstNumber && (
                    <>
                      <span>•</span>
                      <span>GST: <span className="font-mono text-black">{s.gstNumber}</span></span>
                    </>
                  )}
                </div>

                {s.shopAddress && (
                  <p className="text-xs text-[#6B6B6B] truncate">
                    Address: {s.shopAddress}
                  </p>
                )}

                {s.rejectionReason && (
                  <div className="text-xs text-[#B3261E] bg-[#FCE8E6] p-2 rounded-lg">
                    Rejection Reason: {s.rejectionReason}
                  </div>
                )}
                {s.suspensionReason && (
                  <div className="text-xs text-[#B3261E] bg-[#FCE8E6] p-2 rounded-lg">
                    Suspension Reason: {s.suspensionReason}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={() => openSellerDetail(s._id)}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-black text-black hover:bg-neutral-50 transition-all flex items-center gap-1.5"
                >
                  <FileCheck size={13} />
                  <span>Review Documents</span>
                </button>

                {s.status !== 'approved' && (
                  <button
                    type="button"
                    onClick={() => handleApprove(s._id)}
                    disabled={busyId === s._id}
                    className="px-3.5 py-2 text-xs font-bold rounded-xl bg-black text-white hover:bg-neutral-800 disabled:opacity-50 transition-all"
                  >
                    Approve
                  </button>
                )}

                {s.status !== 'rejected' && s.status !== 'suspended' && (
                  <button
                    type="button"
                    onClick={() => {
                      setActionTarget({ seller: s, type: 'reject' });
                      setActionReason('');
                    }}
                    className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-[#D6D6D6] text-[#B3261E] hover:bg-red-50 transition-all"
                  >
                    Reject
                  </button>
                )}

                {s.status === 'approved' && (
                  <button
                    type="button"
                    onClick={() => {
                      setActionTarget({ seller: s, type: 'suspend' });
                      setActionReason('');
                    }}
                    className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-[#D6D6D6] text-[#B3261E] hover:bg-red-50 transition-all"
                  >
                    Suspend
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject / Suspend Modal */}
      {actionTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E8E8E8]">
            <h3 className="text-base font-bold text-black capitalize mb-1">
              {actionTarget.type} Seller: {actionTarget.seller.businessName || actionTarget.seller.name}
            </h3>
            <p className="text-xs text-[#6B6B6B] mb-4">
              Please provide the official reason for this decision. It will be recorded in the audit log and displayed to the seller.
            </p>

            <textarea
              rows={3}
              required
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder={`Enter reason for ${actionTarget.type}ing this account...`}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#D6D6D6] outline-none focus:border-black mb-4"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActionTarget(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-[#D6D6D6] text-[#6B6B6B]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={busyId === actionTarget.seller._id || !actionReason.trim()}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-[#B3261E] text-white hover:bg-red-700 disabled:opacity-50 transition-all"
              >
                Confirm {actionTarget.type}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Profile & Documents Drawer / Modal */}
      {selectedSellerDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#E8E8E8] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#E8E8E8]">
              <div>
                <h2 className="text-base font-bold text-black">
                  Seller Credentials & Documents
                </h2>
                <p className="text-xs text-[#6B6B6B]">
                  {selectedSellerDetail.seller.businessName} • {selectedSellerDetail.seller.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSellerDetail(null)}
                className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-[#6B6B6B] hover:text-black"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Profile Details Overview */}
              <div className="p-4 rounded-xl bg-neutral-50 border border-[#E8E8E8] text-xs space-y-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-[#6B6B6B] block">Business Name:</span>
                    <strong className="text-black">{selectedSellerDetail.seller.businessName}</strong>
                  </div>
                  <div>
                    <span className="text-[#6B6B6B] block">Contact Phone:</span>
                    <strong className="text-black">{selectedSellerDetail.seller.businessPhone || '—'}</strong>
                  </div>
                  <div>
                    <span className="text-[#6B6B6B] block">GSTIN:</span>
                    <strong className="text-black font-mono">{selectedSellerDetail.seller.gstNumber || 'Not provided'}</strong>
                  </div>
                  <div>
                    <span className="text-[#6B6B6B] block">Pickup City:</span>
                    <strong className="text-black">{selectedSellerDetail.profile?.pickupAddress?.city || '—'}</strong>
                  </div>
                  <div>
                    <span className="text-[#6B6B6B] block">Bank Name:</span>
                    <strong className="text-black">{selectedSellerDetail.profile?.bankDetails?.bankName || '—'}</strong>
                  </div>
                  <div>
                    <span className="text-[#6B6B6B] block">Bank A/C & IFSC:</span>
                    <strong className="text-black font-mono">
                      {selectedSellerDetail.profile?.bankDetails?.accountNumber
                        ? `${selectedSellerDetail.profile.bankDetails.accountNumber} (${selectedSellerDetail.profile.bankDetails.ifscCode})`
                        : '—'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Uploaded Documents List */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-black">
                  Uploaded Verification Documents ({selectedSellerDetail.documents?.length || 0})
                </h3>

                {selectedSellerDetail.documents?.length === 0 ? (
                  <p className="text-xs text-[#6B6B6B] p-4 rounded-xl border border-dashed border-[#D6D6D6] text-center">
                    No documents uploaded by this seller yet.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {selectedSellerDetail.documents.map((doc) => (
                      <div
                        key={doc._id}
                        className="p-3.5 rounded-xl border border-[#E8E8E8] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-black">{doc.documentName}</span>
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${doc.verificationStatus === 'verified'
                                  ? 'bg-[#E3F3E8] text-[#1B8A3E]'
                                  : doc.verificationStatus === 'rejected'
                                    ? 'bg-[#FCE8E6] text-[#B3261E]'
                                    : 'bg-[#FBF3D9] text-[#8A6D1B]'
                                }`}
                            >
                              {doc.verificationStatus}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                            File: {doc.fileName} • {Math.round((doc.fileSize || 0) / 1024)} KB
                          </p>
                          {doc.remarks && (
                            <p className="text-[11px] text-[#B3261E] mt-1">Remarks: {doc.remarks}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#D6D6D6] hover:bg-neutral-50"
                          >
                            <ExternalLink size={12} /> View Document
                          </a>

                          {doc.verificationStatus !== 'verified' && (
                            <button
                              type="button"
                              onClick={() => handleVerifyDoc(doc._id)}
                              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-black text-white hover:bg-neutral-800"
                            >
                              Verify
                            </button>
                          )}

                          {doc.verificationStatus !== 'rejected' && (
                            <button
                              type="button"
                              onClick={() => {
                                setDocRejectTarget(doc);
                                setDocRejectRemarks('');
                              }}
                              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#D6D6D6] text-[#B3261E] hover:bg-red-50"
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Overall Profile Verification Decision */}
              <div className="pt-4 border-t border-[#E8E8E8] flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-black block">
                    Overall Profile Verification Status
                  </span>
                  <span className="text-[11px] text-[#6B6B6B]">
                    Current status: <strong className="capitalize">{selectedSellerDetail.seller.profileVerificationStatus || 'Pending'}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleVerifySellerProfile('rejected', 'Documents could not be verified')}
                    className="px-4 py-2 text-xs font-semibold rounded-xl border border-[#D6D6D6] text-[#B3261E] hover:bg-red-50"
                  >
                    Reject Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVerifySellerProfile('verified', 'All documents and credentials verified')}
                    className="px-5 py-2 text-xs font-bold rounded-xl bg-black text-white hover:bg-neutral-800"
                  >
                    Mark Profile as Verified
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Reject Modal */}
      {docRejectTarget && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-[#E8E8E8]">
            <h4 className="text-sm font-bold text-black mb-1">
              Reject Document: {docRejectTarget.documentName}
            </h4>
            <p className="text-xs text-[#6B6B6B] mb-3">
              Explain why this document was rejected so the seller can re-upload a valid copy.
            </p>
            <textarea
              rows={3}
              value={docRejectRemarks}
              onChange={(e) => setDocRejectRemarks(e.target.value)}
              placeholder="e.g. Document image is blurry or expired"
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#D6D6D6] outline-none focus:border-black mb-3"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDocRejectTarget(null)}
                className="px-3 py-1.5 text-xs rounded-lg border border-[#D6D6D6] text-[#6B6B6B]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDocReject}
                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-[#B3261E] text-white hover:bg-red-700"
              >
                Reject Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    pending: 'bg-[#FBF3D9] text-[#8A6D1B]',
    approved: 'bg-[#E3F3E8] text-[#1B8A3E]',
    rejected: 'bg-[#FCE8E6] text-[#B3261E]',
    suspended: 'bg-[#FCE8E6] text-[#B3261E]',
  };
  return (
    <span className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full ${styles[status] || styles.pending}`}>
      {status}
    </span>
  );
}
