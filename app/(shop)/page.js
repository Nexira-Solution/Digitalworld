export const dynamic = 'force-dynamic';
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/mongodb';
import Admin from '@/models/Admin';
import Banner from '@/models/Banner';
import Product from '@/models/Product';
import Review from '@/models/Review';
import Combo from '@/models/Combo';
import Category from '@/models/Category';
import BannerCarousel from '@/components/BannerCarousel';
import ProductCard from '@/components/ProductCard';
import ReviewSection from '@/components/ReviewSection';

import Link from 'next/link';
import { formatINR } from '@/lib/utils';
import { ArrowRight, Tag, X } from 'lucide-react';

// Design tokens — shared black / white / orange theme
const INK = '#000000';
const INK_SOFT = '#6B6B6B';
const ORANGE = '#F97316';
const ORANGE_DARK = '#EA580C';
const ORANGE_WASH = '#FFF1E6';
const HAIRLINE = '#E8E8E8';
const FONT_SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const FEATURED_LIMIT = 6;
const SELLER_PRODUCT_LIMIT = 24;

const LIVE_BANNER = { isActive: true, approval: { $nin: ['pending', 'rejected'] } };

async function getData(sellerParam) {
  await dbConnect();

  // Seller view: only for a valid id that belongs to an approved seller.
  // Only name fields are selected, so no email/phone/GST reaches the public page.
  let selected = null;
  if (sellerParam && mongoose.isValidObjectId(sellerParam)) {
    selected = await Admin.findOne({ _id: sellerParam, role: 'seller', status: 'approved' })
      .select('name businessName')
      .lean();
  }

  if (selected) {
    const [banners, products, combos] = await Promise.all([
      Banner.find({ ...LIVE_BANNER, seller: selected._id }).sort({ sortOrder: 1 }).lean(),
      Product.find({ isActive: true, seller: selected._id }).sort({ createdAt: -1 }).limit(SELLER_PRODUCT_LIMIT).lean(),
      // Assumes Combo stores its owner in `seller`; change the field name if it differs
      Combo.find({ isActive: true, seller: selected._id }).limit(6).lean(),
    ]);
    return { selected, banners, products, combos, categories: [], reviews: [] };
  }

  const [banners, products, reviews, combos, categories] = await Promise.all([
    Banner.find(LIVE_BANNER).sort({ sortOrder: 1 }).lean(),
    Product.find({ isActive: true, isActiveSeller: true }).sort({ createdAt: -1 }).limit(FEATURED_LIMIT).lean(),
    Review.find({ isApproved: true, isFeatured: true }).populate('product', 'name').limit(10).lean(),
    Combo.find({ isActive: true }).limit(6).lean(),
    Category.find({ isActive: true, parent: null }).limit(10).lean(),
  ]);
  return { selected: null, banners, products, combos, categories, reviews };
}

export default async function HomePage({ searchParams }) {
  const sp = (await searchParams) || {};
  const { selected, banners, products, combos, categories, reviews } = await getData(sp.seller);

  const plainBanners = JSON.parse(JSON.stringify(banners));
  const plainProducts = JSON.parse(JSON.stringify(products));
  const plainCombos = JSON.parse(JSON.stringify(combos));
  const plainCategories = JSON.parse(JSON.stringify(categories));
  const plainReviews = JSON.parse(JSON.stringify(reviews));

  const sellerLabel = (s) => s.businessName || s.name || 'Seller';

  return (
    <div className="overflow-x-hidden bg-white">
      {/* Banner (seller's own banners in seller view) */}
      <BannerCarousel banners={plainBanners} />

      {selected ? (
        <>
          {/* ===================== SELLER VIEW ===================== */}
          <section className="max-w-6xl mx-auto px-4 pt-8 text-center">
            <span
              className="inline-block text-[11px] font-bold uppercase tracking-[3px] px-3 py-1"
              style={{ color: '#FFFFFF', background: ORANGE, fontFamily: FONT_SANS }}
            >
              Seller
            </span>
            <h1
              className="mt-3 text-xl sm:text-2xl font-bold tracking-[3px] uppercase"
              style={{ color: INK, fontFamily: FONT_SANS }}
            >
              {sellerLabel(selected)}
            </h1>
            <Link
              href="/"
              className="inline-flex items-center gap-1 mt-3 text-xs font-medium underline"
              style={{ color: INK_SOFT, fontFamily: FONT_SANS }}
            >
              <X size={12} /> Back to all products
            </Link>
          </section>

          {plainCombos.length > 0 && (
            <section className="pt-12">
              <ComboGrid combos={plainCombos} title="Combo Offers" />
            </section>
          )}

          <section className="max-w-6xl mx-auto px-4 pt-10 pb-16 text-center">
            <h2
              className="text-lg sm:text-xl font-bold tracking-[3px] uppercase"
              style={{ color: INK, fontFamily: FONT_SANS }}
            >
              Products
            </h2>

            {plainProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8 mt-8 text-left">
                {plainProducts.map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>
            ) : (
              <p className="mt-6 text-sm" style={{ color: INK_SOFT, fontFamily: FONT_SANS }}>
                This seller has no products right now.
              </p>
            )}
          </section>
        </>
      ) : (
        <>
          {/* ===================== NORMAL HOMEPAGE ===================== */}
          {plainCategories.length > 0 && (
            <section className="max-w-6xl mx-auto px-4 pt-14 pb-6">
              <h1
                className="text-xl sm:text-2xl font-bold tracking-[3px] uppercase mb-6 text-center"
                style={{ color: INK, fontFamily: FONT_SANS }}
              >
                Shop by Category
              </h1>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 sm:gap-6">
                {plainCategories.map((c) => (
                  <Link
                    key={c._id}
                    href={`/category/${c.slug}`}
                    className="group flex flex-col items-center text-center"
                  >
                    <div
                      className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full overflow-hidden bg-neutral-50 transition-transform duration-300 group-hover:scale-105"
                      style={{ border: `1px solid ${ORANGE}` }}
                    >
                      {c.image ? (
                        <img src={c.image} alt={c.name} className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full" style={{ background: ORANGE_WASH }} />
                      )}
                    </div>
                    <span
                      className="mt-2 text-[10.5px] sm:text-[11px] font-bold tracking-wide leading-tight line-clamp-2 max-w-[80px]"
                      style={{ color: INK, fontFamily: FONT_SANS }}
                    >
                      {c.name}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {plainCombos.length > 0 && (
            <section className="py-16 bg-white border-t" style={{ borderColor: HAIRLINE }}>
              <ComboGrid combos={plainCombos} title="Combo Offers" showHeader />
            </section>
          )}

          <section className="max-w-6xl mx-auto px-4 pt-8 sm:pt-10 pb-16 text-center">
            <h3
              className="text-lg sm:text-xl font-bold tracking-[3px] uppercase"
              style={{ color: INK, fontFamily: FONT_SANS }}
            >
              Featured Collection
            </h3>

            {plainProducts.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8 mt-8 text-left">
                {plainProducts.map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>
            )}

            <Link
              href="/products"
              className="inline-block mt-10 px-8 py-3 text-[12px] font-bold tracking-[2px] uppercase transition-colors bg-[#F97316] text-white border border-[#F97316] hover:bg-[#EA580C] hover:border-[#EA580C]"
              style={{ fontFamily: FONT_SANS }}
            >
              Shop the collection
            </Link>
          </section>

          <ReviewSection reviews={plainReviews} />
        </>
      )}
    </div>
  );
}

// Shared combo grid, used by both the normal homepage and the seller view
function ComboGrid({ combos, title, showHeader = false }) {
  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="flex flex-col items-center text-center mb-8">
        {showHeader && (
          <span
            className="text-[11px] font-bold uppercase tracking-[3px] mb-3 px-3 py-1"
            style={{ color: '#FFFFFF', background: ORANGE, fontFamily: FONT_SANS }}
          >
            Save More
          </span>
        )}
        <h2 className="text-xl sm:text-2xl font-bold tracking-[1px]" style={{ color: INK, fontFamily: FONT_SANS }}>
          {title}
        </h2>
        <p className="text-sm mt-1 font-light" style={{ color: INK_SOFT, fontFamily: FONT_SANS }}>
          Buy together, save together
        </p>
        <Link
          href="/combo"
          className="flex items-center gap-1 text-sm font-bold hover:gap-2 transition-all mt-3"
          style={{ color: INK, fontFamily: FONT_SANS }}
        >
          View all <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5">
        {combos.map((c) => {
          const isColorPack = c.type === 'color-pack';
          const cheapestPack =
            isColorPack && c.packOptions?.length
              ? c.packOptions.reduce((min, p) => (p.price < min.price ? p : min), c.packOptions[0])
              : null;

          const cover = c.images?.[0] || c.image;

          const displayPrice = isColorPack ? cheapestPack?.price ?? 0 : c.comboPrice;
          const displayOriginal = isColorPack ? cheapestPack?.originalPrice ?? 0 : c.originalPrice;
          const savings = displayOriginal > displayPrice ? displayOriginal - displayPrice : 0;
          const pct = displayOriginal > 0 ? Math.round((savings / displayOriginal) * 100) : 0;

          return (
            <Link
              key={c._id}
              href={`/combo/${c.slug}`}
              className="group relative overflow-hidden bg-white transition-colors"
              style={{ border: `1px solid ${HAIRLINE}` }}
            >
              <div className="relative w-full aspect-square overflow-hidden bg-neutral-50">
                {cover ? (
                  <img
                    src={cover}
                    alt={c.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full" style={{ background: ORANGE_WASH }} />
                )}
                {pct > 0 && (
                  <div
                    className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 flex items-center gap-1"
                    style={{ color: '#FFFFFF', background: ORANGE, fontFamily: FONT_SANS }}
                  >
                    <Tag size={9} /> {pct}% off
                  </div>
                )}
                {isColorPack && (
                  <div
                    className="absolute top-2 right-2 text-[10px] font-medium px-2 py-0.5"
                    style={{ background: INK, color: '#fff' }}
                  >
                    Color Pack
                  </div>
                )}
              </div>

              <div className="p-3" style={{ borderTop: `1px solid ${HAIRLINE}` }}>
                <p className="text-[13px] font-bold tracking-wide line-clamp-1" style={{ color: INK, fontFamily: FONT_SANS }}>
                  {c.name}
                </p>
                <div className="flex items-baseline gap-2 mt-1.5">
                  <span className="font-bold text-sm" style={{ color: INK, fontFamily: FONT_SANS }}>
                    {isColorPack && 'From '}{formatINR(displayPrice)}
                  </span>
                  {savings > 0 && (
                    <span className="text-[11px] line-through font-light" style={{ color: INK_SOFT, fontFamily: FONT_SANS }}>
                      {formatINR(displayOriginal)}
                    </span>
                  )}
                </div>
                {savings > 0 && (
                  <p
                    className="text-[10.5px] font-bold mt-1 tracking-wide uppercase"
                    style={{ color: ORANGE_DARK, fontFamily: FONT_SANS }}
                  >
                    Save {formatINR(savings)}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}