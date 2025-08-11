import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from 'next/server';

// Define which routes should be protected
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/hubs(.*)',
  '/profile(.*)',
  '/settings(.*)',
  '/api/protected(.*)'
]);

// Define public routes that don't require authentication  
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/public(.*)',
  '/api/health',
  '/api/expedix(.*)',
  '/api/clinimetrix(.*)',
  '/api/clinimetrix-pro(.*)',
  '/api/formx(.*)',
  '/api/agenda(.*)',
  '/api/resources(.*)',
  '/api/admin(.*)',
  '/api/test-backend(.*)',
  '/verify-email(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  const response = NextResponse.next();
  
  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Update CSP to include Clerk domains
  response.headers.set('Content-Security-Policy', 
    "default-src 'self' https://*.clerk.accounts.dev https://clerk.mindhub.cloud https://accounts.mindhub.cloud; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://clerk.mindhub.cloud; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: https://*.clerk.accounts.dev https://img.clerk.com https://clerk.mindhub.cloud; " +
    "connect-src 'self' https://*.clerk.accounts.dev https://clerk.mindhub.cloud https://accounts.mindhub.cloud https://mindhub.cloud https://www.mindhub.cloud https://api.mindhub.com https://mindhub-production.up.railway.app http://localhost:*; " +
    "frame-src 'self' https://*.clerk.accounts.dev https://accounts.mindhub.cloud; " +
    "worker-src 'self' blob:"
  );
  
  // Static files are handled outside middleware - no need for special handling
  
  // Check if route requires authentication
  if (isProtectedRoute(req)) {
    const { userId } = await auth();
    if (!userId) {
      return (await auth()).redirectToSignIn();
    }
  }
  
  return response;
});

export const config = {
  matcher: [
    // Match all routes except static files and API routes
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|robots.txt|.*\\.png|.*\\.svg).*)',
  ],
};