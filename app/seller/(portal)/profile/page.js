'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
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
  Trash2,
  ExternalLink,
  Loader2,
  Save,
  Send,
  HelpCircle,
  Truck,
  FileText,
  ShieldCheck,
  Building,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  validatePhone,
  validateGSTIN,
  validatePincode,
  validateBankAccount,
  validateIFSC,
  validateFSSAI,
  isFoodCategory,
} from '@/lib/sellerValidation';

const DOC_TYPES = [
  { key: 'pan_card', label: 'Business / Proprietor PAN Card', desc: 'Clear copy of valid PAN card (PDF, JPG, PNG)', required: true },
  { key: 'gst_certificate', label: 'GST Registration Certificate', desc: 'Form GST REG-06 or certificate', required: false },
  { key: 'cancelled_cheque', label: 'Cancelled Cheque / Bank Proof', desc: 'Cancelled cheque showing name, account & IFSC', required: true },
  { key: 'fssai_certificate', label: 'FSSAI Certificate (Food & Groceries)', desc: 'Mandatory for food, snack, sweet, grocery merchants', required: false },
  { key: 'address_proof', label: 'Business Address Proof', desc: 'Electricity bill, lease agreement or municipal trade license', required: true },
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

  // Bank account confirmation
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');

  // Uploading state tracking by document type
  const [uploadingDoc, setUploadingDoc] = useState(null);

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
        if (data.profile?.bankDetails?.accountNumber) {
          setConfirmAccountNumber(data.profile.bankDetails.accountNumber);
        }
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

  // Form updates
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

  // Real-time Field Validations (Feature 8)
  const validationErrors = useMemo(() => {
    const errors = {};

    // Phone
    if (seller?.businessPhone) {
      const err = validatePhone(seller.businessPhone);
      if (err) errors.businessPhone = err;
    }

    // GSTIN
    if (seller?.gstNumber) {
      const err = validateGSTIN(seller.gstNumber);
      if (err) errors.gstNumber = err;
    }

    // Pincode
    if (profile.pickupAddress?.pincode) {
      const err = validatePincode(profile.pickupAddress.pincode);
      if (err) errors.pickupPincode = err;
    }

    // Bank Account
    if (profile.bankDetails?.accountNumber) {
      const err = validateBankAccount(
        profile.bankDetails.accountNumber,
        confirmAccountNumber
      );
      if (err) errors.accountNumber = err;
    }

    // IFSC
    if (profile.bankDetails?.ifscCode) {
      const err = validateIFSC(profile.bankDetails.ifscCode);
      if (err) errors.ifscCode = err;
    }

    // FSSAI
    const category = profile.category || '';
    if (profile.fssaiNumber || isFoodCategory(category)) {
      const err = validateFSSAI(profile.fssaiNumber, category);
      if (err) errors.fssaiNumber = err;
    }

    return errors;
  }, [seller, profile, confirmAccountNumber]);

  // Save changes to backend
  async function handleSave(e) {
    if (e) e.preventDefault();

    // Check errors
    const errorKeys = Object.keys(validationErrors);
    if (errorKeys.length > 0) {
      toast.error(validationErrors[errorKeys[0]]);
      return;
    }

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
        fssaiNumber: profile.fssaiNumber,
        panNumber: profile.panNumber,
        website: profile.website,
        deliveryCharge: Number(profile.deliveryCharge) || 0,
        freeDeliveryThreshold: Number(profile.freeDeliveryThreshold) || 0,
        minOrderValue: Number(profile.minOrderValue) || 0,
        pickupAddress: profile.pickupAddress,
        returnAddress: profile.returnAddress,
        bankDetails: {
          ...profile.bankDetails,
          confirmAccountNumber,
        },
      };

      const res = await fetch('/api/seller/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      toast.success('Profile saved with verified standards!');
      setSeller(data.seller);
      setProfile(data.profile);
      setCompletion(data.completion);
    } catch (err) {
      toast.error(err.message || 'Error saving profile');
    } finally {
      setSaving(false);
    }
  }

  // Document upload handler
  async function handleDocUpload(e, docType) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Document file exceeds 5 MB limit. Please upload a smaller file.');
      e.target.value = '';
      return;
    }

    setUploadingDoc(docType);
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

      toast.success('Document uploaded successfully!');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Upload error');
    } finally {
      setUploadingDoc(null);
      e.target.value = '';
    }
  }

  async function handleDeleteDoc(docId) {
    if (!confirm('Are you sure you want to remove this verification document?')) return;
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
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Top Profile Card */}
      <div className="bg-white rounded-3xl border border-[#E7E2D6] p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#FAF7F0] border border-[#E7E2D6] flex items-center justify-center text-2xl font-bold text-[#C9A227]">
            {seller?.businessName?.[0] || 'S'}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-[#0F172A]">
                {seller?.businessName || seller?.name || 'Seller Profile'}
              </h1>
              {seller?.status === 'approved' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 size={12} />
                  <span>Approved Merchant</span>
                </span>
              )}
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Account: {seller?.email} • ID: {seller?._id}
            </p>
          </div>
        </div>

        {/* Completion Progress Bar */}
        <div className="w-full md:w-56 bg-[#FAF9F5] p-3.5 rounded-2xl border border-[#E7E2D6]">
          <div className="flex justify-between items-center text-xs font-bold mb-1.5">
            <span className="text-[#64748B]">Profile Verification</span>
            <span className="text-[#C9A227]">{completion}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#E8E8E8] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 bg-[#C9A227]"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-[#E7E2D6]">
        {[
          { key: 'business', label: 'Business Profile', icon: Store },
          { key: 'address', label: 'Pickup & Returns', icon: MapPin },
          { key: 'bank', label: 'Bank & Payouts', icon: Landmark },
          { key: 'documents', label: 'Documents & Verification', icon: FileCheck },
          { key: 'delivery', label: 'Delivery Charges', icon: Truck },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                active
                  ? 'bg-[#0F172A] text-white shadow-xs'
                  : 'bg-white text-[#64748B] hover:text-[#0F172A] border border-[#E7E2D6]'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Business Profile */}
      {activeTab === 'business' && (
        <div className="bg-white rounded-3xl border border-[#E7E2D6] p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#0F172A]">
            Merchant Business Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">
                Proprietor / Contact Name *
              </label>
              <input
                type="text"
                value={seller?.name || ''}
                onChange={(e) => updateSellerField('name', e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#D6D6D6] outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">
                Shop / Business Trade Name *
              </label>
              <input
                type="text"
                value={seller?.businessName || ''}
                onChange={(e) => updateSellerField('businessName', e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#D6D6D6] outline-none focus:border-black"
              />
            </div>

            {/* Phone with 10-digit Indian validation */}
            <div>
              <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">
                Business Mobile Number (10 Digits) *
              </label>
              <input
                type="tel"
                maxLength={10}
                placeholder="9876543210"
                value={seller?.businessPhone || ''}
                onChange={(e) => updateSellerField('businessPhone', e.target.value.replace(/\D/g, ''))}
                className={`w-full px-3.5 py-2.5 text-xs rounded-xl border font-mono outline-none ${
                  validationErrors.businessPhone
                    ? 'border-red-400 bg-red-50 text-red-700'
                    : 'border-[#D6D6D6] focus:border-black'
                }`}
              />
              {validationErrors.businessPhone ? (
                <p className="text-[11px] text-red-600 mt-1">{validationErrors.businessPhone}</p>
              ) : (
                <p className="text-[10px] text-[#64748B] mt-1">Must start with 6, 7, 8, or 9.</p>
              )}
            </div>

            {/* GSTIN with 15-character validation */}
            <div>
              <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">
                GSTIN (15 Characters)
              </label>
              <input
                type="text"
                maxLength={15}
                placeholder="22AAAAA0000A1Z5"
                value={seller?.gstNumber || ''}
                onChange={(e) => updateSellerField('gstNumber', e.target.value.toUpperCase())}
                className={`w-full px-3.5 py-2.5 text-xs rounded-xl border font-mono uppercase outline-none ${
                  validationErrors.gstNumber
                    ? 'border-red-400 bg-red-50 text-red-700'
                    : 'border-[#D6D6D6] focus:border-black'
                }`}
              />
              {validationErrors.gstNumber && (
                <p className="text-[11px] text-red-600 mt-1">{validationErrors.gstNumber}</p>
              )}
            </div>

            {/* Primary Category */}
            <div>
              <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">
                Primary Business Category *
              </label>
              <select
                value={profile.category || ''}
                onChange={(e) => updateProfileField('category', e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#D6D6D6] outline-none focus:border-black bg-white"
              >
                <option value="">Select primary category…</option>
                <option value="Snacks">Snacks</option>
                <option value="Sweets">Sweets</option>
                <option value="Groceries">Groceries</option>
                <option value="Clothing">Clothing</option>
                <option value="Electronics">Electronics</option>
                <option value="Vegetables">Vegetables</option>
                <option value="Fruits">Fruits</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* FSSAI 14-digit validation */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                  FSSAI License Number (14 Digits)
                </label>
                {isFoodCategory(profile.category) && (
                  <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                    Mandatory for Food
                  </span>
                )}
              </div>
              <input
                type="text"
                maxLength={14}
                placeholder="14-digit license number"
                value={profile.fssaiNumber || ''}
                onChange={(e) => updateProfileField('fssaiNumber', e.target.value.replace(/\D/g, ''))}
                className={`w-full px-3.5 py-2.5 text-xs rounded-xl border font-mono outline-none ${
                  validationErrors.fssaiNumber
                    ? 'border-red-400 bg-red-50 text-red-700'
                    : 'border-[#D6D6D6] focus:border-black'
                }`}
              />
              {validationErrors.fssaiNumber && (
                <p className="text-[11px] text-red-600 mt-1">{validationErrors.fssaiNumber}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">
              Store Description
            </label>
            <textarea
              rows={3}
              value={profile.description || ''}
              onChange={(e) => updateProfileField('description', e.target.value)}
              placeholder="Describe your authentic origin, crafting process, and quality standards."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#D6D6D6] outline-none focus:border-black resize-none"
            />
          </div>
        </div>
      )}

      {/* Tab 2: Pickup & Return Address */}
      {activeTab === 'address' && (
        <div className="bg-white rounded-3xl border border-[#E7E2D6] p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#0F172A] mb-3">
              Warehouse Pickup Address (Courier Collection)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">
                  Street / Building Address *
                </label>
                <input
                  type="text"
                  value={profile.pickupAddress?.street || ''}
                  onChange={(e) => updatePickup('street', e.target.value)}
                  placeholder="Door No, Street Name, Industrial Estate"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#D6D6D6] outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">
                  City *
                </label>
                <input
                  type="text"
                  value={profile.pickupAddress?.city || ''}
                  onChange={(e) => updatePickup('city', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#D6D6D6] outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">
                  State *
                </label>
                <input
                  type="text"
                  value={profile.pickupAddress?.state || ''}
                  onChange={(e) => updatePickup('state', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#D6D6D6] outline-none focus:border-black"
                />
              </div>

              {/* Pincode 6-digit non-zero validation */}
              <div>
                <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">
                  Pincode (6 Digits) *
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="600001"
                  value={profile.pickupAddress?.pincode || ''}
                  onChange={(e) => updatePickup('pincode', e.target.value.replace(/\D/g, ''))}
                  className={`w-full px-3.5 py-2.5 text-xs rounded-xl border font-mono outline-none ${
                    validationErrors.pickupPincode
                      ? 'border-red-400 bg-red-50 text-red-700'
                      : 'border-[#D6D6D6] focus:border-black'
                  }`}
                />
                {validationErrors.pickupPincode && (
                  <p className="text-[11px] text-red-600 mt-1">{validationErrors.pickupPincode}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Bank Account & IFSC */}
      {activeTab === 'bank' && (
        <div className="bg-white rounded-3xl border border-[#E7E2D6] p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#0F172A]">
            Bank Account for Direct Payouts
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">
                Account Holder Name *
              </label>
              <input
                type="text"
                value={profile.bankDetails?.accountHolderName || ''}
                onChange={(e) => updateBank('accountHolderName', e.target.value)}
                placeholder="Matches business or proprietor name"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#D6D6D6] outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">
                Bank Name *
              </label>
              <input
                type="text"
                value={profile.bankDetails?.bankName || ''}
                onChange={(e) => updateBank('bankName', e.target.value)}
                placeholder="e.g. HDFC Bank, State Bank of India"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#D6D6D6] outline-none focus:border-black"
              />
            </div>

            {/* Bank Account Number 9 to 18 digits */}
            <div>
              <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">
                Bank Account Number (9 - 18 Digits) *
              </label>
              <input
                type="text"
                maxLength={18}
                value={profile.bankDetails?.accountNumber || ''}
                onChange={(e) => updateBank('accountNumber', e.target.value.replace(/\D/g, ''))}
                placeholder="Enter account number"
                className={`w-full px-3.5 py-2.5 text-xs rounded-xl border font-mono outline-none ${
                  validationErrors.accountNumber
                    ? 'border-red-400 bg-red-50 text-red-700'
                    : 'border-[#D6D6D6] focus:border-black'
                }`}
              />
            </div>

            {/* Confirm Bank Account Number */}
            <div>
              <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">
                Confirm Bank Account Number *
              </label>
              <input
                type="text"
                maxLength={18}
                value={confirmAccountNumber}
                onChange={(e) => setConfirmAccountNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="Re-enter account number to confirm"
                className={`w-full px-3.5 py-2.5 text-xs rounded-xl border font-mono outline-none ${
                  validationErrors.accountNumber
                    ? 'border-red-400 bg-red-50 text-red-700'
                    : 'border-[#D6D6D6] focus:border-black'
                }`}
              />
              {validationErrors.accountNumber && (
                <p className="text-[11px] text-red-600 mt-1">{validationErrors.accountNumber}</p>
              )}
            </div>

            {/* IFSC Code */}
            <div>
              <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">
                Bank IFSC Code (11 Characters) *
              </label>
              <input
                type="text"
                maxLength={11}
                value={profile.bankDetails?.ifscCode || ''}
                onChange={(e) => updateBank('ifscCode', e.target.value.toUpperCase())}
                placeholder="e.g. HDFC0001234"
                className={`w-full px-3.5 py-2.5 text-xs rounded-xl border font-mono uppercase outline-none ${
                  validationErrors.ifscCode
                    ? 'border-red-400 bg-red-50 text-red-700'
                    : 'border-[#D6D6D6] focus:border-black'
                }`}
              />
              {validationErrors.ifscCode ? (
                <p className="text-[11px] text-red-600 mt-1">{validationErrors.ifscCode}</p>
              ) : (
                <p className="text-[10px] text-[#64748B] mt-1">4 letters, 5th character must be 0, followed by 6 alphanumeric characters.</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">
                Account Type
              </label>
              <select
                value={profile.bankDetails?.accountType || 'Current'}
                onChange={(e) => updateBank('accountType', e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#D6D6D6] outline-none focus:border-black bg-white"
              >
                <option value="Current">Current Account</option>
                <option value="Savings">Savings Account</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Document Uploads (PAN, GST, Cancelled Cheque, FSSAI, Address Proof) */}
      {activeTab === 'documents' && (
        <div className="bg-white rounded-3xl border border-[#E7E2D6] p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#0F172A]">
              Compliance & Verification Documents
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Upload clear scanned copies (PDF, JPG, PNG under 5 MB). URLs are stored securely.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DOC_TYPES.map((d) => {
              const existingDoc = documents.find((doc) => doc.documentType === d.key);
              const isUploadingThis = uploadingDoc === d.key;

              return (
                <div
                  key={d.key}
                  className="p-5 rounded-2xl border border-[#E7E2D6] bg-[#FCFBF8] flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#0F172A]">{d.label}</span>
                      {existingDoc ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 uppercase">
                          Uploaded
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#64748B] bg-white border border-[#E7E2D6] px-2 py-0.5 rounded-full uppercase">
                          {d.required ? 'Required' : 'Optional'}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#64748B] mt-1">{d.desc}</p>
                  </div>

                  <div className="pt-2 border-t border-[#F0EFE9] flex items-center justify-between gap-2">
                    {existingDoc ? (
                      <div className="flex items-center gap-2">
                        <a
                          href={existingDoc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#C9A227] hover:underline"
                        >
                          <ExternalLink size={13} />
                          <span>View Document</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDeleteDoc(existingDoc._id)}
                          className="p-1 text-neutral-400 hover:text-red-600 rounded"
                          title="Remove document"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-[#0F172A] border border-[#D6D6D6] hover:border-black cursor-pointer shadow-2xs">
                        {isUploadingThis ? (
                          <>
                            <Loader2 size={13} className="animate-spin text-[#C9A227]" />
                            <span>Uploading…</span>
                          </>
                        ) : (
                          <>
                            <Upload size={13} />
                            <span>Upload File</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept=".pdf,image/png,image/jpeg"
                          disabled={Boolean(uploadingDoc)}
                          onChange={(e) => handleDocUpload(e, d.key)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 5: Delivery Charges (Feature 11) */}
      {activeTab === 'delivery' && (
        <div className="bg-white rounded-3xl border border-[#E7E2D6] p-6 shadow-xs space-y-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#0F172A]">
              Delivery & Order Fulfillment Settings (Feature 11)
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Configure your store&apos;s shipping charges, free shipping threshold, and minimum order requirement.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">
                Standard Delivery Charge (₹)
              </label>
              <input
                type="number"
                min="0"
                value={profile.deliveryCharge ?? 49}
                onChange={(e) => updateProfileField('deliveryCharge', e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#D6D6D6] outline-none focus:border-black font-bold"
              />
              <p className="text-[10px] text-[#64748B] mt-1">₹0 = Free delivery on all orders.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">
                Free Delivery Above (₹)
              </label>
              <input
                type="number"
                min="0"
                value={profile.freeDeliveryThreshold ?? 499}
                onChange={(e) => updateProfileField('freeDeliveryThreshold', e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#D6D6D6] outline-none focus:border-black font-bold"
              />
              <p className="text-[10px] text-[#64748B] mt-1">Orders above this threshold get free shipping.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">
                Minimum Order Value (₹)
              </label>
              <input
                type="number"
                min="0"
                value={profile.minOrderValue ?? 0}
                onChange={(e) => updateProfileField('minOrderValue', e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#D6D6D6] outline-none focus:border-black font-bold"
              />
              <p className="text-[10px] text-[#64748B] mt-1">Cart value required to place an order.</p>
            </div>
          </div>
        </div>
      )}

      {/* Save Button Bar */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E7E2D6]">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || Object.keys(validationErrors).length > 0}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold bg-[#0F172A] text-white hover:bg-neutral-800 shadow-sm transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 size={15} className="animate-spin text-[#C9A227]" /> : <Save size={15} />}
          <span>{saving ? 'Saving Profile…' : 'Save Profile Changes'}</span>
        </button>
      </div>
    </div>
  );
}
