import mongoose from 'mongoose';

const AddressSchema = new mongoose.Schema(
  {
    doorNo: { type: String, default: '', trim: true },
    street: { type: String, default: '', trim: true },
    city: { type: String, default: '', trim: true },
    state: { type: String, default: '', trim: true },
    pincode: { type: String, default: '', trim: true },
    country: { type: String, default: 'India', trim: true },
    contactPhone: { type: String, default: '', trim: true },
    sameAsPickup: { type: Boolean, default: true },
  },
  { _id: false }
);

const BankDetailsSchema = new mongoose.Schema(
  {
    accountHolderName: { type: String, default: '', trim: true },
    bankName: { type: String, default: '', trim: true },
    accountNumber: { type: String, default: '', trim: true },
    ifscCode: { type: String, default: '', trim: true, uppercase: true },
    accountType: { type: String, enum: ['Current', 'Savings'], default: 'Current' },
  },
  { _id: false }
);

const DocumentsSchema = new mongoose.Schema(
  {
    panCard: { type: String, default: '' },
    gstCertificate: { type: String, default: '' },
    cancelledCheque: { type: String, default: '' },
    fssaiCertificate: { type: String, default: '' },
    addressProof: { type: String, default: '' },
  },
  { _id: false }
);

const SellerBusinessProfileSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
      unique: true,
      index: true,
    },
    description: { type: String, default: '', trim: true },
    category: { type: String, default: '', trim: true },
    logo: { type: String, default: '', trim: true },
    banner: { type: String, default: '', trim: true },
    yearOfEstablishment: { type: Number, default: 2020 },
    productCategories: [{ type: String, trim: true }],

    // Validations & Tax identifiers (Feature 8)
    panNumber: { type: String, default: '', trim: true, uppercase: true },
    fssaiNumber: { type: String, default: '', trim: true },
    documents: { type: DocumentsSchema, default: () => ({}) },

    // Delivery charge settings per seller (Feature 11)
    deliveryCharge: { type: Number, default: 49 },
    freeDeliveryThreshold: { type: Number, default: 499 },
    minOrderValue: { type: Number, default: 0 },

    // Performance statistics
    responseTime: { type: String, default: 'Within 2 Hours' },
    onTimeDispatchRate: { type: Number, default: 98 },
    reorderRate: { type: Number, default: 24 },
    rating: { type: Number, default: 4.8 },
    reviewCount: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    totalProducts: { type: Number, default: 0 },

    pickupAddress: { type: AddressSchema, default: () => ({}) },
    returnAddress: { type: AddressSchema, default: () => ({}) },
    bankDetails: { type: BankDetailsSchema, default: () => ({}) },
    website: { type: String, default: '', trim: true },
    socialLinks: {
      instagram: { type: String, default: '', trim: true },
      whatsapp: { type: String, default: '', trim: true },
      facebook: { type: String, default: '', trim: true },
    },
    completionPercentage: { type: Number, default: 0 },
    submittedForVerification: { type: Boolean, default: false },
    submittedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.SellerBusinessProfile ||
  mongoose.model('SellerBusinessProfile', SellerBusinessProfileSchema);
