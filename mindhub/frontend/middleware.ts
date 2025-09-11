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
  // CRITICAL: Skip ALL API routes - they handle their own auth
  if (req.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }
  
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })
  
  // Add security headers for non-API routes
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
    "connect-src 'self' https://*.supabase.co https://jvbcpldzoyicefdtnwkd.supabase.co https://mindhub.cloud https://www.mindhub.cloud https://mindhub-django-backend.vercel.app https://*.vercel.app http://localhost:* ws://localhost:*; " +
    "frame-src 'self' https://*.supabase.co; " +
    "worker-src 'self' blob: 'unsafe-inline'"
  )

  // Only handle auth for page routes, not API routes
  try {
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
    
    // Get the session with error handling
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.warn('[Middleware] Supabase session error:', error)
      // Continue without session if there's an error
    }
    
    console.log(`📊 [Middleware] Session check for ${req.nextUrl.pathname}:`, {
      hasSession: !!session,
      userId: session?.user?.id,
      isProtected: isProtectedRoute(req.nextUrl.pathname),
      isAuth: req.nextUrl.pathname.startsWith('/auth/')
    })
    
    // Check if route requires authentication
    if (isProtectedRoute(req.nextUrl.pathname)) {
      if (!session) {
        // Redirect to sign-in if not authenticated
        console.log(`🔒 [Middleware] Protected route ${req.nextUrl.pathname} requires auth, redirecting to sign-in`)
        const redirectUrl = new URL('/auth/sign-in', req.url)
        redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
        return NextResponse.redirect(redirectUrl)
      }
    }
    
    // If user is logged in and trying to access auth pages, redirect to app
    if (session && req.nextUrl.pathname.startsWith('/auth/')) {
      console.log('🔄 [Middleware] Authenticated user accessing auth page, redirecting to /app')
      return NextResponse.redirect(new URL('/app', req.url))
    }
    
  } catch (error) {
    console.warn('[Middleware] Auth check failed:', error)
    // Continue with request even if auth fails
  }
  
  return res
}

export const config = {
  matcher: [
    // Match all routes except static files and API routes
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|robots.txt|.*\\.png|.*\\.svg).*)',
  ],
};