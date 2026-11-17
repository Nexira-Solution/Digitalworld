import mongoose from 'mongoose';

const VariantSizeSchema = new mongoose.Schema(
  {
    size: { type: String, required: true },
    stock: { type: Number, default: 0 },
    sku: { type: String, default: '' },
    barcode: { type: String, default: '' },
    price: { type: Number },
    compareAtPrice: { type: Number },
    discountPercentage: { type: Number, default: 0 },
    // Category-specific dimensions
    ram: { type: String, default: '' },
    storage: { type: String, default: '' },
    warranty: { type: String, default: '' },
    ukSize: { type: String, default: '' },
    euSize: { type: String, default: '' },
  },
  { _id: true }
);

const VariantSchema = new mongoose.Schema(
  {
    color: { type: String, default: '' },
    colorHex: { type: String, default: '#000000' },
    images: [{ type: String }],
    price: { type: Number, required: true },
    compareAtPrice: { type: Number, default: 0 },
    discountPercentage: { type: Number, default: 0 },
    // Category-specific variant attributes
    model: { type: String, default: '' },
    ram: { type: String, default: '' },
    storage: { type: String, default: '' },
    warranty: { type: String, default: '' },
    style: { type: String, default: '' },
    fabric: { type: String, default: '' },
    material: { type: String, default: '' },
    ukSize: { type: String, default: '' },
    euSize: { type: String, default: '' },
    sku: { type: String, default: '' },
    barcode: { type: String, default: '' },
    stock: { type: Number, default: 0 },
    // Holds sizes for apparel, pack sizes for food, configurations for electronics.
    sizes: [VariantSizeSchema],
  },
  { _id: true }
);

const AddonOptionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    image: { type: String, default: '' },
    price: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    sku: { type: String, default: '' },
  },
  { _id: true }
);

const ProductSchema = new mongoose.Schema(
  {
    // Requirement 05: Category-based unique Product ID (e.g. ELE-00001, SNK-00001)
    productId: { type: String, unique: true, sparse: true, trim: true, index: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    sku: { type: String, required: true, unique: true, trim: true, uppercase: true },
    description: { type: String, default: '' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    subcategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    barcode: { type: String, default: '', trim: true },

    // Category product type
    productType: {
      type: String,
      enum: ['apparel', 'electronics', 'food', 'general', 'clothing', 'snacks', 'sweets', 'groceries', 'vegetables', 'fruits', 'footwear', 'other'],
      default: 'general',
      index: true,
    },
    // Type-specific fields (brand, warrantyMonths, fssaiLicense, etc.)
    attributes: { type: mongoose.Schema.Types.Mixed, default: {} },
    // Spec table, e.g. [{ key: 'Battery', value: '5000 mAh' }]
    specs: [{ _id: false, key: String, value: String }],

    // Which seller (Admin doc, role: 'seller') owns this product; null = superadmin.
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },

    fabric: { type: String, default: '' },
    tags: [{ type: String }],
    images: [{ type: String }],
    offers: [{ type: String }],
    trustBadges: [
      {
        _id: false,
        title: { type: String, required: true },
        subtitle: { type: String, default: '' },
        icon: { type: String, default: 'Leaf' },
      },
    ],
    deliveryInfo: {
      estimatedDays: { type: Number, default: 2 },
      dispatchDays: { type: String, default: '1-2 Days' },
      freeDeliveryAbove: { type: Number },
    },
    variants: [VariantSchema],
    sizeChart: [{ type: String }],
    sleeveOptions: [{ type: String, enum: ['Full Sleeve', 'Half Sleeve', 'Elbow Sleeve', 'Sleeveless'] }],
    zipOptions: [{ type: String, enum: ['With Zip', 'Without Zip'] }],
    pantOptions: [AddonOptionSchema],
    shawlOptions: [AddonOptionSchema],
    isReadyToShip: { type: Boolean, default: false },
    basePrice: { type: Number, required: true },
    discountPercentage: { type: Number, default: 0 },
    // Calculated total stock across all variants
    totalStock: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    isBestSeller: { type: Boolean, default: false },
    isTopSeller: { type: Boolean, default: false },
    isActiveSeller: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    soldCount: { type: Number, default: 0 },
    seoTitle: String,
    seoDescription: String,
  },
  { timestamps: true }
);

// High-performance query indexes (Requirement 11)
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });
ProductSchema.index({ seller: 1 });
ProductSchema.index({ slug: 1 }, { unique: true });
ProductSchema.index({ category: 1 });
ProductSchema.index({ subcategory: 1 });
ProductSchema.index({ isBestSeller: 1 });
ProductSchema.index({ isActive: 1 });
ProductSchema.index({ isActive: 1, category: 1, createdAt: -1 });
ProductSchema.index({ isActive: 1, basePrice: 1 });
ProductSchema.index({ isActive: 1, rating: -1 });
ProductSchema.index({ isActive: 1, soldCount: -1 });
ProductSchema.index({ productId: 1 }, { unique: true, sparse: true });

if (process.env.NODE_ENV !== 'production' && mongoose.models.Product) {
  delete mongoose.models.Product;
}

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
