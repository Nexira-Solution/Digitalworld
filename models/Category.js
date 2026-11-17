import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    image: { type: String, default: '' },
    description: { type: String, default: '' },

    // NEW: decides which fields the product forms show for products in this
    // category. Subcategories are kept equal to their parent by the API.
    // Existing categories default to 'apparel', so nothing changes for them.
    productType: {
      type: String,
      enum: ['apparel', 'electronics', 'food', 'general', 'clothing', 'snacks', 'sweets', 'groceries', 'vegetables', 'fruits', 'other'],
      default: 'general'
    },

    // Category-specific custom attributes configured by Admin
    customAttributes: [
      {
        _id: false,
        key: { type: String, required: true },
        label: { type: String, required: true },
        type: { type: String, enum: ['text', 'number', 'select', 'textarea'], default: 'text' },
        required: { type: Boolean, default: false },
        options: [{ type: String }],
      },
    ],

    // Size / option / pack-size choices used by the bulk uploader and filters,
    // e.g. S,M,L,XL for apparel or 250g,500g,1kg for snacks.
    sizes: [{ type: String }],

    // Fallback size chart images (apparel only in practice).
    sizeChart: [{ type: String }],

    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    seoTitle: String,
    seoDescription: String,
  },
  { timestamps: true }
);

CategorySchema.index({ slug: 1 }, { unique: true });
CategorySchema.index({ isActive: 1, parent: 1, sortOrder: 1 });

if (process.env.NODE_ENV !== 'production' && mongoose.models.Category) {
  delete mongoose.models.Category;
}

export default mongoose.models.Category || mongoose.model('Category', CategorySchema);