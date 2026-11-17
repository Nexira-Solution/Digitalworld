import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    storeName: { type: String, default: 'Digital World' },
    logo: { type: String, default: '' },
    whatsapp: { type: String, default: '+91 98765 43210' },
    instagram: { type: String, default: 'https://instagram.com/digitalworld' },
    facebook: { type: String, default: 'https://facebook.com/digitalworld' },
    twitter: { type: String, default: 'https://twitter.com/digitalworld' },
    youtube: { type: String, default: 'https://youtube.com/digitalworld' },
    linkedin: { type: String, default: 'https://linkedin.com/company/digitalworld' },
    phone: { type: String, default: '+91 98765 43210' },
    email: { type: String, default: 'support@digitalworld.com' },
    address: { type: String, default: '123 Commerce Avenue, Cyber City, Chennai, Tamil Nadu, 600001' },
    workingHours: { type: String, default: 'Mon - Sat: 9:00 AM - 8:00 PM IST' },
    aboutUs: {
      type: String,
      default:
        'Digital World is India’s premier verified multi-vendor marketplace offering authentic electronics, apparel, regional gourmet sweets, snacks, and daily essentials direct from certified suppliers.',
    },
    copyrightText: { type: String, default: '© {year} Digital World Multi-Vendor Platform. All rights reserved.' },

    // Feature 11: Platform Delivery Charge Configuration
    deliveryCharge: { type: Number, default: 49 },
    freeDeliveryThreshold: { type: Number, default: 499 },
    minOrderValue: { type: Number, default: 0 },

    // Legacy shipping fallback fields
    shippingFee: { type: Number, default: 49 },
    defaultShippingCharge: { type: Number, default: 49 },
    freeShippingAbove: { type: Number, default: 499 },
    weightPerPiece: { type: Number, default: 0 },
    pricePerKg: { type: Number, default: 0 },

    // Feature 15: Footer Navigation Links
    quickLinks: [
      {
        label: { type: String, required: true },
        url: { type: String, required: true },
        sortOrder: { type: Number, default: 0 },
      },
    ],
    customerServiceLinks: [
      {
        label: { type: String, required: true },
        url: { type: String, required: true },
        sortOrder: { type: Number, default: 0 },
      },
    ],
    policyLinks: [
      {
        label: { type: String, required: true },
        url: { type: String, required: true },
        sortOrder: { type: Number, default: 0 },
      },
    ],
    sectionVisibility: {
      companyInfo: { type: Boolean, default: true },
      quickLinks: { type: Boolean, default: true },
      categories: { type: Boolean, default: true },
      policies: { type: Boolean, default: true },
      socialLinks: { type: Boolean, default: true },
      paymentIcons: { type: Boolean, default: true },
    },

    seoTitle: { type: String, default: 'Digital World — Multi-Vendor Marketplace' },
    seoDescription: {
      type: String,
      default: 'Premium multi-vendor e-commerce platform offering authentic products from certified suppliers.',
    },
  },
  { timestamps: true }
);

export default mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);
