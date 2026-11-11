import 'dotenv/config';
import mongoose from 'mongoose';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import Review from '../models/Review.js';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI not set in .env');
  process.exit(1);
}

const SNACK_PRODUCTS = [
  {
    name: 'Kerala Banana Chips',
    slug: 'kerala-banana-chips',
    sku: 'KBC-0001',
    description:
      'Our Kerala Banana Chips are made from handpicked, high-quality Nendran bananas, thinly sliced and traditionally fried in pure coconut oil. They are perfectly crispy, mildly salted, and deliver the authentic taste of Kerala in every bite.',
    basePrice: 120,
    compareAtPrice: 200,
    rating: 4.8,
    reviewCount: 1240,
    soldCount: 12560,
    isBestSeller: true,
    isFeatured: true,
    isActive: true,
    isActiveSeller: true,
    productType: 'food',
    attributes: {
      foodType: 'Veg',
      ingredients: 'Nendran Raw Bananas, Pure Coconut Oil, Rock Salt, Turmeric.',
      allergens: 'None',
      shelfLifeDays: '90',
      storage: 'Store in a cool, dry place away from direct sunlight. Transfer to an airtight container once opened.',
      fssaiLicense: '12423008000451',
    },
    specs: [
      { key: 'Energy', value: '532 kcal' },
      { key: 'Protein', value: '2.3 g' },
      { key: 'Carbohydrates', value: '58.4 g' },
      { key: 'Fat', value: '32.1 g' },
      { key: 'Sodium', value: '280 mg' },
    ],
    variant: {
      color: 'Golden Yellow',
      colorHex: '#F5C542',
      price: 120,
      compareAtPrice: 200,
      images: [
        '/images/gallery/kerala-banana-chips-main.jpg',
        '/images/gallery/thumb-1.jpg',
        '/images/gallery/thumb-2.jpg',
        '/images/gallery/thumb-3.jpg',
        '/images/gallery/thumb-4.jpg',
      ],
      sizes: [
        { size: 'Standard', stock: 48, price: 120, compareAtPrice: 200, sku: 'KBC-STD' },
        { size: '100 g', stock: 36, price: 120, compareAtPrice: 200, sku: 'KBC-100G' },
        { size: '250 g', stock: 24, price: 250, compareAtPrice: 400, sku: 'KBC-250G' },
        { size: '500 g', stock: 16, price: 480, compareAtPrice: 750, sku: 'KBC-500G' },
      ],
    },
    reviews: [
      {
        customerName: 'Arun Kumar',
        rating: 5.0,
        isVerifiedPurchase: true,
        isApproved: true,
        isFeatured: true,
        createdAt: new Date('2026-11-09T10:30:00.000Z'),
        comment:
          'Excellent taste and quality! The banana chips are super crispy and tastes exactly like authentic Kerala style.',
        images: [
          '/images/reviews/review-arun-1.jpg',
          '/images/reviews/review-arun-2.jpg',
          '/images/reviews/review-arun-3.jpg',
        ],
      },
      {
        customerName: 'Divya R',
        rating: 4.8,
        isVerifiedPurchase: true,
        isApproved: true,
        isFeatured: true,
        createdAt: new Date('2026-11-07T14:15:00.000Z'),
        comment:
          'Very fresh and crunchy. Packaging is premium and the delivery was on time. Definitely ordering again!',
        images: [
          '/images/reviews/review-divya-1.jpg',
          '/images/reviews/review-divya-2.jpg',
        ],
      },
      {
        customerName: 'Sathish M',
        rating: 4.7,
        isVerifiedPurchase: true,
        isApproved: true,
        isFeatured: true,
        createdAt: new Date('2026-11-05T09:00:00.000Z'),
        comment:
          'Great product! Light, crispy and perfectly salted. A must try for snacks lovers.',
        images: [
          '/images/reviews/review-sathish-1.jpg',
          '/images/reviews/review-sathish-2.jpg',
        ],
      },
      {
        customerName: 'Kavitha S',
        rating: 5.0,
        isVerifiedPurchase: true,
        isApproved: true,
        isFeatured: true,
        createdAt: new Date('2026-11-03T16:45:00.000Z'),
        comment:
          'Freshly made aroma when opened! Pure coconut oil taste without any greasiness. Highly recommend!',
        images: [],
      },
    ],
  },
  {
    name: 'Butter Murukku',
    slug: 'butter-murukku',
    sku: 'BM-0002',
    description:
      'Traditional, crunchy butter murukku with an authentic homemade taste, prepared using pure butter and roasted gram flour.',
    basePrice: 160,
    compareAtPrice: 200,
    rating: 4.7,
    reviewCount: 860,
    soldCount: 8900,
    isBestSeller: false,
    isFeatured: true,
    isActive: true,
    isActiveSeller: true,
    productType: 'food',
    attributes: {
      foodType: 'Veg',
      ingredients: 'Rice Flour, Roasted Gram Flour, Pure Butter, Cumin Seeds, Salt, Vegetable Oil',
      allergens: 'Milk / Dairy',
      shelfLifeDays: '60',
      storage: 'Keep in an airtight jar.',
      fssaiLicense: '12423008000451',
    },
    specs: [
      { key: 'Energy', value: '480 kcal' },
      { key: 'Protein', value: '6.5 g' },
      { key: 'Fat', value: '24 g' },
    ],
    variant: {
      color: 'Off White',
      colorHex: '#FAF7F0',
      price: 160,
      compareAtPrice: 200,
      images: [
        '/images/snacks/butter-murukku.jpg',
        '/images/gallery/thumb-1.jpg',
        '/images/gallery/thumb-2.jpg',
      ],
      sizes: [
        { size: 'Standard', stock: 36, price: 160, compareAtPrice: 200, sku: 'BM-STD' },
        { size: '100 g', stock: 28, price: 95, compareAtPrice: 120, sku: 'BM-100G' },
        { size: '250 g', stock: 18, price: 220, compareAtPrice: 280, sku: 'BM-250G' },
      ],
    },
  },
  {
    name: 'South Indian Mixture',
    slug: 'south-indian-mixture',
    sku: 'SIM-0003',
    description:
      'A perfect blend of crispy sev, peanuts and traditional spices for a rich, crunchy savory taste.',
    basePrice: 140,
    compareAtPrice: 200,
    rating: 4.6,
    reviewCount: 520,
    soldCount: 6400,
    isBestSeller: false,
    isFeatured: true,
    isActive: true,
    isActiveSeller: true,
    productType: 'food',
    attributes: {
      foodType: 'Veg',
      ingredients: 'Gram Flour, Peanuts, Roasted Dal, Curry Leaves, Chilli Powder, Asafoetida, Salt, Oil',
      allergens: 'Peanuts',
      shelfLifeDays: '60',
      storage: 'Keep airtight in a dry place.',
      fssaiLicense: '12423008000451',
    },
    variant: {
      color: 'Spiced Golden',
      colorHex: '#C9A227',
      price: 140,
      compareAtPrice: 200,
      images: [
        '/images/snacks/south-indian-mixture.jpg',
        '/images/gallery/thumb-2.jpg',
        '/images/gallery/thumb-3.jpg',
      ],
      sizes: [
        { size: 'Standard', stock: 52, price: 140, compareAtPrice: 200, sku: 'SIM-STD' },
        { size: '100 g', stock: 40, price: 80, compareAtPrice: 115, sku: 'SIM-100G' },
        { size: '250 g', stock: 30, price: 195, compareAtPrice: 275, sku: 'SIM-250G' },
      ],
    },
  },
  {
    name: 'Masala Peanuts',
    slug: 'masala-peanuts',
    sku: 'MP-0004',
    description:
      'Crunchy peanuts coated with a flavorful spiced gram flour batter and fried to perfection, perfect for snacking.',
    basePrice: 90,
    compareAtPrice: 100,
    rating: 4.5,
    reviewCount: 420,
    soldCount: 5100,
    isBestSeller: false,
    isFeatured: true,
    isActive: true,
    isActiveSeller: true,
    productType: 'food',
    attributes: {
      foodType: 'Veg',
      ingredients: 'Raw Peanuts, Besan, Rice Flour, Red Chilli, Ginger Garlic Spices, Salt, Vegetable Oil',
      allergens: 'Peanuts',
      shelfLifeDays: '45',
      storage: 'Keep airtight.',
      fssaiLicense: '12423008000451',
    },
    variant: {
      color: 'Deep Masala Red',
      colorHex: '#8B0000',
      price: 90,
      compareAtPrice: 100,
      images: [
        '/images/snacks/masala-peanuts.jpg',
        '/images/gallery/thumb-3.jpg',
      ],
      sizes: [
        { size: 'Standard', stock: 64, price: 90, compareAtPrice: 100, sku: 'MP-STD' },
        { size: '100 g', stock: 45, price: 55, compareAtPrice: 65, sku: 'MP-100G' },
        { size: '250 g', stock: 35, price: 125, compareAtPrice: 140, sku: 'MP-250G' },
      ],
    },
  },
  {
    name: 'Thattai',
    slug: 'thattai',
    sku: 'TH-0005',
    description:
      'Crispy and spicy thattai made with rice flour and traditional spices for an irresistible festive crunch.',
    basePrice: 110,
    compareAtPrice: 130,
    rating: 4.7,
    reviewCount: 680,
    soldCount: 7200,
    isBestSeller: false,
    isFeatured: true,
    isActive: true,
    isActiveSeller: true,
    productType: 'food',
    attributes: {
      foodType: 'Veg',
      ingredients: 'Rice Flour, Urad Dal Flour, Chana Dal, Curry Leaves, Butter, Salt, Oil',
      allergens: 'None',
      shelfLifeDays: '60',
      storage: 'Store in an airtight container.',
      fssaiLicense: '12423008000451',
    },
    variant: {
      color: 'Golden Brown',
      colorHex: '#B45309',
      price: 110,
      compareAtPrice: 130,
      images: [
        '/images/snacks/thattai.jpg',
        '/images/gallery/thumb-4.jpg',
      ],
      sizes: [
        { size: 'Standard', stock: 28, price: 110, compareAtPrice: 130, sku: 'TH-STD' },
        { size: '100 g', stock: 22, price: 65, compareAtPrice: 80, sku: 'TH-100G' },
        { size: '250 g', stock: 15, price: 155, compareAtPrice: 180, sku: 'TH-250G' },
      ],
    },
  },
  {
    name: 'Ribbon Pakoda',
    slug: 'ribbon-pakoda',
    sku: 'RP-0006',
    description:
      'Crispy, crunchy ribbon pakoda with a perfect blend of traditional spices and a melt-in-mouth texture.',
    basePrice: 150,
    compareAtPrice: 200,
    rating: 4.6,
    reviewCount: 560,
    soldCount: 6800,
    isBestSeller: false,
    isFeatured: true,
    isActive: true,
    isActiveSeller: true,
    productType: 'food',
    attributes: {
      foodType: 'Veg',
      ingredients: 'Besan, Rice Flour, Butter, Chilli Powder, Asafoetida, Salt, Oil',
      allergens: 'Dairy',
      shelfLifeDays: '60',
      storage: 'Store in an airtight jar.',
      fssaiLicense: '12423008000451',
    },
    variant: {
      color: 'Golden Ribbon',
      colorHex: '#D97706',
      price: 150,
      compareAtPrice: 200,
      images: [
        '/images/snacks/ribbon-pakoda.jpg',
        '/images/gallery/thumb-1.jpg',
      ],
      sizes: [
        { size: 'Standard', stock: 40, price: 150, compareAtPrice: 200, sku: 'RP-STD' },
        { size: '100 g', stock: 30, price: 85, compareAtPrice: 110, sku: 'RP-100G' },
        { size: '250 g', stock: 20, price: 210, compareAtPrice: 270, sku: 'RP-250G' },
      ],
    },
  },
];

async function seedSnacks() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
  });
  console.log('Connected to MongoDB Atlas.');

  // 1. Ensure Snacks Category
  let category = await Category.findOne({
    $or: [{ slug: 'snacks' }, { slug: 'Snacks' }, { name: 'Snacks' }],
  });

  if (!category) {
    category = await Category.create({
      name: 'Snacks',
      slug: 'snacks',
      productType: 'food',
      isActive: true,
      sizes: ['Standard', '100 g', '250 g', '500 g'],
      description: 'Authentic traditional South Indian snacks prepared with pure ingredients.',
    });
    console.log('Created Snacks Category:', category._id);
  } else {
    category.slug = 'snacks';
    category.productType = 'food';
    category.isActive = true;
    category.sizes = ['Standard', '100 g', '250 g', '500 g'];
    await category.save();
    console.log('Updated Snacks Category:', category._id);
  }

  // 2. Fix broken slug for existing demo products if needed
  await Product.updateMany({ slug: '.' }, { $set: { slug: 'masal-kadalai' } });

  // 3. Upsert each snack product
  for (const item of SNACK_PRODUCTS) {
    const existing = await Product.findOne({ slug: item.slug });

    const variantData = {
      color: item.variant.color,
      colorHex: item.variant.colorHex,
      price: item.variant.price,
      compareAtPrice: item.variant.compareAtPrice,
      images: item.variant.images,
      sizes: item.variant.sizes.map((s) => ({
        size: s.size,
        stock: s.stock,
        price: s.price,
        compareAtPrice: s.compareAtPrice,
        sku: s.sku,
      })),
    };

    if (existing) {
      existing.name = item.name;
      existing.sku = item.sku;
      existing.description = item.description;
      existing.category = category._id;
      existing.productType = item.productType;
      existing.basePrice = item.basePrice;
      existing.rating = item.rating;
      existing.reviewCount = item.reviewCount;
      existing.soldCount = item.soldCount;
      existing.isBestSeller = item.isBestSeller;
      existing.isFeatured = item.isFeatured;
      existing.isActive = true;
      existing.isActiveSeller = true;
      existing.attributes = item.attributes;
      if (item.specs) existing.specs = item.specs;
      existing.variants = [variantData];
      await existing.save();
      console.log(`Updated product: ${item.name} (${existing._id})`);

      // Seed reviews if provided
      if (item.reviews?.length) {
        await Review.deleteMany({ product: existing._id });
        for (const rev of item.reviews) {
          await Review.create({
            product: existing._id,
            customerName: rev.customerName,
            rating: rev.rating,
            comment: rev.comment,
            images: rev.images || [],
            isApproved: true,
            isFeatured: true,
            isVerifiedPurchase: true,
            createdAt: rev.createdAt || new Date(),
          });
        }
        console.log(`  -> Added ${item.reviews.length} reviews for ${item.name}`);
      }
    } else {
      const created = await Product.create({
        name: item.name,
        slug: item.slug,
        sku: item.sku,
        description: item.description,
        category: category._id,
        productType: item.productType,
        basePrice: item.basePrice,
        rating: item.rating,
        reviewCount: item.reviewCount,
        soldCount: item.soldCount,
        isBestSeller: item.isBestSeller,
        isFeatured: item.isFeatured,
        isActive: true,
        isActiveSeller: true,
        attributes: item.attributes,
        specs: item.specs || [],
        variants: [variantData],
      });
      console.log(`Created product: ${item.name} (${created._id})`);

      // Seed reviews if provided
      if (item.reviews?.length) {
        for (const rev of item.reviews) {
          await Review.create({
            product: created._id,
            customerName: rev.customerName,
            rating: rev.rating,
            comment: rev.comment,
            images: rev.images || [],
            isApproved: true,
            isFeatured: true,
            isVerifiedPurchase: true,
            createdAt: rev.createdAt || new Date(),
          });
        }
        console.log(`  -> Added ${item.reviews.length} reviews for ${item.name}`);
      }
    }
  }

  console.log('All snack products and reviews seeded successfully!');
  await mongoose.disconnect();
}

seedSnacks().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
