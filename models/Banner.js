import mongoose from 'mongoose';

const BannerSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    image: { type: String, required: true },
    mobileImage: { type: String, default: '' },
    link: { type: String, default: '' },
    buttonText: { type: String, default: 'Shop Now' },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },

    // Who owns it. null = created by superadmin.
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
    // Existing banners default to 'approved', so they keep showing.
    approval: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved',
    },
    rejectionReason: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.models.Banner || mongoose.model('Banner', BannerSchema);