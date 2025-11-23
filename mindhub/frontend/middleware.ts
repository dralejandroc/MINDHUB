import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rutas protegidas (solo deben vivir en glian.app)
const protectedRoutes = [
  '/dashboard',
  '/hubs',
  '/profile',
  '/settings',
  '/app',
]

// Rutas públicas (pueden vivir en glian.io)
const publicRoutes = [
  '/',
  '/auth/sign-in',
  '/auth/sign-up',
  '/auth/forgot-password',
  '/api/public',
  '/api/health',
]

function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some((route) => pathname.startsWith(route))
}

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route),
  )
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl
  const host = req.headers.get('host')?.split(':')[0] ?? ''

  // 1) Saltar todas las API (como ya lo tenías)
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // 2) Detectar dominios
  const isLandingDomain = host === 'glian.io' || host === 'www.glian.io'
  const isAppDomain = host === 'glian.app' || host === 'www.glian.app'

  // 3) Reglas de enrutamiento por dominio

  // 👉 En glian.io NO deberían estar las rutas protegidas; mándalas a glian.app
  if (isLandingDomain && isProtectedRoute(pathname)) {
    const url = new URL(`https://glian.app${pathname}${search}`)
    return NextResponse.redirect(url)
  }

  // 👉 En glian.io tampoco queremos manejar auth, mandamos todo /auth a glian.app
  if (isLandingDomain && pathname.startsWith('/auth')) {
    const url = new URL(`https://glian.app${pathname}${search}`)
    return NextResponse.redirect(url)
  }

  // ❌ IMPORTANTE: ya NO redirigimos /auth desde glian.app a glian.io
  // Antes tenías algo así:
  // if (isAppDomain && pathname.startsWith('/auth')) { ... glian.io ... }
  // Eso es lo que te generaba el loop → elimínalo.

  // (Opcional) En glian.app, si alguien entra a "/", lo mandamos al dashboard
  if (isAppDomain && pathname === '/') {
    const url = new URL('/dashboard', req.url)
    return NextResponse.redirect(url)
  }

  // A partir de aquí sigue tu código actual...
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  // 🔐 Security headers (igual que antes)
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-XSS-Protection', '1; mode=block')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains',
  )

  // 👉 OJO: aquí luego convendrá actualizar CSP a glian.io / glian.app
  res.headers.set(
    'Content-Security-Policy',
    "default-src 'self' https://*.supabase.co https://mindhub.cloud; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://mindhub.cloud; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "img-src 'self' data: https://*.supabase.co; " +
      "connect-src 'self' https://*.supabase.co https://jvbcpldzoyicefdtnwkd.supabase.co https://mindhub.cloud https://www.mindhub.cloud https://mindhub-django-backend.vercel.app https://*.vercel.app http://localhost:* ws://localhost:*; " +
      "frame-src 'self' https://*.supabase.co; " +
      "worker-src 'self' blob: 'unsafe-inline'",
  )

  // 5) Mantener el "TEMPORARY DISABLED" pero ya después de las reglas de dominio
  //    Si quieres volver a activar auth, comenta o borra este bloque.
  console.log(
    `🚨 [Middleware] AUTH TEMPORARILY DISABLED - allowing all routes (dominio: ${host}, path: ${pathname})`,
  )
  return res

  // ------------- Si quieres volver a activar auth, usa lo de abajo -------------
  // De aquí para abajo se ejecutaría sólo cuando quites el return de arriba.

  /*
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

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.warn('[Middleware] Supabase session error:', error)
    }

    console.log(`📊 [Middleware] Session check for ${pathname}:`, {
      hasSession: !!session,
      userId: session?.user?.id,
      isProtected: isProtectedRoute(pathname),
      isAuth: pathname.startsWith('/auth/'),
      domain: host,
    })

    // Solo aplicamos protección en el dominio de la app
    if (isAppDomain && isProtectedRoute(pathname)) {
      if (!session) {
        console.log(
          `🔒 [Middleware] Protected route ${pathname} requires auth, redirecting to sign-in`,
        )
        const redirectUrl = new URL('/auth/sign-in', 'https://glian.io')
        redirectUrl.searchParams.set('redirectTo', pathname)
        return NextResponse.redirect(redirectUrl)
      } else {
        console.log(
          `✅ [Middleware] Protected route ${pathname} - user authorized:`,
          session?.user?.id,
        )
      }
    }
  } catch (error) {
    console.warn('[Middleware] Auth check failed:', error)
  }

  return res
  */
}

export const config = {
  matcher: [
    // Igual que antes: todo menos estáticos / api
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|robots.txt|.*\\.png|.*\\.svg).*)',
  ],
}
