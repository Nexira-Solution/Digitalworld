import 'dotenv/config';
import mongoose from 'mongoose';
import Product from '../models/Product.js';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI not set');
  process.exit(1);
}

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // Update Kerala Banana Chips with exact rich dynamic fields
  await Product.updateOne(
    { slug: 'kerala-banana-chips' },
    {
      $set: {
        trustBadges: [
          { title: '100% Natural', subtitle: 'No Preservatives', icon: 'Leaf' },
          { title: 'Hygienically', subtitle: 'Prepared', icon: 'FlaskConical' },
          { title: 'Premium', subtitle: 'Quality Tested', icon: 'ShieldCheck' },
          { title: 'Authentic', subtitle: 'Kerala Recipe', icon: 'Award' },
          { title: 'Freshly', subtitle: 'Packed', icon: 'HandPlatter' },
        ],
        offers: [
          '40% Instant Discount (Limited Time)',
          'Extra 10% off on Prepaid Orders',
          'Free Delivery above ₹499',
          'Secure & Hygienic Packaging',
        ],
        deliveryInfo: {
          estimatedDays: 1,
          dispatchDays: 'Ready to Ship (Dispatches in 24h)',
          freeDeliveryAbove: 499,
        },
      },
    }
  );

  // Update all other products with dynamic trust badges, offers, and deliveryInfo
  const otherProducts = await Product.find({ slug: { $ne: 'kerala-banana-chips' } });
  for (const prod of otherProducts) {
    const isFood = prod.productType === 'food' || (prod.category && String(prod.category).length > 0);
    const badges = isFood
      ? [
          { title: '100% Natural', subtitle: 'No Preservatives', icon: 'Leaf' },
          { title: 'Hygienically', subtitle: 'Prepared', icon: 'FlaskConical' },
          { title: 'Premium', subtitle: 'Quality Tested', icon: 'ShieldCheck' },
          { title: 'Authentic', subtitle: 'Traditional Taste', icon: 'Award' },
          { title: 'Freshly', subtitle: 'Packed', icon: 'HandPlatter' },
        ]
      : [
          { title: '100% Authentic', subtitle: 'Pure Quality', icon: 'Leaf' },
          { title: 'Hygienically', subtitle: 'Packaged', icon: 'ShieldCheck' },
          { title: 'Premium Grade', subtitle: 'Quality Assured', icon: 'Award' },
          { title: 'Easy Returns', subtitle: '7 Days Policy', icon: 'CheckCircle2' },
          { title: 'Fast Dispatch', subtitle: 'Direct to Doorstep', icon: 'Truck' },
        ];

    const offers = [
      prod.discountPercentage > 0
        ? `${prod.discountPercentage}% Instant Discount (Limited Time)`
        : 'Special Price for Today',
      'Extra 10% off on Prepaid Orders',
      'Free Delivery above ₹499',
      'Secure & Hygienic Packaging',
    ];

    await Product.updateOne(
      { _id: prod._id },
      {
        $set: {
          trustBadges: prod.trustBadges && prod.trustBadges.length > 0 ? prod.trustBadges : badges,
          offers: prod.offers && prod.offers.length > 0 ? prod.offers : offers,
          deliveryInfo: {
            estimatedDays: prod.deliveryInfo?.estimatedDays || 2,
            dispatchDays: prod.isReadyToShip
              ? 'Ready to Ship (Dispatches in 24h)'
              : 'Dispatches in 1-2 Days',
            freeDeliveryAbove: 499,
          },
        },
      }
    );
  }

  console.log(`Updated ${otherProducts.length + 1} products with dynamic trustBadges, offers, and deliveryInfo.`);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

