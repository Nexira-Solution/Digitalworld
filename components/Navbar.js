'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, ShoppingBag, Menu, X, ClipboardList, Heart, Store } from 'lucide-react';
import { useCart } from './CartContext';
import { useWishlist } from './WhishlistContext';
import CouponMarquee from './CouponMarquee';

const INK = '#000000';
const INK_SOFT = '#6B6B6B';
const GOLD = '#C9A227';
const LINE = '#E8E8E8';
const PAPER = '#FFFFFF';

// Gold text is hard to read on white, so hover/active states use a gold
// underline instead of a gold text color.
function underlineOn(el) {
  el.style.textDecoration = 'underline';
  el.style.textDecorationColor = GOLD;
  el.style.textUnderlineOffset = '4px';
}
function underlineOff(el) {
  el.style.textDecoration = 'none';
}

export default function Navbar() {
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const router = useRouter();
  const { count } = useCart();
  const { wishlist } = useWishlist();
  const wishlistCount = wishlist?.length || 0;

  // Lock background scroll while the full-screen mobile menu is open,
  // so the homepage doesn't scroll/run underneath it.
  useEffect(() => {
    if (menuOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [menuOpen]);

  function onSearch(e) {
    e.preventDefault();
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    setSearchOpen(false);
  }

  function closeMobileMenu() {
    setMenuOpen(false);
  }

  return (
    <>
      {/* <CouponMarquee /> */}

      <header className="sticky top-0 z-50" style={{ background: PAPER, borderBottom: `1px solid ${LINE}` }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-3 items-center">
            {/* Left: mobile toggle + primary links */}
            <div className="flex items-center gap-1 justify-self-start">
              <button
                className="md:hidden p-2 -ml-2"
                style={{ color: INK }}
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Menu"
              >
                {menuOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
              </button>

              <nav className="hidden md:flex items-center gap-8">
                <Link
                  href="/"
                  className="text-[13px] font-normal tracking-[1.5px] uppercase transition-colors"
                  style={{ color: INK }}
                >
                  Home
                </Link>

                <Link
                  href="/shop"
                  className="text-[13px] font-normal tracking-[1.5px] uppercase transition-colors"
                  style={{ color: INK }}
                  onMouseEnter={(e) => underlineOn(e.currentTarget)}
                  onMouseLeave={(e) => underlineOff(e.currentTarget)}
                >
                  Shop
                </Link>

                <Link
                  href="/orders"
                  className="text-[13px] font-normal tracking-[1.5px] uppercase transition-colors"
                  style={{ color: INK }}
                >
                  Orders
                </Link>

                <Link
                  href="/seller/login"
                  className="text-[13px] font-normal tracking-[1.5px] uppercase transition-colors"
                  style={{ color: INK }}
                  onMouseEnter={(e) => underlineOn(e.currentTarget)}
                  onMouseLeave={(e) => underlineOff(e.currentTarget)}
                >
                  Seller Login
                </Link>

                <Link
                  href="/seller/register"
                  className="text-[13px] font-normal tracking-[1.5px] uppercase transition-colors"
                  style={{ color: INK }}
                  onMouseEnter={(e) => underlineOn(e.currentTarget)}
                  onMouseLeave={(e) => underlineOff(e.currentTarget)}
                >
                  Sell With Us
                </Link>
              </nav>
            </div>

            {/* Center: logo (medium) */}
            <Link href="/" className="flex items-center justify-self-center">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24">
                <Image src="/logo.png" alt="Tirupur Clothing Hub" fill className="object-contain" priority />
              </div>
            </Link>

            {/* Right: search + wishlist + cart */}
            <div className="flex items-center gap-2.5 justify-self-end">
              <button
                className="flex items-center justify-center w-10 h-10 rounded-full transition-colors"
                style={{ color: INK, border: `1px solid ${LINE}` }}
                onClick={() => setSearchOpen((v) => !v)}
                aria-label="Search"
              >
                <Search size={16} strokeWidth={1.5} />
              </button>

              <Link
                href="/cart"
                className="relative flex items-center justify-center w-10 h-10 rounded-full transition-colors"
                style={{ color: INK, border: `1px solid ${LINE}` }}
                aria-label="Cart"
              >
                <ShoppingBag size={16} strokeWidth={1.5} />
                {count > 0 && (
                  <span
                    className="absolute -top-1 -right-1 text-[9px] font-semibold rounded-full w-[16px] h-[16px] flex items-center justify-center"
                    style={{ background: GOLD, color: INK }}
                  >
                    {count > 9 ? '9+' : count}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {searchOpen && (
            <form
              onSubmit={onSearch}
              className="flex items-center gap-2 py-3 mb-1"
              style={{ borderTop: `1px solid ${LINE}` }}
            >
              <Search size={15} strokeWidth={1.5} style={{ color: INK_SOFT }} />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search kurtis, nighties, innerwear..."
                className="bg-transparent outline-none w-full text-sm"
                style={{ color: INK }}
              />
            </form>
          )}
        </div>
      </header>

      {/* Mobile menu — full-screen overlay, not inline, so the homepage
          doesn't sit (or scroll) behind it while open. */}
      {menuOpen && (
        <div
          className="md:hidden fixed inset-0 z-[60] flex flex-col"
          style={{ background: PAPER }}
        >
          {/* Overlay header: logo + close button */}
          <div
            className="flex items-center justify-between px-6 py-3"
            style={{ borderBottom: `1px solid ${LINE}` }}
          >
            <div className="relative w-12 h-12">
              <Image src="/logo.png" alt="Tirupur Clothing Hub" fill className="object-contain" />
            </div>
            <button
              className="p-2 -mr-2"
              style={{ color: INK }}
              onClick={closeMobileMenu}
              aria-label="Close menu"
            >
              <X size={22} strokeWidth={1.5} />
            </button>
          </div>

          {/* Scrollable menu body — only this area scrolls, page behind stays fixed */}
          <nav className="flex-1 overflow-y-auto flex flex-col px-6 py-2">
            <Link
              href="/"
              onClick={closeMobileMenu}
              className="py-3.5 text-[14px] tracking-[1.5px] uppercase"
              style={{ color: INK, borderBottom: `1px solid ${LINE}` }}
            >
              Home
            </Link>

            <Link
              href="/shop"
              onClick={closeMobileMenu}
              className="py-3.5 text-[14px] tracking-[1.5px] uppercase"
              style={{ color: INK, borderBottom: `1px solid ${LINE}` }}
            >
              Shop
            </Link>

            <Link
              href="/orders"
              onClick={closeMobileMenu}
              className="flex items-center justify-between py-3.5 text-[14px] tracking-[1.5px] uppercase"
              style={{ color: INK, borderBottom: `1px solid ${LINE}` }}
            >
              <span className="flex items-center gap-2.5">
                <ClipboardList size={16} strokeWidth={1.5} />
                Orders
              </span>
            </Link>

            <Link
              href="/wishlist"
              onClick={closeMobileMenu}
              className="flex items-center justify-between py-3.5 text-[14px] tracking-[1.5px] uppercase"
              style={{ color: INK, borderBottom: `1px solid ${LINE}` }}
            >
              <span className="flex items-center gap-2.5">
                <Heart size={16} strokeWidth={1.5} />
                Wishlist
              </span>
              {wishlistCount > 0 && (
                <span
                  className="text-[10px] font-semibold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1"
                  style={{ background: GOLD, color: INK }}
                >
                  {wishlistCount > 9 ? '9+' : wishlistCount}
                </span>
              )}
            </Link>

            <Link
              href="/cart"
              onClick={closeMobileMenu}
              className="flex items-center justify-between py-3.5 text-[14px] tracking-[1.5px] uppercase"
              style={{ color: INK, borderBottom: `1px solid ${LINE}` }}
            >
              <span className="flex items-center gap-2.5">
                <ShoppingBag size={16} strokeWidth={1.5} />
                Cart
              </span>
              {count > 0 && (
                <span
                  className="text-[10px] font-semibold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1"
                  style={{ background: GOLD, color: INK }}
                >
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </Link>

            <Link
              href="/seller/login"
              onClick={closeMobileMenu}
              className="flex items-center justify-between py-3.5 text-[14px] tracking-[1.5px] uppercase"
              style={{ color: INK, borderBottom: `1px solid ${LINE}` }}
            >
              <span className="flex items-center gap-2.5">
                <Store size={16} strokeWidth={1.5} />
                Seller Login
              </span>
            </Link>

            <Link
              href="/seller/register"
              onClick={closeMobileMenu}
              className="flex items-center justify-between py-3.5 text-[14px] tracking-[1.5px] uppercase"
              style={{ color: INK, borderBottom: `1px solid ${LINE}` }}
            >
              <span className="flex items-center gap-2.5">Sell With Us</span>
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}