import mongoose from 'mongoose';

const AddonSelectionSchema = new mongoose.Schema(
  {
    optionId: { type: mongoose.Schema.Types.ObjectId, default: null },
    name: { type: String, default: '' },
    image: { type: String, default: '' },
    price: { type: Number, default: 0 },
    sku: { type: String, default: '' }
  },
  { _id: false }
);

const OrderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    comboId: { type: mongoose.Schema.Types.ObjectId, ref: 'Combo', default: null },

    // Snapshot of which seller owned the product at order time — used to
    // route this line item into that seller's order dashboard, and to
    // check ownership before a seller is allowed to update order status.
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },

    name: String,
    sku: { type: String, default: '' },
    image: String,
    color: String,
    size: String,
    sleeveType: { type: String, default: '' },
    zipType: { type: String, default: '' },
    pantOption: { type: AddonSelectionSchema, default: null },
    shawlOption: { type: AddonSelectionSchema, default: null },
    price: Number,
    qty: Number
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    items: [OrderItemSchema],
    customer: {
      name: String,
      phone: String,
      email: String
    },
    shippingAddress: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
      landmark: String
    },
    subtotal: Number,
    discount: { type: Number, default: 0 },
    couponCode: { type: String, default: '' },
    couponDiscount: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    total: Number,
    paymentMethod: { type: String, enum: ['razorpay', 'cod'], default: 'razorpay' },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    razorpayOrderId: { type: String, unique: true, sparse: true },
    razorpayPaymentId: String,
    status: {
      type: String,
      enum: [
        'placed',
        'confirmed',
        'processing',
        'packed',
        'shipped',
        'out_for_delivery',
        'delivered',
        'cancelled',
        'return_requested',
        'returned',
        'refund_initiated',
        'refunded',
      ],
      default: 'placed',
    },
    estimatedDelivery: {
      minDays: { type: Number, default: 5 },
      maxDays: { type: Number, default: 6 },
      formattedRange: { type: String, default: '5 - 6 Days' },
    },
    trackingEvents: [
      {
        _id: false,
        status: { type: String, required: true },
        title: { type: String, required: true },
        description: { type: String, default: '' },
        location: { type: String, default: '' },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    courier: {
      partner: { type: String, default: '' },
      trackingId: { type: String, default: '' },
      awbNumber: { type: String, default: '' },
    },
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

OrderSchema.index({ 'items.seller': 1 });

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);