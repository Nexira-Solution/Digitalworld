import mongoose from 'mongoose';

const AddonSelectionSchema = new mongoose.Schema(
  {
    optionId: { type: mongoose.Schema.Types.ObjectId, default: null },
    name: { type: String, default: '' },
    image: { type: String, default: '' },
    price: { type: Number, default: 0 },
    sku: { type: String, default: '' },
  },
  { _id: false }
);

const OrderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    comboId: { type: mongoose.Schema.Types.ObjectId, ref: 'Combo', default: null },
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
    qty: Number,
  },
  { _id: false }
);

const StatusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
    updaterRole: { type: String, default: 'admin' },
    notes: { type: String, default: '' },
  },
  { _id: false }
);

const DeliveryBreakdownSchema = new mongoose.Schema(
  {
    sellerId: { type: mongoose.Schema.Types.ObjectId, default: null },
    sellerName: { type: String, default: '' },
    deliveryFee: { type: Number, default: 0 },
    isFreeDelivery: { type: Boolean, default: false },
    subtotal: { type: Number, default: 0 },
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
      email: String,
    },
    shippingAddress: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
      landmark: String,
    },
    subtotal: Number,
    discount: { type: Number, default: 0 },
    couponCode: { type: String, default: '' },
    couponDiscount: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    deliveryBreakdown: [DeliveryBreakdownSchema],
    taxAmount: { type: Number, default: 0 },
    total: Number,
    paymentMethod: { type: String, enum: ['razorpay', 'cod', 'online'], default: 'razorpay' },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    razorpayOrderId: { type: String, unique: true, sparse: true },
    razorpayPaymentId: String,
    status: {
      type: String,
      enum: [
        'pending',
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
      default: 'confirmed',
    },
    statusHistory: [StatusHistorySchema],
    estimatedDelivery: {
      minDays: { type: Number, default: 3 },
      maxDays: { type: Number, default: 5 },
      formattedRange: { type: String, default: '3 - 5 Days' },
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
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

OrderSchema.index({ 'items.seller': 1 });
OrderSchema.index({ createdAt: -1 });

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
