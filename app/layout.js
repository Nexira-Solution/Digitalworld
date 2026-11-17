import './globals.css';
import { Toaster } from 'react-hot-toast';
import { CartProvider } from '@/components/CartContext';
import { WishlistProvider } from '@/components/WhishlistContext';
import { dbConnect } from '@/lib/mongodb';
import Settings from '@/models/Settings';

export async function generateMetadata() {
  let settings = null;
  try {
    await dbConnect();
    settings = await Settings.findOne({ key: 'global' });
  } catch {
    settings = null;
  }
  const title = settings?.seoTitle || 'MailooBazar';
  const description =
    settings?.seoDescription ||
    'Shop authentic snacks online from MailooBazar.';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mailoobazar.com';
  return {
    title: { default: title, template: '%s | MailooBazar' },
    description,
    metadataBase: new URL(siteUrl),
    keywords: ['women kurtis online', 'nighties online', 'innerwear online', 'MailooBazar', 'women fashion'],
    openGraph: { title, description, siteName: 'MailooBazar', type: 'website' },
    icons: { icon: '/favicon.ico' },
  };
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="font-sans antialiased"
        style={{ background: '#FAFAFA', color: '#000000', fontFamily: 'var(--font-outfit), Outfit, sans-serif' }}
      >
        <CartProvider>
          <WishlistProvider>
            {children}

            {/* spacer so page content isn't hidden behind the fixed mobile nav */}
            <div className="md:hidden h-16" />
          </WishlistProvider>
        </CartProvider>

        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              fontFamily: 'var(--font-outfit), Outfit, sans-serif',
              background: '#FFFFFF',
              color: '#000000',
              border: '1px solid #E8E8E8',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: '600',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            },
            success: {
              iconTheme: {
                primary: '#C9A227',
                secondary: '#FFFFFF',
              },
            },
            error: {
              iconTheme: {
                primary: '#C9A84C',
                secondary: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
