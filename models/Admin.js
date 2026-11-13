import mongoose from 'mongoose';

const AdminSchema = new mongoose.Schema(
  {
    name: { type: String, default: 'Seller' },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['seller', 'superadmin'],
      default: 'seller',
    },
    // Only meaningful for role: 'seller'. Superadmins are always 'approved'.
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended'],
      default: 'pending',
    },
    businessName: { type: String, default: '', trim: true },
    sellerSlug: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    businessPhone: { type: String, default: '', trim: true },
    whatsappNumber: { type: String, default: '', trim: true },
    businessAddress: { type: String, default: '', trim: true },
    shopAddress: { type: String, default: '', trim: true },
    gstNumber: { type: String, default: '', trim: true, uppercase: true },
    rejectionReason: { type: String, default: '' },
    suspensionReason: { type: String, default: '' },
    approvedAt: { type: Date, default: null },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
    rejectedAt: { type: Date, default: null },
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
    suspendedAt: { type: Date, default: null },
    suspendedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },

    // Profile & verification tracking
    profileVerificationStatus: {
      type: String,
      enum: ['not_submitted', 'in_review', 'verified', 'rejected'],
      default: 'not_submitted',
    },
    verificationRemarks: { type: String, default: '' },
    verifiedAt: { type: Date, default: null },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
    profileCompletion: { type: Number, default: 0 }, // 0 to 100%
  },
  { timestamps: true }
);

AdminSchema.index({ email: 1 }, { unique: true });
AdminSchema.index({ role: 1, status: 1 });

export default mongoose.models.Admin || mongoose.model('Admin', AdminSchema);
