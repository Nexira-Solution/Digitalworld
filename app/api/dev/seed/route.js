export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import mongoose from 'mongoose';
import Admin from '@/models/Admin';
import SellerBusinessProfile from '@/models/SellerBusinessProfile';
import Category from '@/models/Category';
import Product from '@/models/Product';
import Banner from '@/models/Banner';
import Combo from '@/models/Combo';
import Review from '@/models/Review';
import Order from '@/models/Order';
import Settings from '@/models/Settings';

export async function POST(req) {
  try {
    await dbConnect();

    // 1. Seed Global Settings
    await Settings.findOneAndUpdate(
      { key: 'global' },
      {
        key: 'global',
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
        deliveryCharge: 49,
        freeDeliveryThreshold: 499,
        minOrderValue: 0,
        quickLinks: [
          { label: 'All Products', url: '/products' },
          { label: 'New Arrivals', url: '/products?sort=newest' },
          { label: 'Best Sellers', url: '/products?sort=bestselling' },
          { label: 'Combo Deals', url: '/combos' },
          { label: 'Become a Seller', url: '/seller/register' },
        ],
        customerServiceLinks: [
          { label: 'Help & Contact Us', url: '/contact' },
          { label: 'Track Order', url: '/track' },
          { label: 'Shipping Policy', url: '/shipping-policy' },
          { label: 'Returns & Refunds', url: '/returns' },
          { label: 'FAQs', url: '/faq' },
        ],
        policyLinks: [
          { label: 'Privacy Policy', url: '/privacy' },
          { label: 'Terms & Conditions', url: '/terms' },
          { label: 'Seller Code of Conduct', url: '/seller-policy' },
          { label: 'Quality & Authenticity', url: '/security' },
        ],
        sectionVisibility: {
          companyInfo: true,
          quickLinks: true,
          categories: true,
          policies: true,
          socialLinks: true,
          paymentIcons: true,
        },
      },
      { upsert: true, new: true }
    );

    // 2. Seed Categories
    const categoryDefs = [
      {
        name: 'Clothing',
        slug: 'clothing',
        description: 'Men, women, and kids apparel, ethnic wear, and western fashion',
        order: 1,
        subcategories: ['Men', 'Women', 'Kids', 'Ethnic Wear', 'Western Wear', 'Footwear', 'Accessories'],
        customAttributes: ['brand', 'gender', 'fabric', 'size', 'availableSizes', 'color', 'pattern', 'fitType', 'washCare'],
      },
      {
        name: 'Electronics',
        slug: 'electronics',
        description: 'Mobiles, laptops, appliances, and high-performance tech gadgets',
        order: 2,
        subcategories: ['Mobiles', 'Laptops', 'Tablets', 'Televisions', 'Headphones', 'Smart Watches', 'Cameras', 'Computer Accessories', 'Home Appliances'],
        customAttributes: ['brand', 'model', 'warranty', 'condition', 'color', 'specs', 'powerRequirements', 'countryOfOrigin'],
      },
      {
        name: 'Snacks',
        slug: 'snacks',
        description: 'Authentic gourmet chips, traditional namkeen, nuts, and healthy savories',
        order: 3,
        subcategories: ['Chips', 'Namkeen', 'Biscuits', 'Cookies', 'Chocolates', 'Nuts', 'Dry Fruits', 'Traditional Snacks', 'Instant Snacks'],
        customAttributes: ['brand', 'ingredients', 'netWeight', 'flavour', 'vegNonVeg', 'allergenInfo', 'shelfLife', 'fssaiLicenseNumber'],
      },
      {
        name: 'Sweets',
        slug: 'sweets',
        description: 'Handcrafted traditional ghee sweets, laddu, halwa, and festive gift boxes',
        order: 4,
        subcategories: ['Traditional Sweets', 'Milk Sweets', 'Laddu', 'Halwa', 'Mysore Pak', 'Festival Sweets', 'Gift Boxes'],
        customAttributes: ['ingredients', 'netWeight', 'sweetType', 'shelfLife', 'fssaiLicenseNumber'],
      },
      {
        name: 'Groceries',
        slug: 'groceries',
        description: 'Pantry staples, premium rice, organic pulses, spices, and pure cooking oils',
        order: 5,
        subcategories: ['Rice', 'Dals', 'Flours', 'Spices', 'Oils', 'Masala', 'Pulses', 'Daily Essentials'],
        customAttributes: ['brand', 'netWeight', 'packagingType', 'ingredients', 'countryOfOrigin'],
      },
      {
        name: 'Vegetables',
        slug: 'vegetables',
        description: 'Farm-fresh organic leafy vegetables, root produce, and seasonal greens',
        order: 6,
        subcategories: ['Leafy Vegetables', 'Root Vegetables', 'Fresh Vegetables', 'Organic Vegetables'],
        customAttributes: ['productType', 'weightQuantity', 'freshness', 'organicStatus', 'origin', 'harvestDate', 'storageInstructions'],
      },
      {
        name: 'Fruits',
        slug: 'fruits',
        description: 'Fresh seasonal fruits, organic orchard harvests, and premium dry fruits',
        order: 7,
        subcategories: ['Fresh Fruits', 'Seasonal Fruits', 'Dry Fruits', 'Organic Fruits'],
        customAttributes: ['productType', 'weightQuantity', 'freshness', 'organicStatus', 'origin'],
      },
      {
        name: 'Other',
        slug: 'other',
        description: 'General lifestyle and miscellaneous quality products',
        order: 8,
        subcategories: ['General Products'],
        customAttributes: ['brand', 'model', 'specifications'],
      },
    ];

    const categoryMap = {};
    for (const cat of categoryDefs) {
      const parentDoc = await Category.findOneAndUpdate(
        { slug: cat.slug },
        {
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          order: cat.order,
          isActive: true,
          parent: null,
          subcategories: cat.subcategories,
          customAttributes: cat.customAttributes,
        },
        { upsert: true, new: true }
      );
      categoryMap[cat.name] = parentDoc;
    }

    // 3. Seed Verified Sellers
    const sellersData = [
      {
        email: 'seller.electronics@digitalworld.com',
        name: 'Arun Kumar',
        storeName: 'Apex Tech Hub',
        phone: '9840112233',
        businessCategory: 'Electronics',
        slug: 'apex-tech-hub',
        gstin: '33AAAAA0000A1Z5',
        pan: 'AAAAA0000A',
        bankAcc: '918273645102',
        ifsc: 'HDFC0001234',
        fssai: '',
        deliveryCharge: 60,
        freeDeliveryThreshold: 999,
      },
      {
        email: 'seller.clothing@digitalworld.com',
        name: 'Kavitha Ramesh',
        storeName: 'Tirupur Apparel Co',
        phone: '9789123456',
        businessCategory: 'Clothing',
        slug: 'tirupur-apparel-co',
        gstin: '33BBBBB1111B1Z6',
        pan: 'BBBBB1111B',
        bankAcc: '987654321098',
        ifsc: 'SBIN0004567',
        fssai: '',
        deliveryCharge: 40,
        freeDeliveryThreshold: 599,
      },
      {
        email: 'seller.snacks@digitalworld.com',
        name: 'Suresh Menon',
        storeName: 'Kerala Delicacies & Snacks',
        phone: '9447123890',
        businessCategory: 'Snacks',
        slug: 'kerala-delicacies',
        gstin: '32CCCCC2222C1Z7',
        pan: 'CCCCC2222C',
        bankAcc: '112233445566',
        ifsc: 'ICIC0000123',
        fssai: '10019043000123',
        deliveryCharge: 49,
        freeDeliveryThreshold: 499,
      },
      {
        email: 'seller.sweets@digitalworld.com',
        name: 'Venkatesh Iyer',
        storeName: 'Sri Krishna Sweets & Treats',
        phone: '9884567890',
        businessCategory: 'Sweets',
        slug: 'sri-krishna-sweets',
        gstin: '33DDDDD3333D1Z8',
        pan: 'DDDDD3333D',
        bankAcc: '556677889900',
        ifsc: 'KKBK0000456',
        fssai: '10019043000456',
        deliveryCharge: 49,
        freeDeliveryThreshold: 499,
      },
    ];

    const sellerDocs = {};
    for (const s of sellersData) {
      let admin = await Admin.findOne({ email: s.email });
      if (!admin) {
        admin = await Admin.create({
          email: s.email,
          name: s.name,
          role: 'seller',
          status: 'approved',
          phone: s.phone,
          passwordHash: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ecpf5SxyrV.qf82mK',
        });
      } else {
        admin.role = 'seller';
        admin.status = 'approved';
        await admin.save();
      }
      sellerDocs[s.slug] = admin;

      await SellerBusinessProfile.findOneAndUpdate(
        { seller: admin._id },
        {
          seller: admin._id,
          businessName: s.storeName,
          sellerSlug: s.slug,
          contactPerson: s.name,
          phone: s.phone,
          email: s.email,
          gstin: s.gstin,
          panNumber: s.pan,
          fssaiNumber: s.fssai,
          address: { street: '12 Main Bazaar Road', city: 'Chennai', state: 'Tamil Nadu', pincode: '600001' },
          bankDetails: { accountNumber: s.bankAcc, ifscCode: s.ifsc, bankName: 'HDFC Bank Ltd', branchName: 'Commerce Branch', accountHolderName: s.name },
          businessDescription: `Certified authentic manufacturer and trusted supplier of premier quality ${s.businessCategory}.`,
          businessCategory: s.businessCategory,
          yearOfEstablishment: 2018,
          rating: 4.8,
          totalReviews: 340,
          onTimeDispatchRate: 98,
          responseTime: 'Within 2 hours',
          deliveryCharge: s.deliveryCharge,
          freeDeliveryThreshold: s.freeDeliveryThreshold,
          minOrderValue: 0,
          status: 'approved',
          onboardingCompleted: true,
        },
        { upsert: true, new: true }
      );
    }

    // 4. Seed Products with Category-Specific Variants & Category Product IDs
    const seededProducts = [];

    // Product 1: Electronics (Hardware Variants)
    const laptopCat = categoryMap['Electronics'];
    if (laptopCat) {
      const p1 = await Product.findOneAndUpdate(
        { slug: 'ultraslim-15-pro-laptop' },
        {
          name: 'UltraSlim 15 Pro Laptop',
          slug: 'ultraslim-15-pro-laptop',
          productId: 'ELE-00001',
          sku: 'SKU-LAP-001',
          category: laptopCat._id,
          productType: 'electronics',
          seller: null, // Admin in-house product
          basePrice: 64999,
          totalStock: 25,
          rating: 4.8,
          reviewCount: 32,
          description: 'High-performance ultrabook featuring 2.8K OLED display and aerospace aluminum chassis.',
          images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&auto=format&fit=crop'],
          attributes: { brand: 'ApexTech', warranty: '1 Year Comprehensive Onsite', countryOfOrigin: 'India' },
          variants: [
            {
              color: 'Space Grey',
              price: 64999,
              compareAtPrice: 74999,
              stock: 15,
              model: 'Pro-15-16GB',
              ram: '16GB',
              storage: '512GB SSD',
              warranty: '1 Year Onsite',
              sizes: [{ size: '512GB / 16GB', stock: 15, price: 64999, compareAtPrice: 74999, ram: '16GB', storage: '512GB' }],
            },
            {
              color: 'Space Grey',
              price: 84999,
              compareAtPrice: 99999,
              stock: 10,
              model: 'Pro-15-32GB',
              ram: '32GB',
              storage: '1TB SSD',
              warranty: '1 Year Onsite',
              sizes: [{ size: '1TB / 32GB', stock: 10, price: 84999, compareAtPrice: 99999, ram: '32GB', storage: '1TB' }],
            },
          ],
        },
        { upsert: true, new: true }
      );
      seededProducts.push(p1);
    }

    // Product 2: Snacks (Weight-based Variants)
    const snacksCat = categoryMap['Snacks'];
    if (snacksCat) {
      const p2 = await Product.findOneAndUpdate(
        { slug: 'traditional-kerala-banana-chips' },
        {
          name: 'Traditional Kerala Banana Chips',
          slug: 'traditional-kerala-banana-chips',
          productId: 'SNK-00001',
          sku: 'SKU-SNK-001',
          category: snacksCat._id,
          productType: 'snacks',
          seller: null, // Admin in-house product
          basePrice: 120,
          totalStock: 105,
          rating: 4.9,
          reviewCount: 128,
          description: 'Thinly sliced Nendran raw bananas crisped in pure cold-pressed coconut oil with rock salt.',
          images: ['https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=800&auto=format&fit=crop'],
          attributes: { brand: 'MailooBazar Naturals', fssaiLicense: '10019043000123', shelfLife: '90 Days', netWeight: '250g' },
          variants: [
            {
              color: 'Original Salted',
              price: 120,
              compareAtPrice: 140,
              stock: 105,
              sizes: [
                { size: '250g', stock: 50, price: 120, compareAtPrice: 140 },
                { size: '500g', stock: 35, price: 230, compareAtPrice: 270 },
                { size: '1kg', stock: 20, price: 440, compareAtPrice: 520 },
              ],
            },
          ],
        },
        { upsert: true, new: true }
      );
      seededProducts.push(p2);
    }

    // Product 3: Sweets (Weight-based Variants)
    const sweetsCat = categoryMap['Sweets'];
    if (sweetsCat) {
      const p3 = await Product.findOneAndUpdate(
        { slug: 'pure-ghee-mysore-pak' },
        {
          name: 'Pure Ghee Mysore Pak',
          slug: 'pure-ghee-mysore-pak',
          productId: 'SWT-00001',
          sku: 'SKU-SWT-001',
          category: sweetsCat._id,
          productType: 'sweets',
          seller: null,
          basePrice: 190,
          totalStock: 80,
          rating: 4.9,
          reviewCount: 94,
          description: 'Melt-in-mouth traditional royal dessert handcrafted using pure aromatic cow ghee and besan.',
          images: ['https://images.unsplash.com/photo-1599785209707-a456fc1337bb?w=800&auto=format&fit=crop'],
          attributes: { fssaiLicense: '10019043000456', shelfLife: '30 Days', netWeight: '250g' },
          variants: [
            {
              color: 'Golden Ghee',
              price: 190,
              compareAtPrice: 220,
              stock: 80,
              sizes: [
                { size: '250g', stock: 40, price: 190, compareAtPrice: 220 },
                { size: '500g', stock: 25, price: 360, compareAtPrice: 420 },
                { size: '1kg', stock: 15, price: 700, compareAtPrice: 800 },
              ],
            },
          ],
        },
        { upsert: true, new: true }
      );
      seededProducts.push(p3);

      // Product 4: Out of Stock Sweet (Testing Requirement 06)
      await Product.findOneAndUpdate(
        { slug: 'handmade-pistachio-halwa' },
        {
          name: 'Handmade Pistachio Halwa',
          slug: 'handmade-pistachio-halwa',
          productId: 'SWT-00002',
          sku: 'SKU-SWT-002',
          category: sweetsCat._id,
          productType: 'sweets',
          seller: null,
          basePrice: 450,
          totalStock: 0, // Zero Stock!
          rating: 4.7,
          reviewCount: 15,
          description: 'Slow-cooked royal delicacy rich in roasted Iranian pistachios.',
          images: ['https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=800&auto=format&fit=crop'],
          variants: [
            {
              color: 'Royal Green',
              price: 450,
              compareAtPrice: 500,
              stock: 0,
              sizes: [{ size: '500g', stock: 0, price: 450, compareAtPrice: 500 }],
            },
          ],
        },
        { upsert: true, new: true }
      );
    }

    // Product 5: Clothing (Size & Color Variants)
    const clothingCat = categoryMap['Clothing'];
    if (clothingCat) {
      await Product.findOneAndUpdate(
        { slug: 'men-pure-cotton-casual-shirt' },
        {
          name: 'Men Pure Cotton Casual Shirt',
          slug: 'men-pure-cotton-casual-shirt',
          productId: 'CLO-00001',
          sku: 'SKU-CLO-001',
          category: clothingCat._id,
          productType: 'clothing',
          seller: null,
          basePrice: 899,
          totalStock: 90,
          rating: 4.6,
          reviewCount: 45,
          description: 'Breathable combed cotton shirt styled with mandarin collar and mother-of-pearl buttons.',
          images: ['https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop'],
          attributes: { brand: 'Tirupur Weaves', fabric: '100% Combed Cotton', pattern: 'Solid', fitType: 'Slim Fit' },
          variants: [
            {
              color: 'Black',
              colorHex: '#000000',
              price: 899,
              compareAtPrice: 1499,
              stock: 55,
              sizes: [
                { size: 'M', stock: 25, price: 899, compareAtPrice: 1499 },
                { size: 'L', stock: 30, price: 899, compareAtPrice: 1499 },
              ],
            },
            {
              color: 'Navy',
              colorHex: '#1E3A8A',
              price: 899,
              compareAtPrice: 1499,
              stock: 35,
              sizes: [
                { size: 'M', stock: 20, price: 899, compareAtPrice: 1499 },
                { size: 'L', stock: 15, price: 899, compareAtPrice: 1499 },
              ],
            },
          ],
        },
        { upsert: true, new: true }
      );
    }

    // 5. Seed Admin Combo Offer (Requirement 01)
    const bananaChips = await Product.findOne({ slug: 'traditional-kerala-banana-chips' });
    const mysorePak = await Product.findOne({ slug: 'pure-ghee-mysore-pak' });

    if (bananaChips && mysorePak) {
      const v1 = bananaChips.variants[0];
      const v2 = mysorePak.variants[0];
      const s1 = v1?.sizes?.[0];
      const s2 = v2?.sizes?.[0];

      if (v1 && v2 && s1 && s2) {
        await Combo.findOneAndUpdate(
          { slug: 'south-indian-festive-delicacies-combo' },
          {
            name: 'South Indian Festive Delicacies Combo',
            slug: 'south-indian-festive-delicacies-combo',
            type: 'multi-product',
            seller: null, // Admin platform combo
            images: [
              'https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=800&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1599785209707-a456fc1337bb?w=800&auto=format&fit=crop',
            ],
            description: 'Authentic festive pairing: crispy coconut-oil banana chips and melt-in-mouth pure ghee Mysore Pak.',
            comboPrice: 289,
            originalPrice: 310,
            discountType: 'fixed',
            discountValue: 21,
            savingsAmount: 21,
            savingsPercentage: 7,
            comboStock: 30,
            isActive: true,
            products: [
              {
                product: bananaChips._id,
                variantId: v1._id,
                size: s1.size,
                qty: 1,
              },
              {
                product: mysorePak._id,
                variantId: v2._id,
                size: s2.size,
                qty: 1,
              },
            ],
          },
          { upsert: true, new: true }
        );
      }
    }

    // 8. Safely migrate and seed Admin Homepage Banners vs Seller Storefront Banners
    await Banner.updateMany(
      { seller: { $ne: null }, bannerType: { $ne: 'storefront' } },
      { $set: { bannerType: 'storefront' } }
    );
    await Banner.updateMany(
      { seller: null, bannerType: { $ne: 'homepage' } },
      { $set: { bannerType: 'homepage' } }
    );

    // Official Admin homepage hero banner
    await Banner.findOneAndUpdate(
      { title: 'Grand Festive Electronics & Gourmet Festival' },
      {
        title: 'Grand Festive Electronics & Gourmet Festival',
        subtitle: 'Digital World Festive Gala',
        description: 'Up to 50% OFF on certified authentic multi-vendor gadgets, apparel, and traditional gourmet treats.',
        image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600',
        mobileImage: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800',
        link: '/shop',
        buttonText: 'Shop All Offers',
        sortOrder: 1,
        isActive: true,
        approval: 'approved',
        bannerType: 'homepage',
        seller: null,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Initial platform data, categories, products, admin combos, admin banners, and sellers seeded successfully.',
    });
  } catch (err) {
    console.error('Seed API error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET(req) {
  return POST(req);
}

