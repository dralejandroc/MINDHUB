import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define which routes should be protected
const protectedRoutes = [
  '/dashboard',
  '/hubs',
  '/profile',
  '/settings',
  '/app'
]

// Define public routes that don't require authentication  
const publicRoutes = [
  '/',
  '/auth/sign-in',
  '/auth/sign-up',
  '/auth/forgot-password',
  '/api/public',
  '/api/health'
]

function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some(route => pathname.startsWith(route))
}

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => pathname === route || pathname.startsWith(route))
}

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          res.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          res.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )
  
  // Add security headers
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-XSS-Protection', '1; mode=block')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  
  // Update CSP to include Supabase domains
  res.headers.set('Content-Security-Policy', 
    "default-src 'self' https://*.supabase.co https://mindhub.cloud; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://mindhub.cloud; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: https://*.supabase.co; " +
    "connect-src 'self' https://*.supabase.co https://jvbcpldzoyicefdtnwkd.supabase.co https://mindhub.cloud https://www.mindhub.cloud https://mindhub-production.up.railway.app http://localhost:* ws://localhost:*; " +
    "frame-src 'self' https://*.supabase.co; " +
    "worker-src 'self' blob: 'unsafe-inline'"
  )
  
  // Get the session
  const { data: { session } } = await supabase.auth.getSession()
  
  // Check if route requires authentication
  if (isProtectedRoute(req.nextUrl.pathname)) {
    if (!session) {
      // Redirect to sign-in if not authenticated
      const redirectUrl = new URL('/auth/sign-in', req.url)
      redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }
  
  // If user is logged in and trying to access auth pages, redirect to app
  if (session && req.nextUrl.pathname.startsWith('/auth/')) {
    return NextResponse.redirect(new URL('/app', req.url))
  }
  
  return res
}

export const config = {
  matcher: [
    // Match all routes except static files and API routes
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|robots.txt|.*\\.png|.*\\.svg).*)',
  ],
};