export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Settings from '@/models/Settings';
import Category from '@/models/Category';

export async function GET() {
  try {
    await dbConnect();
    let settings = await Settings.findOne({ key: 'global' }).lean();
    if (!settings) {
      settings = await Settings.create({ key: 'global' });
    }

    // Fetch active top-level categories
    const categories = await Category.find({ isActive: true, parent: null })
      .select('name slug')
      .sort({ order: 1, name: 1 })
      .limit(8)
      .lean();

    const currentYear = new Date().getFullYear();
    const copyright = (settings.copyrightText || '© {year} Digital World Multi-Vendor Platform. All rights reserved.')
      .replace('{year}', String(currentYear));

    // Default links if not configured
    const defaultQuickLinks = [
      { label: 'All Products', url: '/products' },
      { label: 'New Arrivals', url: '/products?sort=newest' },
      { label: 'Best Sellers', url: '/products?sort=bestselling' },
      { label: 'Featured Deals', url: '/combos' },
      { label: 'Become a Seller', url: '/seller/register' },
    ];

    const defaultCustomerServiceLinks = [
      { label: 'Help & Contact Us', url: '/contact' },
      { label: 'Track Order', url: '/track' },
      { label: 'Shipping Policy', url: '/shipping-policy' },
      { label: 'Returns & Refunds', url: '/returns' },
      { label: 'FAQs', url: '/faq' },
    ];

    const defaultPolicyLinks = [
      { label: 'Privacy Policy', url: '/privacy' },
      { label: 'Terms & Conditions', url: '/terms' },
      { label: 'Seller Terms', url: '/seller-policy' },
      { label: 'Security & Purity', url: '/security' },
    ];

    const defaultSocialLinks = {
      instagram: settings.instagram || 'https://instagram.com/digitalworld',
      facebook: settings.facebook || 'https://facebook.com/digitalworld',
      twitter: settings.twitter || 'https://twitter.com/digitalworld',
      youtube: settings.youtube || 'https://youtube.com/digitalworld',
      linkedin: settings.linkedin || 'https://linkedin.com/company/digitalworld',
      whatsapp: settings.whatsapp || '+91 98765 43210',
    };

    const paymentMethods = [
      { name: 'UPI', label: 'UPI / GPay / PhonePe', icon: 'upi' },
      { name: 'Visa', label: 'Visa Card', icon: 'visa' },
      { name: 'Mastercard', label: 'Mastercard', icon: 'mastercard' },
      { name: 'RuPay', label: 'RuPay Card', icon: 'rupay' },
      { name: 'NetBanking', label: 'Net Banking', icon: 'netbanking' },
    ];

    return NextResponse.json({
      success: true,
      footer: {
        company: {
          storeName: settings.storeName || 'Digital World',
          aboutUs: settings.aboutUs || 'India’s premier verified multi-vendor marketplace offering authentic electronics, apparel, regional gourmet sweets, snacks, and daily essentials direct from certified suppliers.',
          address: settings.address || '123 Commerce Avenue, Cyber City, Chennai, Tamil Nadu, 600001',
          email: settings.email || 'support@digitalworld.com',
          phone: settings.phone || '+91 98765 43210',
          whatsapp: settings.whatsapp || '+91 98765 43210',
          workingHours: settings.workingHours || 'Mon - Sat: 9:00 AM - 8:00 PM IST',
        },
        categories: categories || [],
        quickLinks: settings.quickLinks?.length > 0 ? settings.quickLinks : defaultQuickLinks,
        customerServiceLinks: settings.customerServiceLinks?.length > 0 ? settings.customerServiceLinks : defaultCustomerServiceLinks,
        policyLinks: settings.policyLinks?.length > 0 ? settings.policyLinks : defaultPolicyLinks,
        socialLinks: defaultSocialLinks,
        paymentMethods,
        sectionVisibility: {
          companyInfo: settings.sectionVisibility?.companyInfo ?? true,
          quickLinks: settings.sectionVisibility?.quickLinks ?? true,
          categories: settings.sectionVisibility?.categories ?? true,
          policies: settings.sectionVisibility?.policies ?? true,
          socialLinks: settings.sectionVisibility?.socialLinks ?? true,
          paymentIcons: settings.sectionVisibility?.paymentIcons ?? true,
        },
        copyrightText: copyright,
      },
    });
  } catch (err) {
    console.error('GET /api/settings/footer error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch footer settings',
      },
      { status: 500 }
    );
  }
}
