'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Package, ListTree, ShoppingCart, Boxes, Image as ImageIcon,
  Clapperboard, Star, Ticket, Layers, FileBarChart, Settings as SettingsIcon,
  Menu, X, LogOut, Users, User, PackagePlus
} from 'lucide-react';

const INK = '#0F172A';
const INK_SOFT = '#64748B';
const GOLD = '#C9A227';
const GOLD_WASH = '#FAF7EE';
const LINE = '#E7E2D6';
const PAPER = '#FFFFFF';
const CANVAS = '#FBF8F2';

// Superadmin nav — full site control, under /admin/*
const ADMIN_NAV = [
  { href: '/admin',            label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/admin/sellers',    label: 'Sellers',       icon: Users },
  { href: '/admin/products',   label: 'Products',      icon: Package },
  { href: '/admin/categories', label: 'Categories',    icon: ListTree },
  { href: '/admin/orders',     label: 'Orders',        icon: ShoppingCart },
  { href: '/admin/inventory',  label: 'Inventory',     icon: Boxes },
  {
    href: '/admin/combos',
    label: 'Combo Offers',
    icon: Layers,
    children: [
      { href: '/admin/combos/new', label: 'Add Combo' },
      { href: '/admin/combos',     label: 'Manage Combos' },
    ],
  },
  { href: '/admin/banners',    label: 'Banners',       icon: ImageIcon },
  { href: '/admin/reviews',    label: 'Reviews',       icon: Star },
  { href: '/admin/settings',   label: 'Settings',      icon: SettingsIcon },
];

// Seller nav — scoped to their own business, under /seller/*
const SELLER_NAV = [
  { href: '/seller/dashboard', label: 'Overview',         icon: LayoutDashboard },
  { href: '/seller/products',  label: 'Products',         icon: Package },
  { href: '/seller/orders',    label: 'Orders',           icon: ShoppingCart },
  { href: '/seller/combos',    label: 'Combo Bundles',    icon: Layers },
  { href: '/seller/banners',   label: 'Add Store Banner', icon: ImageIcon },
  { href: '/seller/profile',   label: 'Business Profile', icon: User },
  { href: '/seller/settings',  label: 'Settings',         icon: SettingsIcon },
];

export default function AdminShell({ admin, navSet = 'admin', children }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const isSeller = navSet === 'seller';
  const nav = isSeller ? SELLER_NAV : ADMIN_NAV;
  const brandTitle = isSeller ? (admin?.businessName || 'Merchant Portal') : 'Mailoo Bazar';
  const panelLabel = isSeller ? 'Verified Seller' : 'Superadmin HQ';
  const homeHref = isSeller ? '/seller/dashboard' : '/admin';

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push(isSeller ? '/seller/login' : '/admin/login');
  }

  const storeInitial = (admin?.businessName || admin?.name || 'S').charAt(0).toUpperCase();

  return (
    <div className="min-h-screen flex bg-[#FAF9F5] text-[#0F172A]">
      {open && (
        <div
          className="fixed inset-0 z-40 lg:hidden bg-black/50 backdrop-blur-xs transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Luxury Sidebar */}
      <aside
        className={`fixed lg:static z-50 inset-y-0 left-0 w-64 bg-white border-r border-[#E7E2D6] flex flex-col justify-between transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          open ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand & Store Header */}
          <div className="px-5 py-4 border-b border-[#E7E2D6] flex items-center justify-between">
            <Link href={homeHref} className="flex items-center gap-3 group min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0F172A] to-[#1E293B] text-white flex items-center justify-center font-bold text-sm shadow-sm border border-[#C9A227]/40 shrink-0">
                {storeInitial}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-[14px] text-[#0F172A] truncate group-hover:text-[#C9A227] transition-colors leading-tight">
                  {brandTitle}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748B]">
                    {panelLabel}
                  </span>
                </div>
              </div>
            </Link>
            <button
              type="button"
              className="lg:hidden p-1.5 text-neutral-400 hover:text-black rounded-lg"
              onClick={() => setOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
            {nav.map(({ href, label, icon: Icon, children: subLinks }) => {
              const active = pathname === href || (href !== homeHref && (pathname === href || pathname.startsWith(href + '/')));
              const isComboMenu = label === 'Combo Offers';
              return (
                <div key={href} className="space-y-0.5">
                  <Link
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                      active
                        ? 'bg-[#0F172A] text-white shadow-xs'
                        : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#FAF7EE]'
                    }`}
                  >
                    <Icon
                      size={17}
                      className={active ? 'text-[#C9A227]' : 'text-neutral-400 group-hover:text-[#0F172A]'}
                    />
                    <span>{label}</span>
                    {active && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#C9A227]" />
                    )}
                  </Link>

                  {/* Submenu for Combo Offers (Add Combo, Manage Combos) */}
                  {Array.isArray(subLinks) && (active || pathname.startsWith(href)) && (
                    <div className="pl-8 pr-2 py-1 space-y-1">
                      {subLinks.map((sub) => {
                        const subActive = pathname === sub.href;
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            onClick={() => setOpen(false)}
                            className={`block px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
                              subActive
                                ? 'bg-[#C9A227]/15 text-[#C9A227] font-bold'
                                : 'text-[#64748B] hover:text-[#0F172A] hover:bg-neutral-100'
                            }`}
                          >
                            • {sub.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer with Seller Info & Logout */}
        <div className="p-3 border-t border-[#E7E2D6] bg-white space-y-2">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3.5 py-2 rounded-xl text-[11px] font-semibold text-[#64748B] hover:text-[#0F172A] hover:bg-[#FAF7EE] transition-colors"
          >
            <span>Live Storefront</span>
            <span className="text-[#C9A227] font-bold">↗</span>
          </Link>

          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold w-full text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile Top Navbar */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white border-b border-[#E7E2D6]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="p-1.5 text-[#0F172A] hover:bg-neutral-100 rounded-lg"
            >
              <Menu size={20} />
            </button>
            <span className="font-bold text-sm text-[#0F172A] truncate">
              {brandTitle}
            </span>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#FAF7EE] text-[#C9A227] border border-[#E7E2D6]">
            {panelLabel}
          </span>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}