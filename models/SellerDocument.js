import mongoose from 'mongoose';

const SellerDocumentSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
      index: true,
    },
    documentType: {
      type: String,
      required: true,
      enum: [
        'gst_certificate',
        'pan_card',
        'shop_license',
        'business_registration',
        'bank_proof',
        'address_proof',
        'fssai_license',
        'other',
      ],
    },
    documentName: { type: String, required: true, trim: true },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileSize: { type: Number, default: 0 },
    mimeType: { type: String, default: '' },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
      index: true,
    },
    remarks: { type: String, default: '' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

SellerDocumentSchema.index({ seller: 1, documentType: 1 });

export default mongoose.models.SellerDocument ||
  mongoose.model('SellerDocument', SellerDocumentSchema);

