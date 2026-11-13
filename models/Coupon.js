import mongoose from 'mongoose';

const CouponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, default: '' },
    discountType: { type: String, enum: ['percentage', 'fixed', 'percent', 'flat'], default: 'percentage' },
    discountValue: { type: Number, required: true },
    minimumOrderValue: { type: Number, default: 0 },
    maximumDiscount: { type: Number, default: 0 },
    startDate: { type: Date, default: Date.now },
    expiryDate: { type: Date, default: null },
    usageLimit: { type: Number, default: 0 }, // 0 = unlimited
    usedCount: { type: Number, default: 0 },
    perCustomerLimit: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true },
    applicableProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],

    // Legacy field aliases for backward compatibility
    type: { type: String },
    value: { type: Number },
    minOrderValue: { type: Number },
    maxDiscount: { type: Number },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

// Pre-save hook to synchronize legacy fields
CouponSchema.pre('save', function (next) {
  if (this.discountType === 'percent' || this.discountType === 'percentage') {
    this.discountType = 'percentage';
    this.type = 'percent';
  } else if (this.discountType === 'flat' || this.discountType === 'fixed') {
    this.discountType = 'fixed';
    this.type = 'flat';
  }
  if (this.discountValue !== undefined) this.value = this.discountValue;
  if (this.value !== undefined && this.discountValue === undefined) this.discountValue = this.value;

  if (this.minimumOrderValue !== undefined) this.minOrderValue = this.minimumOrderValue;
  if (this.minOrderValue !== undefined && this.minimumOrderValue === undefined) this.minimumOrderValue = this.minOrderValue;

  if (this.maximumDiscount !== undefined) this.maxDiscount = this.maximumDiscount;
  if (this.maxDiscount !== undefined && this.maximumDiscount === undefined) this.maximumDiscount = this.maxDiscount;

  if (this.expiryDate !== undefined) this.expiresAt = this.expiryDate;
  if (this.expiresAt !== undefined && this.expiryDate === undefined) this.expiryDate = this.expiresAt;

  next();
});

export default mongoose.models.Coupon || mongoose.model('Coupon', CouponSchema);
