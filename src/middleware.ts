import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// In-memory session store reference (same as in auth.js)
// Note: In production, use Redis or database for session storage
const SESSION_COOKIE_NAME = 'session_token';

// Public routes that don't require authentication
const publicRoutes = ['/login', '/signup'];

// Admin-only routes
const adminRoutes = ['/admin'];

// User-only routes
const userRoutes = ['/user'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  
  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
  const isUserRoute = userRoutes.some(route => pathname.startsWith(route));
  
  // If it's a public route, allow access
  if (isPublicRoute) {
    // If user is already authenticated, redirect to appropriate dashboard
    if (sessionToken) {
      // We can't easily check role here without making the middleware async with DB calls
      // So we'll let the pages handle the redirect
      return NextResponse.next();
    }
    return NextResponse.next();
  }
  
  // For protected routes, check if user is authenticated
  if (!sessionToken && (isAdminRoute || isUserRoute)) {
    // Redirect to login if not authenticated
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // If accessing root, redirect to login
  if (pathname === '/') {
    if (sessionToken) {
      // Will be handled by the page component
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
