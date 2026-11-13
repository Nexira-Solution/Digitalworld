import mongoose from 'mongoose';

const SellerApprovalHistorySchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
      index: true,
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: ['approved', 'rejected', 'suspended', 'reinstated', 'profile_verified', 'profile_rejected'],
    },
    previousStatus: { type: String, default: '' },
    newStatus: { type: String, default: '' },
    reason: { type: String, default: '' },
  },
  { timestamps: true }
);

SellerApprovalHistorySchema.index({ seller: 1, createdAt: -1 });

export default mongoose.models.SellerApprovalHistory ||
  mongoose.model('SellerApprovalHistory', SellerApprovalHistorySchema);

