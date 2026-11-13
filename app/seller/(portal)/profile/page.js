'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Store,
  MapPin,
  Landmark,
  FileCheck,
  Upload,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Pencil,
  Trash2,
  ExternalLink,
  Loader2,
  Save,
  Send,
  HelpCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

const INK = '#000000';
const INK_SOFT = '#6B6B6B';
const GOLD = '#C9A227';
const LINE = '#E8E8E8';
const PAPER = '#FFFFFF';

const DOC_TYPES = [
  { key: 'gst_certificate', label: 'GST Registration Certificate', desc: 'Form GST REG-06 or certificate' },
  { key: 'pan_card', label: 'Business / Proprietor PAN Card', desc: 'Clear copy of valid PAN card' },
  { key: 'shop_license', label: 'Shop & Establishment License', desc: 'Trade license or municipal certificate' },
  { key: 'bank_proof', label: 'Bank Account Proof', desc: 'Cancelled cheque or first page of passbook' },
  { key: 'fssai_license', label: 'FSSAI License (for food sellers)', desc: 'FSSAI registration or state license' },
];

export default function SellerProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('business');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submittingVerification, setSubmittingVerification] = useState(false);

  // Profile data
  const [seller, setSeller] = useState(null);
  const [profile, setProfile] = useState({});
  const [documents, setDocuments] = useState([]);
  const [completion, setCompletion] = useState(0);

  // Upload modal / trigger state
  const [uploadDocType, setUploadDocType] = useState('gst_certificate');
  const [uploading, setUploading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch('/api/seller/profile', { cache: 'no-store' });
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/seller/login');
          return;
        }
      }
      const data = await res.json();
      if (data.seller) {
        setSeller(data.seller);
        setProfile(data.profile || {});
        setDocuments(data.documents || []);
        setCompletion(data.completion || 0);
      }
    } catch (err) {
      console.error('Error loading seller profile:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Form changes
  function updateSellerField(key, value) {
    setSeller((prev) => ({ ...prev, [key]: value }));
  }

  function updateProfileField(key, value) {
    setProfile((prev) => ({ ...prev, [key]: value }));
  }

  function updatePickup(key, value) {
    setProfile((prev) => ({
      ...prev,
      pickupAddress: { ...(prev.pickupAddress || {}), [key]: value },
    }));
  }

  function updateReturn(key, value) {
    setProfile((prev) => ({
      ...prev,
      returnAddress: { ...(prev.returnAddress || {}), [key]: value },
    }));
  }

  function updateBank(key, value) {
    setProfile((prev) => ({
      ...prev,
      bankDetails: { ...(prev.bankDetails || {}), [key]: value },
    }));
  }

  // Save changes to backend
  async function handleSave(e) {
    if (e) e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        name: seller.name,
        businessName: seller.businessName,
        businessPhone: seller.businessPhone,
        whatsappNumber: seller.whatsappNumber,
        shopAddress: seller.shopAddress,
        gstNumber: seller.gstNumber,
        description: profile.description,
        category: profile.category,
        website: profile.website,
        pickupAddress: profile.pickupAddress,
        returnAddress: profile.returnAddress,
        bankDetails: profile.bankDetails,
      };

      const res = await fetch('/api/seller/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      toast.success('Profile details saved successfully!');
      setSeller(data.seller);
      setProfile(data.profile);
      setCompletion(data.completion);
    } catch (err) {
      toast.error(err.message || 'Error saving profile');
    } finally {
      setSaving(false);
    }
  }

  // Submit profile for verification
  async function handleSubmitVerification() {
    setSubmittingVerification(true);
    try {
      // First save any unsaved changes
      await handleSave();

      const res = await fetch('/api/seller/profile/submit', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');

      toast.success(data.message || 'Submitted for verification!');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Submission error');
    } finally {
      setSubmittingVerification(false);
    }
  }

  // Document upload handler
  async function handleDocUpload(e, docType) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('documentType', docType);

    try {
      const res = await fetch('/api/seller/documents/upload', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      toast.success(data.message || 'Document uploaded successfully!');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Upload error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  // Delete Document
  async function handleDeleteDoc(docId) {
    if (!confirm('Are you sure you want to remove this document?')) return;
    try {
      const res = await fetch(`/api/seller/documents/${docId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');

      toast.success('Document removed.');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Error removing document');
    }
  }

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-xs text-[#6B6B6B]">
        <Loader2 size={24} className="animate-spin text-[#C9A227] mr-2" />
        <span>Loading seller profile…</span>
      </div>
    );
  }

  const verStatus = seller?.profileVerificationStatus || 'not_submitted';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Profile Card */}
      <div className="bg-white rounded-2xl border border-[#E8E8E8] p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#FAF7F0] border border-[#E7E2D6] flex items-center justify-center text-2xl font-bold text-[#C9A227]">
            {seller?.businessName?.[0] || 'S'}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-[#000000]">
                {seller?.businessName || seller?.name || 'Seller Profile'}
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#E3F3E8] text-[#1B8A3E]">
                Active Seller
              </span>
            </div>
            <p className="text-xs text-[#6B6B6B] mt-0.5">
              Owner: {seller?.name} • {seller?.email} • Ph: {seller?.businessPhone}
            </p>
          </div>
        </div>

        {/* Profile Completion & Verification Pill */}
        <div className="w-full md:w-64 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-[#1A1A1A]">Profile Completion</span>
            <span className="font-bold text-[#C9A227]">{completion}%</span>
          </div>
          <div className="h-2 w-full bg-[#EEEEEE] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#C9A227] rounded-full transition-all duration-500"
              style={{ width: `${completion}%` }}
            />
          </div>
          <div className="flex items-center justify-between pt-1 text-[11px]">
            <span className="text-[#6B6B6B]">Verification:</span>
            {verStatus === 'verified' ? (
              <span className="font-bold text-[#1B8A3E] flex items-center gap-1">
                <CheckCircle2 size={12} /> Verified Seller
              </span>
            ) : verStatus === 'in_review' ? (
              <span className="font-bold text-[#C9A227] flex items-center gap-1">
                <Clock size={12} /> Under Review
              </span>
            ) : verStatus === 'rejected' ? (
              <span className="font-bold text-[#B3261E] flex items-center gap-1">
                <XCircle size={12} /> Verification Failed
              </span>
            ) : (
              <span className="font-semibold text-[#8A6D1B]">Pending Submission</span>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#E8E8E8] gap-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'business', label: 'Business Details', icon: Store },
          { id: 'address', label: 'Pickup & Returns', icon: MapPin },
          { id: 'bank', label: 'Bank Account', icon: Landmark },
          { id: 'documents', label: 'Documents & Verification', icon: FileCheck },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
                isActive
                  ? 'border-[#000000] text-[#000000] bg-neutral-50 rounded-t-lg'
                  : 'border-transparent text-[#6B6B6B] hover:text-[#000000]'
              }`}
            >
              <Icon size={15} className={isActive ? 'text-[#C9A227]' : ''} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Business Details */}
      {activeTab === 'business' && (
        <div className="bg-white rounded-2xl border border-[#E8E8E8] p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#000000]">
            Business Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Owner Full Name</label>
              <input
                type="text"
                value={seller?.name || ''}
                onChange={(e) => updateSellerField('name', e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#D6D6D6] outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Shop / Brand Name</label>
              <input
                type="text"
                value={seller?.businessName || ''}
                onChange={(e) => updateSellerField('businessName', e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#D6D6D6] outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Business Phone</label>
              <input
                type="text"
                value={seller?.businessPhone || ''}
                onChange={(e) => updateSellerField('businessPhone', e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#D6D6D6] outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">WhatsApp Support Number</label>
              <input
                type="text"
                value={seller?.whatsappNumber || ''}
                onChange={(e) => updateSellerField('whatsappNumber', e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#D6D6D6] outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Registered GSTIN</label>
              <input
                type="text"
                value={seller?.gstNumber || ''}
                onChange={(e) => updateSellerField('gstNumber', e.target.value.toUpperCase())}
                placeholder="15-character GST number"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#D6D6D6] outline-none focus:border-black uppercase font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Primary Product Category</label>
              <input
                type="text"
                value={profile.category || ''}
                onChange={(e) => updateProfileField('category', e.target.value)}
                placeholder="e.g. Traditional Snacks, Saffron & Spices"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#D6D6D6] outline-none focus:border-black"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Business Description & Story</label>
            <textarea
              rows={3}
              value={profile.description || ''}
              onChange={(e) => updateProfileField('description', e.target.value)}
              placeholder="Tell customers about your craftsmanship, authentic recipes, and quality standards."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#D6D6D6] outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Website or Store URL (optional)</label>
            <input
              type="text"
              value={profile.website || ''}
              onChange={(e) => updateProfileField('website', e.target.value)}
              placeholder="https://..."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#D6D6D6] outline-none focus:border-black"
            />
          </div>
        </div>
      )}

      {/* Tab 2: Pickup & Return Addresses */}
      {activeTab === 'address' && (
        <div className="bg-white rounded-2xl border border-[#E8E8E8] p-6 shadow-xs space-y-6">
          {/* Pickup Address */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#000000] mb-3">
              Warehouse / Pickup Address (Where courier collects orders)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div className="sm:col-span-2 md:col-span-3">
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Street / Building Address</label>
                <input
                  type="text"
                  value={profile.pickupAddress?.street || ''}
                  onChange={(e) => updatePickup('street', e.target.value)}
                  placeholder="Door No, Street Name, Industrial Area"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#D6D6D6] outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">City / District</label>
                <input
                  type="text"
                  value={profile.pickupAddress?.city || ''}
                  onChange={(e) => updatePickup('city', e.target.value)}
                  placeholder="e.g. Chennai"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#D6D6D6] outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">State</label>
                <input
                  type="text"
                  value={profile.pickupAddress?.state || ''}
                  onChange={(e) => updatePickup('state', e.target.value)}
                  placeholder="e.g. Tamil Nadu"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#D6D6D6] outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Pincode</label>
                <input
                  type="text"
                  maxLength={6}
                  value={profile.pickupAddress?.pincode || ''}
                  onChange={(e) => updatePickup('pincode', e.target.value)}
                  placeholder="6-digit pincode"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#D6D6D6] outline-none focus:border-black font-mono"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-[#E8E8E8] pt-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#000000]">
                Customer Return Address
              </h2>
              <label className="flex items-center gap-1.5 text-xs text-[#6B6B6B] cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(profile.returnAddress?.sameAsPickup)}
                  onChange={(e) => updateReturn('sameAsPickup', e.target.checked)}
                  className="rounded"
                />
                <span>Same as Pickup Address</span>
              </label>
            </div>

            {!profile.returnAddress?.sameAsPickup && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="sm:col-span-2 md:col-span-3">
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Return Street Address</label>
                  <input
                    type="text"
                    value={profile.returnAddress?.street || ''}
                    onChange={(e) => updateReturn('street', e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#D6D6D6] outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">City</label>
                  <input
                    type="text"
                    value={profile.returnAddress?.city || ''}
                    onChange={(e) => updateReturn('city', e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#D6D6D6] outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">State</label>
                  <input
                    type="text"
                    value={profile.returnAddress?.state || ''}
                    onChange={(e) => updateReturn('state', e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#D6D6D6] outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Pincode</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={profile.returnAddress?.pincode || ''}
                    onChange={(e) => updateReturn('pincode', e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#D6D6D6] outline-none focus:border-black font-mono"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Bank Account Details */}
      {activeTab === 'bank' && (
        <div className="bg-white rounded-2xl border border-[#E8E8E8] p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#000000]">
              Bank Account for Payouts
            </h2>
            <span className="text-[11px] text-[#6B6B6B]">(Payments sent directly to this account)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Account Holder Name *</label>
              <input
                type="text"
                value={profile.bankDetails?.accountHolderName || ''}
                onChange={(e) => updateBank('accountHolderName', e.target.value)}
                placeholder="Matches business or proprietor name"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#D6D6D6] outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Bank Name *</label>
              <input
                type="text"
                value={profile.bankDetails?.bankName || ''}
                onChange={(e) => updateBank('bankName', e.target.value)}
                placeholder="e.g. HDFC Bank, SBI, ICICI"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#D6D6D6] outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Bank Account Number *</label>
              <input
                type="text"
                value={profile.bankDetails?.accountNumber || ''}
                onChange={(e) => updateBank('accountNumber', e.target.value.replace(/\D/g, ''))}
                placeholder="Account number"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#D6D6D6] outline-none focus:border-black font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">IFSC Code *</label>
              <input
                type="text"
                maxLength={11}
                value={profile.bankDetails?.ifscCode || ''}
                onChange={(e) => updateBank('ifscCode', e.target.value.toUpperCase())}
                placeholder="e.g. HDFC0001234"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#D6D6D6] outline-none focus:border-black font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Account Type</label>
              <select
                value={profile.bankDetails?.accountType || 'Current'}
                onChange={(e) => updateBank('accountType', e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#D6D6D6] outline-none focus:border-black bg-white"
              >
                <option value="Current">Current Account (Recommended for Business)</option>
                <option value="Savings">Savings Account (Proprietorship)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Documents & Verification */}
      {activeTab === 'documents' && (
        <div className="bg-white rounded-2xl border border-[#E8E8E8] p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#000000]">
              Business Documents & Verification
            </h2>
            <p className="text-xs text-[#6B6B6B] mt-0.5">
              Upload scanned copies or clear photos of your business certificates (PDF, JPG, PNG under 10 MB).
            </p>
          </div>

          {/* Upload Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DOC_TYPES.map((d) => {
              const existingDoc = documents.find((doc) => doc.documentType === d.key);
              return (
                <div
                  key={d.key}
                  className="p-4 rounded-xl border border-[#E8E8E8] bg-[#FAFAFA] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#000000]">{d.label}</span>
                      {existingDoc ? (
                        existingDoc.verificationStatus === 'verified' ? (
                          <span className="text-[10px] font-bold text-[#1B8A3E] bg-[#E3F3E8] px-2 py-0.5 rounded-full uppercase">
                            Verified
                          </span>
                        ) : existingDoc.verificationStatus === 'rejected' ? (
                          <span className="text-[10px] font-bold text-[#B3261E] bg-[#FCE8E6] px-2 py-0.5 rounded-full uppercase">
                            Rejected
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-[#8A6D1B] bg-[#FBF3D9] px-2 py-0.5 rounded-full uppercase">
                            Pending Review
                          </span>
                        )
                      ) : (
                        <span className="text-[10px] text-[#9A9A9A] bg-white border border-[#E8E8E8] px-2 py-0.5 rounded-full uppercase">
                          Not Uploaded
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#6B6B6B] mt-1">{d.desc}</p>

                    {existingDoc?.remarks && (
                      <div className="mt-2 text-[11px] p-2 rounded bg-amber-50 text-amber-900 border border-amber-200">
                        Admin Note: {existingDoc.remarks}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#E8E8E8] flex items-center justify-between gap-2">
                    {existingDoc ? (
                      <div className="flex items-center gap-2">
                        <a
                          href={existingDoc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#000000] hover:underline"
                        >
                          <ExternalLink size={12} /> View File
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDeleteDoc(existingDoc._id)}
                          className="text-[11px] text-[#B3261E] hover:underline flex items-center gap-1 ml-2"
                        >
                          <Trash2 size={12} /> Replace
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-[#9A9A9A]">No file chosen</span>
                    )}

                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-black text-white hover:bg-neutral-800 transition-all cursor-pointer">
                      <Upload size={12} />
                      <span>{existingDoc ? 'Re-upload' : 'Upload'}</span>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        disabled={uploading}
                        onChange={(e) => handleDocUpload(e, d.key)}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Sticky Action Bar */}
      <div className="bg-white rounded-2xl border border-[#E8E8E8] p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="text-xs text-[#6B6B6B]">
          {verStatus === 'verified' ? (
            <span className="text-[#1B8A3E] font-semibold flex items-center gap-1">
              <CheckCircle2 size={14} /> Your seller profile and documents are officially verified.
            </span>
          ) : verStatus === 'in_review' ? (
            <span className="text-[#8A6D1B] font-semibold flex items-center gap-1">
              <Clock size={14} /> Profile submitted and waiting for administrator review.
            </span>
          ) : (
            <span>Save your changes and submit for verification once complete.</span>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl text-xs font-bold border border-black bg-white text-black hover:bg-neutral-50 disabled:opacity-50 transition-all flex items-center gap-1.5"
          >
            {saving ? <Loader2 size={14} className="animate-spin text-[#C9A227]" /> : <Save size={14} />}
            <span>Save Draft</span>
          </button>

          {verStatus !== 'verified' && verStatus !== 'in_review' && (
            <button
              type="button"
              onClick={handleSubmitVerification}
              disabled={submittingVerification}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-black text-white hover:bg-neutral-800 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-sm"
            >
              {submittingVerification ? (
                <Loader2 size={14} className="animate-spin text-[#C9A227]" />
              ) : (
                <Send size={14} className="text-[#C9A227]" />
              )}
              <span>Submit for Verification</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
