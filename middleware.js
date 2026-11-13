import { NextResponse } from 'next/server';

const COOKIE_NAME = 'lb_admin_token';
const PUBLIC_PATHS = ['/admin/login', '/seller/login', '/seller/register', '/seller/pending'];

// Lightweight cookie-presence check only (Edge runtime, no crypto).
// Full JWT verification happens in the layouts (Node runtime).
export function middleware(req) {
  const { pathname } = req.nextUrl;
  const cleanPath = pathname.toLowerCase().replace(/\/+$/, '') || '/';

  if (PUBLIC_PATHS.some((p) => cleanPath === p || cleanPath.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    const loginPath = cleanPath.startsWith('/seller') ? '/seller/login' : '/admin/login';
    if (cleanPath === loginPath) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL(loginPath, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/seller/:path*'],
};