import 'dotenv/config';
import mongoose from 'mongoose';
import slugify from 'slugify';
import Category from '../models/Category.js';
import Product from '../models/Product.js';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI environment variable is not defined.');
  process.exit(1);
}

const SAMPLE_PRODUCTS = [
  {
    name: 'Premium Kashmiri Saffron',
    description: 'Premium quality aromatic Kashmiri saffron.',
    categoryName: 'Saffron & Spices',
    categorySlug: 'saffron-spices',
    packs: ['1g', '2g', '5g'],
    selling_prices: [199, 379, 899],
    original_prices: [249, 449, 1099],
    stocks: [20, 15, 10],
    isBestSeller: true,
  },
  {
    name: 'Pure Natural Saffron',
    description: 'Carefully selected premium saffron strands.',
    categoryName: 'Saffron & Spices',
    categorySlug: 'saffron-spices',
    packs: ['1g', '5g'],
    selling_prices: [179, 799],
    original_prices: [229, 999],
    stocks: [15, 12],
    isBestSeller: true,
  },
  {
    name: 'Premium Saffron Gift Pack',
    description: 'Premium saffron gift pack for special occasions.',
    categoryName: 'Saffron & Spices',
    categorySlug: 'saffron-spices',
    packs: ['2g', '5g'],
    selling_prices: [399, 899],
    original_prices: [499, 1099],
    stocks: [10, 8],
    isBestSeller: false,
  },
  {
    name: 'Organic Turmeric Powder',
    description: 'Natural turmeric powder for everyday cooking.',
    categoryName: 'Saffron & Spices',
    categorySlug: 'saffron-spices',
    packs: ['100g', '250g', '500g'],
    selling_prices: [59, 129, 239],
    original_prices: [79, 169, 299],
    stocks: [30, 25, 20],
    isBestSeller: true,
  },
  {
    name: 'Premium Almonds',
    description: 'Selected premium quality whole almonds.',
    categoryName: 'Dry Fruits & Nuts',
    categorySlug: 'dry-fruits-nuts',
    packs: ['100g', '250g', '500g'],
    selling_prices: [119, 279, 529],
    original_prices: [149, 349, 649],
    stocks: [20, 18, 12],
    isBestSeller: false,
  },
  {
    name: 'Natural Cashew Nuts',
    description: 'Premium whole cashew nuts.',
    categoryName: 'Dry Fruits & Nuts',
    categorySlug: 'dry-fruits-nuts',
    packs: ['100g', '250g', '500g'],
    selling_prices: [99, 229, 439],
    original_prices: [129, 289, 549],
    stocks: [25, 20, 15],
    isBestSeller: false,
  },
  {
    name: 'Pure Honey',
    description: 'Natural honey for everyday consumption.',
    categoryName: 'Saffron & Spices',
    categorySlug: 'saffron-spices',
    packs: ['250g', '500g', '1kg'],
    selling_prices: [149, 279, 499],
    original_prices: [189, 349, 599],
    stocks: [18, 14, 10],
    isBestSeller: true,
  },
  {
    name: 'Premium Pistachios',
    description: 'Carefully selected premium pistachios.',
    categoryName: 'Dry Fruits & Nuts',
    categorySlug: 'dry-fruits-nuts',
    packs: ['100g', '250g', '500g'],
    selling_prices: [159, 379, 729],
    original_prices: [199, 449, 899],
    stocks: [15, 12, 8],
    isBestSeller: false,
  },
  {
    name: 'Natural Raisins',
    description: 'Naturally sweet dried raisins.',
    categoryName: 'Dry Fruits & Nuts',
    categorySlug: 'dry-fruits-nuts',
    packs: ['100g', '250g', '500g'],
    selling_prices: [49, 109, 199],
    original_prices: [69, 139, 249],
    stocks: [30, 25, 20],
    isBestSeller: false,
  },
  {
    name: 'Premium Dry Fruits Combo',
    description: 'A premium combination of selected dry fruits.',
    categoryName: 'Dry Fruits & Nuts',
    categorySlug: 'dry-fruits-nuts',
    packs: ['250g', '500g', '1kg'],
    selling_prices: [299, 549, 999],
    original_prices: [379, 699, 1299],
    stocks: [10, 8, 6],
    isBestSeller: true,
  },
];

async function seedProducts() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
  });
  console.log('Connected to MongoDB Atlas successfully.');

  // 1. Ensure Categories exist or resolve from existing
  const categoryCache = new Map();

  async function getOrCreateCategory(name, slug) {
    if (categoryCache.has(slug)) return categoryCache.get(slug);

    let cat = await Category.findOne({
      $or: [{ slug }, { name }],
    });

    if (!cat) {
      cat = await Category.create({
        name,
        slug,
        productType: 'food',
        isActive: true,
        sizes: ['Standard', '100g', '250g', '500g', '1kg', '1g', '2g', '5g'],
        description: `Premium quality authentic ${name} offerings.`,
      });
      console.log(`Created category "${name}" (${cat._id})`);
    } else {
      cat.productType = 'food';
      cat.isActive = true;
      await cat.save();
    }

    categoryCache.set(slug, cat._id);
    return cat._id;
  }

  let createdCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < SAMPLE_PRODUCTS.length; i++) {
    const item = SAMPLE_PRODUCTS[i];
    const slug = slugify(item.name, { lower: true, strict: true });

    // Check idempotency: do not overwrite existing products
    const existing = await Product.findOne({ slug });
    if (existing) {
      console.log(`[SKIP] Product already exists: "${item.name}" (slug: ${slug})`);
      skippedCount++;
      continue;
    }

    const categoryId = await getOrCreateCategory(item.categoryName, item.categorySlug);

    // Build pack sizes array with individual prices and calculated discounts
    const sizes = item.packs.map((packName, idx) => {
      const price = item.selling_prices[idx] ?? item.selling_prices[0];
      const compareAtPrice = item.original_prices[idx] ?? price;
      const discountPct =
        compareAtPrice > price
          ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
          : 0;

      return {
        size: packName,
        stock: item.stocks[idx] ?? 10,
        price,
        compareAtPrice,
        discountPercentage: discountPct,
        sku: `ZPS-${String(i + 1).padStart(4, '0')}-${packName}`,
      };
    });

    const basePrice = Math.min(...item.selling_prices);
    const maxDiscount = Math.max(
      ...sizes.map((s) => s.discountPercentage || 0)
    );

    const sku = `ZPS-${String(i + 1).padStart(4, '0')}`;

    const newProduct = await Product.create({
      name: item.name,
      slug,
      sku,
      description: item.description,
      category: categoryId,
      productType: 'food',
      basePrice,
      discountPercentage: maxDiscount,
      images: [], // Explicitly empty array per specification
      rating: 0,
      reviewCount: 0,
      soldCount: 0,
      isBestSeller: Boolean(item.isBestSeller),
      isFeatured: Boolean(item.isBestSeller),
      isActive: true,
      isActiveSeller: true,
      attributes: {
        foodType: 'Veg',
        fssaiLicense: '12423008000451',
      },
      specs: [],
      variants: [
        {
          color: '',
          colorHex: '#000000',
          price: basePrice,
          compareAtPrice: Math.max(...item.original_prices),
          discountPercentage: maxDiscount,
          images: [], // Empty array
          sizes,
        },
      ],
    });

    console.log(`[CREATED] (${i + 1}/10) "${newProduct.name}" -> SKU: ${sku}, Slug: ${slug}`);
    createdCount++;
  }

  console.log(`\nSeed completed! Created: ${createdCount}, Skipped: ${skippedCount}. Total in catalog: ${createdCount + skippedCount}`);
  await mongoose.disconnect();
}

seedProducts().catch((err) => {
  console.error('Fatal seedProducts error:', err);
  process.exit(1);
});

