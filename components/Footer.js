import Link from 'next/link';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Linkedin,
  ShieldCheck,
  CreditCard,
  Truck,
  RotateCcw,
  Headphones,
} from 'lucide-react';
import { dbConnect } from '@/lib/mongodb';
import Settings from '@/models/Settings';
import Category from '@/models/Category';

const GOLD = '#C9A227';
const PAPER = '#FFFFFF';
const INK = '#000000';
const INK_MUTED = '#6B6B6B';
const BORDER = '#E7E2D6';

async function getFooterData() {
  try {
    await dbConnect();
    let settings = await Settings.findOne({ key: 'global' }).lean();
    if (!settings) {
      settings = {
        storeName: 'Digital World',
        aboutUs:
          'India’s premier verified multi-vendor marketplace offering authentic electronics, apparel, regional gourmet sweets, snacks, and daily essentials direct from certified suppliers.',
        address: '123 Commerce Avenue, Cyber City, Chennai, Tamil Nadu, 600001',
        phone: '+91 98765 43210',
        email: 'support@digitalworld.com',
        whatsapp: '+91 98765 43210',
        workingHours: 'Mon - Sat: 9:00 AM - 8:00 PM IST',
        instagram: 'https://instagram.com/digitalworld',
        facebook: 'https://facebook.com/digitalworld',
        twitter: 'https://twitter.com/digitalworld',
        youtube: 'https://youtube.com/digitalworld',
        linkedin: 'https://linkedin.com/company/digitalworld',
        copyrightText: '© {year} Digital World Multi-Vendor Platform. All rights reserved.',
      };
    }

    const categories = await Category.find({ isActive: true, parent: null })
      .select('name slug')
      .sort({ order: 1, name: 1 })
      .limit(6)
      .lean();

    return { settings, categories: JSON.parse(JSON.stringify(categories)) };
  } catch (err) {
    console.warn('[Footer getFooterData warning]:', err.message);
    return {
      settings: {
        storeName: 'Digital World',
        aboutUs:
          'India’s premier verified multi-vendor marketplace offering authentic electronics, apparel, regional gourmet sweets, snacks, and daily essentials direct from certified suppliers.',
        address: '123 Commerce Avenue, Cyber City, Chennai, Tamil Nadu, 600001',
        phone: '+91 98765 43210',
        email: 'support@digitalworld.com',
        whatsapp: '+91 98765 43210',
        workingHours: 'Mon - Sat: 9:00 AM - 8:00 PM IST',
        instagram: 'https://instagram.com/digitalworld',
        facebook: 'https://facebook.com/digitalworld',
        twitter: 'https://twitter.com/digitalworld',
        youtube: 'https://youtube.com/digitalworld',
        linkedin: 'https://linkedin.com/company/digitalworld',
        copyrightText: '© {year} Digital World Multi-Vendor Platform. All rights reserved.',
      },
      categories: [],
    };
  }
}

export default async function Footer() {
  const { settings, categories } = await getFooterData();

  const currentYear = new Date().getFullYear();
  const copyright = (
    settings.copyrightText || '© {year} Digital World Multi-Vendor Platform. All rights reserved.'
  ).replace('{year}', String(currentYear));

  const visibility = settings.sectionVisibility || {
    companyInfo: true,
    quickLinks: true,
    categories: true,
    policies: true,
    socialLinks: true,
    paymentIcons: true,
  };

  const quickLinks =
    settings.quickLinks && settings.quickLinks.length > 0
      ? settings.quickLinks
      : [
          { label: 'All Products', url: '/products' },
          { label: 'New Arrivals', url: '/products?sort=newest' },
          { label: 'Best Sellers', url: '/products?sort=bestselling' },
          { label: 'Combo Deals', url: '/combos' },
          { label: 'Become a Seller', url: '/seller/register' },
        ];

  const customerServiceLinks =
    settings.customerServiceLinks && settings.customerServiceLinks.length > 0
      ? settings.customerServiceLinks
      : [
          { label: 'Track Order', url: '/track' },
          { label: 'Help & Contact', url: '/contact' },
          { label: 'Shipping Policy', url: '/shipping-policy' },
          { label: 'Returns & Refunds', url: '/returns' },
          { label: 'Frequently Asked Questions', url: '/faq' },
        ];

  const policyLinks =
    settings.policyLinks && settings.policyLinks.length > 0
      ? settings.policyLinks
      : [
          { label: 'Privacy Policy', url: '/privacy' },
          { label: 'Terms of Service', url: '/terms' },
          { label: 'Supplier Code of Conduct', url: '/seller-policy' },
          { label: 'Quality & Authenticity', url: '/security' },
        ];

  return (
    <footer
      className="mt-20 border-t border-[#E7E2D6] bg-white font-sans text-xs text-[#5E5E5E]"
      style={{ fontFamily: 'var(--font-outfit), sans-serif' }}
    >
      {/* Service Highlights Strip */}
      <div className="border-b border-[#F0F0F0] bg-[#FAF7F0] py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="flex items-center justify-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#C9A227] shadow-xs shrink-0">
              <Truck size={18} />
            </div>
            <div className="text-left">
              <p className="font-bold text-[#000000] text-xs">Direct Dispatch</p>
              <p className="text-[11px] text-[#6B6B6B]">Fast delivery from verified suppliers</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#C9A227] shadow-xs shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div className="text-left">
              <p className="font-bold text-[#000000] text-xs">100% Certified</p>
              <p className="text-[11px] text-[#6B6B6B]">GST, PAN & FSSAI verified sellers</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#C9A227] shadow-xs shrink-0">
              <RotateCcw size={18} />
            </div>
            <div className="text-left">
              <p className="font-bold text-[#000000] text-xs">Easy Returns</p>
              <p className="text-[11px] text-[#6B6B6B]">Transparent return & refund policy</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#C9A227] shadow-xs shrink-0">
              <Headphones size={18} />
            </div>
            <div className="text-left">
              <p className="font-bold text-[#000000] text-xs">Dedicated Support</p>
              <p className="text-[11px] text-[#6B6B6B]">Prompt resolution via email & chat</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Information */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          {/* Company Column (4 Cols) */}
          {visibility.companyInfo !== false && (
            <div className="lg:col-span-4 space-y-4">
              <div>
                <h3 className="text-xl font-bold text-[#000000] tracking-tight">
                  {settings.storeName || 'Digital World'}
                </h3>
                <div className="w-10 h-0.5 bg-[#C9A227] mt-1.5" />
              </div>

              <p className="text-xs leading-relaxed text-[#5E5E5E]">
                {settings.aboutUs}
              </p>

              <div className="space-y-2 pt-2 text-xs">
                {settings.address && (
                  <p className="flex items-start gap-2 text-[#5E5E5E]">
                    <MapPin size={14} className="text-[#C9A227] shrink-0 mt-0.5" />
                    <span>{settings.address}</span>
                  </p>
                )}

                {settings.phone && (
                  <p className="flex items-center gap-2">
                    <Phone size={14} className="text-[#C9A227] shrink-0" />
                    <a
                      href={`tel:${settings.phone.replace(/\s+/g, '')}`}
                      className="text-[#000000] hover:text-[#C9A227] font-medium transition-colors"
                    >
                      {settings.phone}
                    </a>
                  </p>
                )}

                {settings.email && (
                  <p className="flex items-center gap-2">
                    <Mail size={14} className="text-[#C9A227] shrink-0" />
                    <a
                      href={`mailto:${settings.email}`}
                      className="text-[#000000] hover:text-[#C9A227] font-medium transition-colors break-all"
                    >
                      {settings.email}
                    </a>
                  </p>
                )}

                {settings.workingHours && (
                  <p className="flex items-center gap-2 text-[#6B6B6B]">
                    <Clock size={14} className="text-[#C9A227] shrink-0" />
                    <span>{settings.workingHours}</span>
                  </p>
                )}
              </div>

              {/* Social Media Links */}
              {visibility.socialLinks !== false && (
                <div className="pt-2">
                  <p className="text-[11px] font-bold text-[#000000] uppercase tracking-wider mb-2.5">
                    Connect With Us
                  </p>
                  <div className="flex items-center gap-2.5">
                    {settings.instagram && (
                      <a
                        href={settings.instagram}
                        target="_blank"
                        rel="noreferrer"
                        className="w-8 h-8 rounded-full bg-[#FAF7F0] border border-[#E7E2D6] flex items-center justify-center text-[#000000] hover:bg-[#C9A227] hover:text-white hover:border-[#C9A227] transition-all"
                        aria-label="Instagram"
                      >
                        <Instagram size={15} />
                      </a>
                    )}
                    {settings.facebook && (
                      <a
                        href={settings.facebook}
                        target="_blank"
                        rel="noreferrer"
                        className="w-8 h-8 rounded-full bg-[#FAF7F0] border border-[#E7E2D6] flex items-center justify-center text-[#000000] hover:bg-[#C9A227] hover:text-white hover:border-[#C9A227] transition-all"
                        aria-label="Facebook"
                      >
                        <Facebook size={15} />
                      </a>
                    )}
                    {settings.twitter && (
                      <a
                        href={settings.twitter}
                        target="_blank"
                        rel="noreferrer"
                        className="w-8 h-8 rounded-full bg-[#FAF7F0] border border-[#E7E2D6] flex items-center justify-center text-[#000000] hover:bg-[#C9A227] hover:text-white hover:border-[#C9A227] transition-all"
                        aria-label="Twitter / X"
                      >
                        <Twitter size={15} />
                      </a>
                    )}
                    {settings.youtube && (
                      <a
                        href={settings.youtube}
                        target="_blank"
                        rel="noreferrer"
                        className="w-8 h-8 rounded-full bg-[#FAF7F0] border border-[#E7E2D6] flex items-center justify-center text-[#000000] hover:bg-[#C9A227] hover:text-white hover:border-[#C9A227] transition-all"
                        aria-label="YouTube"
                      >
                        <Youtube size={15} />
                      </a>
                    )}
                    {settings.linkedin && (
                      <a
                        href={settings.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        className="w-8 h-8 rounded-full bg-[#FAF7F0] border border-[#E7E2D6] flex items-center justify-center text-[#000000] hover:bg-[#C9A227] hover:text-white hover:border-[#C9A227] transition-all"
                        aria-label="LinkedIn"
                      >
                        <Linkedin size={15} />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Links Column (2 Cols) */}
          {visibility.quickLinks !== false && (
            <div className="lg:col-span-2 space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#000000]">
                Quick Links
              </h4>
              <ul className="space-y-2">
                {quickLinks.map((link, idx) => (
                  <li key={idx}>
                    <Link
                      href={link.url || '#'}
                      className="text-xs text-[#5E5E5E] hover:text-[#C9A227] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Categories Column (2 Cols) */}
          {visibility.categories !== false && (
            <div className="lg:col-span-2 space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#000000]">
                Categories
              </h4>
              <ul className="space-y-2">
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <li key={cat.slug}>
                      <Link
                        href={`/category/${cat.slug}`}
                        className="text-xs text-[#5E5E5E] hover:text-[#C9A227] transition-colors"
                      >
                        {cat.name}
                      </Link>
                    </li>
                  ))
                ) : (
                  <>
                    <li>
                      <Link href="/products" className="text-xs text-[#5E5E5E] hover:text-[#C9A227]">
                        Clothing
                      </Link>
                    </li>
                    <li>
                      <Link href="/products" className="text-xs text-[#5E5E5E] hover:text-[#C9A227]">
                        Electronics
                      </Link>
                    </li>
                    <li>
                      <Link href="/products" className="text-xs text-[#5E5E5E] hover:text-[#C9A227]">
                        Snacks & Sweets
                      </Link>
                    </li>
                    <li>
                      <Link href="/products" className="text-xs text-[#5E5E5E] hover:text-[#C9A227]">
                        Groceries
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </div>
          )}

          {/* Customer Service Column (2 Cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#000000]">
              Customer Care
            </h4>
            <ul className="space-y-2">
              {customerServiceLinks.map((link, idx) => (
                <li key={idx}>
                  <Link
                    href={link.url || '#'}
                    className="text-xs text-[#5E5E5E] hover:text-[#C9A227] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policy Links Column (2 Cols) */}
          {visibility.policies !== false && (
            <div className="lg:col-span-2 space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#000000]">
                Policies & Legal
              </h4>
              <ul className="space-y-2">
                {policyLinks.map((link, idx) => (
                  <li key={idx}>
                    <Link
                      href={link.url || '#'}
                      className="text-xs text-[#5E5E5E] hover:text-[#C9A227] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Bar: Copyright, Payment Badges & Nexira Solution Credit */}
      <div className="border-t border-[#F0F0F0] bg-[#FAFAFA] py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-[#6B6B6B] text-center md:text-left">
            {copyright}
          </p>

          {/* Payment Method Badges */}
          {visibility.paymentIcons !== false && (
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <span className="text-[10px] uppercase font-bold text-[#8A8A8A] tracking-wider mr-1">
                100% Safe Payments:
              </span>
              <span className="px-2.5 py-1 rounded bg-white border border-[#D6D6D6] text-[10px] font-bold text-[#000000] shadow-2xs">
                UPI
              </span>
              <span className="px-2.5 py-1 rounded bg-white border border-[#D6D6D6] text-[10px] font-bold text-[#000000] shadow-2xs">
                Visa
              </span>
              <span className="px-2.5 py-1 rounded bg-white border border-[#D6D6D6] text-[10px] font-bold text-[#000000] shadow-2xs">
                Mastercard
              </span>
              <span className="px-2.5 py-1 rounded bg-white border border-[#D6D6D6] text-[10px] font-bold text-[#000000] shadow-2xs">
                RuPay
              </span>
              <span className="px-2.5 py-1 rounded bg-white border border-[#D6D6D6] text-[10px] font-bold text-[#000000] shadow-2xs">
                NetBanking
              </span>
            </div>
          )}

          {/* Requirement 07: Nexira Solution Developer Credit */}
          <p className="text-[11px] text-[#767676] text-center md:text-right font-medium tracking-tight">
            Design and Developed by{' '}
            <span className="font-semibold text-[#000000]">Nexira Solution</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
