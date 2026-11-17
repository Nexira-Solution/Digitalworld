import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Admin from '../models/Admin.js';
import SellerBusinessProfile from '../models/SellerBusinessProfile.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import Banner from '../models/Banner.js';
import Combo from '../models/Combo.js';
import Review from '../models/Review.js';
import Order from '../models/Order.js';
import Settings from '../models/Settings.js';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI missing from environment variables');
  process.exit(1);
}

async function runSeed() {
  console.log('Connecting to MongoDB database…');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected successfully!');

  // 1. Seed Global Settings (Feature 11 & Feature 15)
  console.log('--- 1. Seeding Settings & Delivery Config ---');
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
  console.log('Global settings configured.');

  // 2. Seed Categories & Subcategories (Feature 1)
  console.log('--- 2. Seeding Categories & Subcategories ---');
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

    // Seed child categories for App Router nesting
    for (const sub of cat.subcategories) {
      const subSlug = `${cat.slug}-${sub.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      await Category.findOneAndUpdate(
        { slug: subSlug },
        {
          name: sub,
          slug: subSlug,
          parent: parentDoc._id,
          order: 0,
          isActive: true,
        },
        { upsert: true, new: true }
      );
    }
  }
  console.log(`Seeded ${categoryDefs.length} parent categories and subcategories.`);

  // 3. Seed Verified Sellers (Feature 8)
  console.log('--- 3. Seeding Verified Sellers & Profiles ---');
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
        passwordHash: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ecpf5SxyrV.qf82mK', // dummy hash
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
        address: {
          street: '12 Main Bazaar Road',
          city: 'Chennai',
          state: 'Tamil Nadu',
          pincode: '600001',
        },
        bankDetails: {
          accountNumber: s.bankAcc,
          ifscCode: s.ifsc,
          bankName: 'HDFC Bank Ltd',
          branchName: 'Commerce Branch',
          accountHolderName: s.name,
        },
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
  console.log(`Configured ${sellersData.length} verified sellers and business profiles.`);

  // 4. Seed Multi-Category Products (Feature 1, 2, 7)
  console.log('--- 4. Seeding Products across Categories ---');
  const productsData = [
    {
      name: 'SmartPulse Pro 5G Mobile',
      slug: 'smartpulse-pro-5g-mobile',
      productType: 'Electronics',
      category: categoryMap['Electronics']._id,
      subcategory: 'Mobiles',
      brand: 'SmartPulse',
      seller: sellerDocs['apex-tech-hub']._id,
      sku: 'ELEC-SP-01',
      barcode: '890123456001',
      price: 19999,
      compareAtPrice: 24999,
      discountPercentage: 20,
      description: 'Flagship 5G smartphone featuring a 6.7-inch AMOLED display, Snapdragon processor, 108MP camera, and 5000mAh battery with 65W fast charging.',
      attributes: {
        brand: 'SmartPulse',
        model: 'Pro 5G',
        ram: '8 GB',
        storage: '128 GB',
        processor: 'Snapdragon 7 Gen 2',
        batteryCapacity: '5000 mAh',
        screenSize: '6.7 inch',
        operatingSystem: 'Android 14',
        color: 'Midnight Black',
        warranty: '1 Year Manufacturer Warranty',
      },
      variants: [
        {
          color: 'Midnight Black',
          price: 19999,
          compareAtPrice: 24999,
          images: ['https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800'],
          sizes: [{ size: '128 GB', price: 19999, compareAtPrice: 24999, stock: 25, sku: 'ELEC-SP-01-BLK-128' }],
        },
        {
          color: 'Cosmic Blue',
          price: 21999,
          compareAtPrice: 26999,
          images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800'],
          sizes: [{ size: '256 GB', price: 21999, compareAtPrice: 26999, stock: 18, sku: 'ELEC-SP-01-BLU-256' }],
        },
      ],
    },
    {
      name: 'Handcrafted Pure Cotton Kurta',
      slug: 'handcrafted-pure-cotton-kurta',
      productType: 'Clothing',
      category: categoryMap['Clothing']._id,
      subcategory: 'Men',
      brand: 'Tirupur Hub',
      seller: sellerDocs['tirupur-apparel-co']._id,
      sku: 'CLTH-KT-01',
      barcode: '890123456002',
      price: 899,
      compareAtPrice: 1499,
      discountPercentage: 40,
      fabric: '100% Breathable Khadi Cotton',
      washCare: 'Machine wash cold with similar colors, gentle cycle, tumble dry low.',
      description: 'Artisanal breathable pure cotton men’s kurta crafted by skilled weavers in Tirupur. Ideal for festive occasions and casual comfort.',
      attributes: {
        brand: 'Tirupur Hub',
        gender: 'Men',
        fabric: '100% Khadi Cotton',
        fitType: 'Regular Fit',
        pattern: 'Solid Textured',
        washCare: 'Gentle Machine Wash',
      },
      variants: [
        {
          color: 'Cream White',
          price: 899,
          compareAtPrice: 1499,
          images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800'],
          sizes: [
            { size: 'M (38)', price: 899, compareAtPrice: 1499, stock: 30, sku: 'CLTH-KT-WHT-M' },
            { size: 'L (40)', price: 899, compareAtPrice: 1499, stock: 45, sku: 'CLTH-KT-WHT-L' },
            { size: 'XL (42)', price: 899, compareAtPrice: 1499, stock: 20, sku: 'CLTH-KT-WHT-XL' },
          ],
        },
      ],
    },
    {
      name: 'Kerala Gourmet Crispy Banana Chips',
      slug: 'kerala-gourmet-crispy-banana-chips',
      productType: 'Snacks',
      category: categoryMap['Snacks']._id,
      subcategory: 'Chips',
      brand: 'Kerala Delights',
      seller: sellerDocs['kerala-delicacies']._id,
      sku: 'SNCK-BC-01',
      barcode: '890123456003',
      price: 180,
      compareAtPrice: 240,
      discountPercentage: 25,
      description: 'Authentic golden Nendran banana chips traditionally fried in 100% cold-pressed pure coconut oil and mildly sea salted.',
      attributes: {
        brand: 'Kerala Delights',
        ingredients: 'Raw Nendran Bananas, Pure Coconut Oil, Salt',
        netWeight: '500g',
        vegNonVeg: 'Vegetarian',
        shelfLife: '90 Days',
        fssaiLicenseNumber: '10019043000123',
      },
      variants: [
        {
          color: 'Traditional Salted',
          price: 180,
          compareAtPrice: 240,
          images: ['https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=800'],
          sizes: [
            { size: '250 g', price: 99, compareAtPrice: 140, stock: 60, sku: 'SNCK-BC-250G' },
            { size: '500 g', price: 180, compareAtPrice: 240, stock: 80, sku: 'SNCK-BC-500G' },
            { size: '1 kg', price: 340, compareAtPrice: 460, stock: 40, sku: 'SNCK-BC-1KG' },
          ],
        },
      ],
    },
    {
      name: 'Traditional Pure Ghee Mysore Pak',
      slug: 'traditional-pure-ghee-mysore-pak',
      productType: 'Sweets',
      category: categoryMap['Sweets']._id,
      subcategory: 'Mysore Pak',
      brand: 'Sri Krishna',
      seller: sellerDocs['sri-krishna-sweets']._id,
      sku: 'SWT-MP-01',
      barcode: '890123456004',
      price: 290,
      compareAtPrice: 380,
      discountPercentage: 24,
      description: 'Melt-in-mouth traditional royal Mysore Pak prepared using fresh country cow ghee, roasted gram flour, and premium sugar.',
      attributes: {
        ingredients: 'Pure Desi Cow Ghee, Gram Flour (Besan), Sugar, Cardamom',
        netWeight: '500g',
        sweetType: 'Ghee Sweet',
        shelfLife: '30 Days',
        fssaiLicenseNumber: '10019043000456',
      },
      variants: [
        {
          color: 'Melt Ghee',
          price: 290,
          compareAtPrice: 380,
          images: ['https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800'],
          sizes: [
            { size: '250 g', price: 150, compareAtPrice: 200, stock: 40, sku: 'SWT-MP-250G' },
            { size: '500 g', price: 290, compareAtPrice: 380, stock: 50, sku: 'SWT-MP-500G' },
          ],
        },
      ],
    },
    {
      name: 'Organic Royal Basmati Rice (Aged 2 Years)',
      slug: 'organic-royal-basmati-rice',
      productType: 'Groceries',
      category: categoryMap['Groceries']._id,
      subcategory: 'Rice',
      brand: 'Digital World Select',
      seller: null, // Platform-owned official product
      sku: 'GROC-BR-01',
      barcode: '890123456005',
      price: 499,
      compareAtPrice: 650,
      discountPercentage: 23,
      description: 'Aged long-grain aromatic Royal Basmati Rice directly sourced from Himalayan foothills. Fluffy, non-sticky grains with captivating aroma.',
      attributes: {
        brand: 'Digital World Select',
        netWeight: '5 kg',
        packagingType: 'Air-tight Bag',
        countryOfOrigin: 'India',
      },
      variants: [
        {
          color: 'White Long Grain',
          price: 499,
          compareAtPrice: 650,
          images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800'],
          sizes: [{ size: '5 kg', price: 499, compareAtPrice: 650, stock: 100, sku: 'GROC-BR-5KG' }],
        },
      ],
    },
    {
      name: 'Farm Fresh Organic Baby Spinach',
      slug: 'farm-fresh-organic-baby-spinach',
      productType: 'Vegetables',
      category: categoryMap['Vegetables']._id,
      subcategory: 'Leafy Vegetables',
      brand: 'Farm Fresh',
      seller: null, // Platform-owned official product
      sku: 'VEG-SP-01',
      barcode: '890123456006',
      price: 45,
      compareAtPrice: 60,
      discountPercentage: 25,
      description: 'Crisp organic tender baby spinach leaves harvested at sunrise. Free from synthetic chemical fertilizers and pesticides.',
      attributes: {
        productType: 'Leafy Vegetables',
        weightQuantity: '250g Bunch',
        freshness: 'Harvested Today',
        organicStatus: '100% Certified Organic',
        storageInstructions: 'Refrigerate in a breathable bag to retain crispness.',
      },
      variants: [
        {
          color: 'Fresh Green',
          price: 45,
          compareAtPrice: 60,
          images: ['https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=800'],
          sizes: [{ size: '250 g', price: 45, compareAtPrice: 60, stock: 50, sku: 'VEG-SP-250G' }],
        },
      ],
    },
  ];

  const productDocs = {};
  for (const p of productsData) {
    const doc = await Product.findOneAndUpdate(
      { slug: p.slug },
      {
        ...p,
        isActive: true,
        status: 'published',
        rating: 4.8,
        numReviews: 24,
      },
      { upsert: true, new: true }
    );
    productDocs[p.slug] = doc;
  }
  console.log(`Seeded ${productsData.length} multi-vendor and platform products.`);

  // 5. Seed Homepage & Storefront Banners (Feature 3 & Feature 4)
  console.log('--- 5. Seeding Banners ---');
  await Banner.findOneAndUpdate(
    { title: 'Grand Festive Electronics & Gourmet Festival' },
    {
      title: 'Grand Festive Electronics & Gourmet Festival',
      description: 'Up to 50% OFF on certified authentic multi-vendor gadgets, apparel, and traditional gourmet treats.',
      image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600',
      mobileImage: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800',
      link: '/products',
      placement: 'hero',
      bannerType: 'homepage',
      order: 1,
      isActive: true,
      approval: 'approved',
      seller: null,
    },
    { upsert: true, new: true }
  );

  // Storefront banner for Kerala Delicacies
  await Banner.findOneAndUpdate(
    { title: 'Authentic Malabar Delicacies Direct Store' },
    {
      title: 'Authentic Malabar Delicacies Direct Store',
      description: 'Handcrafted banana chips, halwa, and coastal snacks delivered straight from the kitchen.',
      image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=1400',
      placement: 'storefront',
      bannerType: 'storefront',
      isActive: true,
      approval: 'approved',
      seller: sellerDocs['kerala-delicacies']._id,
    },
    { upsert: true, new: true }
  );
  console.log('Banners configured and approved.');

  // 6. Seed Combos & Multipacks (Feature 5)
  console.log('--- 6. Seeding Combos & Bundles ---');
  const bananaChips = productDocs['kerala-gourmet-crispy-banana-chips'];
  const mysorePak = productDocs['traditional-pure-ghee-mysore-pak'];

  if (bananaChips && mysorePak) {
    const varChips = bananaChips.variants[0];
    const varSweets = mysorePak.variants[0];

    await Combo.findOneAndUpdate(
      { slug: 'traditional-taste-of-south-delight-combo' },
      {
        name: 'Taste of South: Crispy Chips & Ghee Mysore Pak Combo',
        slug: 'traditional-taste-of-south-delight-combo',
        description: 'The iconic traditional pairing: 500g of crunchy coconut oil banana chips combined with 500g of royal melt-in-mouth Ghee Mysore Pak.',
        comboType: 'bundle',
        discountType: 'percentage',
        discountValue: 15,
        originalPrice: 470,
        comboPrice: 399,
        savingsAmount: 71,
        savingsPercentage: 15,
        isActive: true,
        seller: sellerDocs['kerala-delicacies']._id,
        sku: 'COMBO-SOUTH-01',
        products: [
          {
            product: bananaChips._id,
            variantId: varChips._id,
            size: '500 g',
            qty: 1,
          },
          {
            product: mysorePak._id,
            variantId: varSweets._id,
            size: '500 g',
            qty: 1,
          },
        ],
      },
      { upsert: true, new: true }
    );
  }
  console.log('Combos and bundles seeded.');

  // 7. Seed Reviews with Verified Purchases (Feature 6)
  console.log('--- 7. Seeding Verified Customer Reviews ---');
  if (bananaChips) {
    await Review.findOneAndUpdate(
      { product: bananaChips._id, title: 'Crispiest and freshest banana chips I have ever had!' },
      {
        product: bananaChips._id,
        user: new mongoose.Types.ObjectId(),
        name: 'Priya Narayanan',
        rating: 5,
        title: 'Crispiest and freshest banana chips I have ever had!',
        comment: 'These remind me of childhood visits to Kerala! Golden, crispy, perfectly salted, and with authentic pure coconut oil flavor without feeling greasy.',
        isApproved: true,
        reviewStatus: 'approved',
        isVerifiedPurchase: true,
        recommends: true,
      },
      { upsert: true, new: true }
    );
  }
  console.log('Customer reviews seeded.');

  // 8. Seed Multi-Seller Orders with Delivery Breakdown & Timeline (Feature 11 & Feature 12)
  console.log('--- 8. Seeding Orders & Status History ---');
  const existingOrder = await Order.findOne({ orderNumber: 'ORD-2026-9001' });
  if (!existingOrder) {
    await Order.create({
      orderNumber: 'ORD-2026-9001',
      items: [
        {
          product: productDocs['kerala-gourmet-crispy-banana-chips']._id,
          seller: sellerDocs['kerala-delicacies']._id,
          name: 'Kerala Gourmet Crispy Banana Chips',
          sku: 'SNCK-BC-500G',
          size: '500 g',
          color: 'Traditional Salted',
          price: 180,
          qty: 2,
        },
        {
          product: productDocs['traditional-pure-ghee-mysore-pak']._id,
          seller: sellerDocs['sri-krishna-sweets']._id,
          name: 'Traditional Pure Ghee Mysore Pak',
          sku: 'SWT-MP-500G',
          size: '500 g',
          color: 'Melt Ghee',
          price: 290,
          qty: 1,
        },
      ],
      customer: {
        name: 'Deepak Sundaram',
        phone: '9840987654',
        email: 'deepak.sundaram@example.com',
      },
      shippingAddress: {
        line1: 'Flat 4B, Emerald Heights, Gandhi Road',
        line2: 'Near Central Park',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600028',
        landmark: 'Opposite City Library',
      },
      subtotal: 650,
      discount: 0,
      shippingFee: 49,
      deliveryBreakdown: [
        {
          sellerId: sellerDocs['kerala-delicacies']._id,
          sellerName: 'Kerala Delicacies & Snacks',
          subtotal: 360,
          deliveryFee: 49,
          isFreeDelivery: false,
        },
        {
          sellerId: sellerDocs['sri-krishna-sweets']._id,
          sellerName: 'Sri Krishna Sweets & Treats',
          subtotal: 290,
          deliveryFee: 0,
          isFreeDelivery: true,
        },
      ],
      total: 699,
      paymentMethod: 'razorpay',
      paymentStatus: 'paid',
      razorpayOrderId: 'order_test_9001',
      razorpayPaymentId: 'pay_test_9001',
      status: 'delivered',
      statusHistory: [
        {
          status: 'confirmed',
          timestamp: new Date(Date.now() - 5 * 86400000),
          updaterRole: 'system',
          notes: 'Order placed and payment verified via Razorpay.',
        },
        {
          status: 'processing',
          timestamp: new Date(Date.now() - 4 * 86400000),
          updaterRole: 'seller',
          notes: 'Fresh batches packaged and quality verified.',
        },
        {
          status: 'shipped',
          timestamp: new Date(Date.now() - 3 * 86400000),
          updaterRole: 'seller',
          notes: 'Dispatched via Bluedart Express AWB #87654321',
        },
        {
          status: 'delivered',
          timestamp: new Date(Date.now() - 1 * 86400000),
          updaterRole: 'admin',
          notes: 'Package handed over to customer successfully.',
        },
      ],
    });
  }

  // Second order in 'processing' status
  const existingOrder2 = await Order.findOne({ orderNumber: 'ORD-2026-9002' });
  if (!existingOrder2) {
    await Order.create({
      orderNumber: 'ORD-2026-9002',
      items: [
        {
          product: productDocs['smartpulse-pro-5g-mobile']._id,
          seller: sellerDocs['apex-tech-hub']._id,
          name: 'SmartPulse Pro 5G Mobile',
          sku: 'ELEC-SP-01-BLK-128',
          size: '128 GB',
          color: 'Midnight Black',
          price: 19999,
          qty: 1,
        },
      ],
      customer: {
        name: 'Ananya Sharma',
        phone: '9811223344',
        email: 'ananya.sharma@example.com',
      },
      shippingAddress: {
        line1: 'A-204, Silicon Towers',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
      },
      subtotal: 19999,
      discount: 0,
      shippingFee: 0,
      deliveryBreakdown: [
        {
          sellerId: sellerDocs['apex-tech-hub']._id,
          sellerName: 'Apex Tech Hub',
          subtotal: 19999,
          deliveryFee: 0,
          isFreeDelivery: true,
        },
      ],
      total: 19999,
      paymentMethod: 'razorpay',
      paymentStatus: 'paid',
      razorpayOrderId: 'order_test_9002',
      razorpayPaymentId: 'pay_test_9002',
      status: 'processing',
      statusHistory: [
        {
          status: 'confirmed',
          timestamp: new Date(Date.now() - 12 * 3600000),
          updaterRole: 'system',
          notes: 'Payment confirmed.',
        },
        {
          status: 'processing',
          timestamp: new Date(Date.now() - 4 * 3600000),
          updaterRole: 'seller',
          notes: 'Device IMEI verified and packed in tamper-proof parcel.',
        },
      ],
    });
  }

  console.log('Orders and status histories seeded successfully.');

  console.log('\n======================================================');
  console.log('ALL 15 FEATURES SEEDED AND CONFIGURED CLEANLY!');
  console.log('======================================================');
  process.exit(0);
}

runSeed().catch((err) => {
  console.error('Seed execution error:', err);
  process.exit(1);
});
