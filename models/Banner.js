import mongoose from 'mongoose';

const BannerSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    description: { type: String, default: '' },
    image: { type: String, required: true }, // Desktop banner image
    mobileImage: { type: String, default: '' }, // Mobile responsive banner image
    link: { type: String, default: '' }, // CTA Target URL
    buttonText: { type: String, default: 'Shop Now' }, // CTA Button Text
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },

    // Date scheduling (Feature 4)
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },

    // Banner classification: 'homepage' = Admin homepage hero only; 'storefront' = Seller storefront only
    bannerType: {
      type: String,
      enum: ['homepage', 'storefront'],
      default: 'homepage',
      index: true,
    },

    // Who owns it. null = created by superadmin (homepage banner).
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null, index: true },

    // Approval status for seller banners (Feature 3)
    approval: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved',
      index: true,
    },
    rejectionReason: { type: String, default: '' },
    reviewedAt: { type: Date, default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
  },
  { timestamps: true }
);

BannerSchema.index({ bannerType: 1, isActive: 1, approval: 1, seller: 1 });
BannerSchema.index({ seller: 1, isActive: 1, approval: 1 });

export default mongoose.models.Banner || mongoose.model('Banner', BannerSchema);
