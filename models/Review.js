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
    comment: { type: String, default: '' },
    images: [{ type: String }],
    isVerifiedPurchase: { type: Boolean, default: false }, // true when verified from delivered order
    reviewStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
    isApproved: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    verifiedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual aliases matching Feature 11 specifications
ReviewSchema.virtual('productId').get(function () {
  return this.product;
});
ReviewSchema.virtual('sellerId').get(function () {
  return this.seller;
});
ReviewSchema.virtual('orderId').get(function () {
  return this.order;
});
ReviewSchema.virtual('reviewText').get(function () {
  return this.comment;
});
ReviewSchema.virtual('reviewImages').get(function () {
  return this.images;
});

ReviewSchema.index({ product: 1, orderItemId: 1 });
ReviewSchema.index({ seller: 1, rating: 1 });

export const Review = mongoose.models.Review || mongoose.model('Review', ReviewSchema);
export const ProductReview = Review;
export default Review;
