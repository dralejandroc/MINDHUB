import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Toaster } from 'react-hot-toast';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { AuthProvider } from '@/lib/providers/AuthProvider';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { GraphQLProvider } from '@/lib/apollo/provider';
import StartupCleanup from '@/components/StartupCleanup';
import { OnboardingProvider } from '@/components/onboarding/OnboardingProvider';
import { KeyboardShortcutsProvider } from '@/components/ui/KeyboardShortcutsHelp';
import './globals.css';
import '@/styles/themes.css';

// Glian Brand Font - Hanken Grotesk
const hankenGrotesk = localFont({
  src: [
    {
      path: '../public/fonts/HankenGrotesk-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/HankenGrotesk-SemiBold.ttf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../public/fonts/HankenGrotesk-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-hanken-grotesk',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Glian - Plataforma de Gestión Clínica para Profesionales de Salud Mental',
  description: 'Suite completa para profesionales de salud mental con herramientas de evaluación clínica, gestión de pacientes, formularios personalizados y biblioteca de recursos.',
  keywords: [
    'salud mental',
    'psiquiatría',
    'psicología',
    'evaluación clínica',
    'gestión de pacientes',
    'expedientes médicos',
    'formularios clínicos',
    'recursos psicoeducativos',
    'glian'
  ],
  authors: [{ name: 'Glian Team' }],
  creator: 'Glian',
  publisher: 'Glian',
  robots: {
    index: false, // Healthcare platform should not be indexed
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'es_MX',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://glian.app',
    siteName: 'Glian',
    title: 'Glian - Plataforma de Gestión Clínica',
    description: 'Suite completa para profesionales de salud mental',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Glian Healthcare Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Glian - Plataforma de Gestión Clínica',
    description: 'Suite completa para profesionales de salud mental',
    images: ['/twitter-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${hankenGrotesk.variable} font-sans`}>
        <head>
          {/* Security headers */}
          <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
          {/* X-Frame-Options should be set via HTTP header, not meta tag */}
          {/* XSS Protection should be set via HTTP header */}
          <meta name="referrer" content="strict-origin-when-cross-origin" />

          {/* Healthcare compliance */}
          <meta name="robots" content="noindex, nofollow" />
          <meta name="googlebot" content="noindex, nofollow" />

          {/* PWA support - Glian Brand Colors */}
          <meta name="theme-color" content="#0991b2" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="Glian" />
          
          {/* Explicit manifest link to prevent www domain issues */}
          <link rel="manifest" href="/manifest.json" />
          
          {/* Preconnect to external services - Google Fonts temporarily disabled */}
          
          {/* Error handling for browser extensions */}
          <script dangerouslySetInnerHTML={{
            __html: `
              // Handle browser extension listener errors
              if (typeof window !== 'undefined') {
                window.addEventListener('error', function(e) {
                  if (e.message && e.message.includes('listener indicated an asynchronous response')) {
                    e.preventDefault();
                    return false;
                  }
                });
                
                // Suppress console warnings from extensions
                const originalConsoleWarn = console.warn;
                console.warn = function(...args) {
                  const message = args.join(' ');
                  if (message.includes('listener indicated an asynchronous response') || 
                      message.includes('message channel closed')) {
                    return;
                  }
                  originalConsoleWarn.apply(console, args);
                };
              }
            `
          }} />
        </head>
        <body className="bg-theme-primary text-theme-primary antialiased">
          {/* Skip navigation for keyboard users */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
                       focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white 
                       focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 
                       focus:ring-primary-500 focus:ring-offset-2"
          >
            Saltar al contenido principal
          </a>
          
          <StartupCleanup />
          <ThemeProvider>
            <AuthProvider>
              <GraphQLProvider>
                <KeyboardShortcutsProvider>
                  <OnboardingProvider>
                    <div id="root" className="min-h-screen bg-theme-primary text-theme-primary">
                      <main id="main-content" tabIndex={-1} className="focus:outline-none">
                        {children}
                      </main>
                    </div>
                  </OnboardingProvider>
                </KeyboardShortcutsProvider>
              </GraphQLProvider>
            </AuthProvider>
          </ThemeProvider>
        
        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 5000,
            className: 'bg-theme-card text-theme-primary border-theme-primary',
            style: {
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
            },
            success: {
              iconTheme: {
                primary: '#22c55e',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        
        {/* Accessibility announcements */}
        <div
          id="announcements"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        />
        
        {/* Loading indicator for screen readers */}
        <div
          id="loading-indicator"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        />
        
        {/* Vercel Speed Insights */}
        <SpeedInsights />
        
        {/* PWA Service Worker Registration - TEMPORARILY DISABLED FOR TESTING */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Service Worker temporarily disabled to test redirect issues
              console.log('[PWA] Service Worker registration temporarily disabled for debugging');
              console.log('🔧 [SIMPLE] Nuclear auth checker removed - relying on login page redirect only');
            `,
          }}
        />
        
          {/* Feedback Button - Available on all pages */}
          <div id="feedback-portal" />
        </body>
      </html>
  );
}