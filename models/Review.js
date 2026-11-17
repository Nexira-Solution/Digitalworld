import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null, index: true },
    orderItemId: { type: String, default: '' },
    customerName: { type: String, required: true },
    customerEmail: { type: String, default: '' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, default: '' }, // Review Title
    comment: { type: String, default: '' }, // Detailed Feedback
    images: [{ type: String }], // Up to 5 product photos
    recommends: { type: Boolean, default: true }, // Recommendation Status (Yes/No)
    isVerifiedPurchase: { type: Boolean, default: true }, // Verified from delivered orders
    reviewStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    isApproved: { type: Boolean, default: false },
    rejectionReason: { type: String, default: '' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
    reviewedAt: { type: Date, default: null },
    isFeatured: { type: Boolean, default: false },
    verifiedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

ReviewSchema.index({ product: 1, order: 1 });
ReviewSchema.index({ product: 1, customerEmail: 1 });
ReviewSchema.index({ seller: 1, rating: 1 });
ReviewSchema.index({ isApproved: 1, createdAt: -1 });

export const Review = mongoose.models.Review || mongoose.model('Review', ReviewSchema);
export const ProductReview = Review;
export default Review;
