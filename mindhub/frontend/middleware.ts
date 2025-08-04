// import { withMiddlewareAuthRequired } from '@auth0/nextjs-auth0/edge';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function addSecurityHeaders(response: NextResponse) {
  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Healthcare compliance headers
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data:; " +
    "connect-src 'self' https://www.mindhub.cloud https://mindhub.cloud https://api.mindhub.com http://localhost:*"
  );
  
  return response;
}

async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Ensure manifest.json is served with correct content type
  if (request.nextUrl.pathname === '/manifest.json') {
    response.headers.set('Content-Type', 'application/manifest+json');
  }
  
  return addSecurityHeaders(response);
}

// export default withMiddlewareAuthRequired(middleware);
export default middleware;

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
    '/manifest.json',
    '/hubs/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/api/protected/:path*'
  ],
};