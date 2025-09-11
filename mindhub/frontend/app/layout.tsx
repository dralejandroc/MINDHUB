import type { Metadata } from 'next';
// import { Inter } from 'next/font/google'; // Temporalmente deshabilitado para evitar problemas de conectividad
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

// const inter = Inter({ subsets: ['latin'], variable: '--font-inter' }); // Temporalmente deshabilitado

export const metadata: Metadata = {
  title: 'MindHub - Healthcare Platform for Mental Health Professionals',
  description: 'Comprehensive SaaS platform for psychiatrists and psychologists with clinical assessment tools, patient management, form builder, and resource library.',
  keywords: [
    'healthcare',
    'mental health',
    'psychiatry',
    'psychology',
    'clinical assessment',
    'patient management',
    'medical records',
    'clinical forms',
    'psychoeducational resources'
  ],
  authors: [{ name: 'MindHub Team' }],
  creator: 'MindHub',
  publisher: 'MindHub',
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
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://mindhub.com',
    siteName: 'MindHub',
    title: 'MindHub - Healthcare Platform for Mental Health Professionals',
    description: 'Comprehensive SaaS platform for psychiatrists and psychologists',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'MindHub Healthcare Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MindHub - Healthcare Platform',
    description: 'Comprehensive SaaS platform for mental health professionals',
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
    <html lang="es" className="font-sans">
        <head>
          {/* Security headers */}
          <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
          {/* X-Frame-Options should be set via HTTP header, not meta tag */}
          {/* XSS Protection should be set via HTTP header */}
          <meta name="referrer" content="strict-origin-when-cross-origin" />
          
          {/* Healthcare compliance */}
          <meta name="robots" content="noindex, nofollow" />
          <meta name="googlebot" content="noindex, nofollow" />
          
          {/* PWA support */}
          <meta name="theme-color" content="#0ea5e9" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="MindHub" />
          
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
              
              // NUCLEAR OPTION: Global auth checker that runs independently
              console.log('🚨 [NUCLEAR] Starting global auth checker');
              
              let authCheckInterval;
              let authCheckAttempts = 0;
              const maxAuthCheckAttempts = 60; // 1 minute of checking
              
              function startGlobalAuthCheck() {
                if (authCheckInterval) {
                  clearInterval(authCheckInterval);
                }
                
                authCheckInterval = setInterval(async function() {
                  authCheckAttempts++;
                  
                  // Only check if we're on auth pages
                  if (!window.location.pathname.startsWith('/auth/')) {
                    console.log('🚨 [NUCLEAR] Not on auth page, stopping checker');
                    clearInterval(authCheckInterval);
                    return;
                  }
                  
                  if (authCheckAttempts > maxAuthCheckAttempts) {
                    console.log('🚨 [NUCLEAR] Max attempts reached, stopping checker');
                    clearInterval(authCheckInterval);
                    return;
                  }
                  
                  console.log(\`🚨 [NUCLEAR] Auth check attempt \${authCheckAttempts}/\${maxAuthCheckAttempts}\`);
                  
                  try {
                    // Get all cookies and LOG THEM to see what's actually there
                    const cookies = document.cookie;
                    console.log('🚨 [NUCLEAR] All cookies:', cookies);
                    
                    // Check for various possible auth cookie names
                    const hasAuthCookie = cookies.includes('sb-jvbcpldzoyicefdtnwkd-auth-token') || 
                                        cookies.includes('supabase-auth-token') || 
                                        cookies.includes('sb-access-token') ||
                                        cookies.includes('access-token') ||
                                        cookies.includes('refresh-token') ||
                                        cookies.includes('auth-token');
                    
                    if (hasAuthCookie) {
                      console.log('🚨 [NUCLEAR] Auth cookie detected! FORCING REDIRECT NOW!');
                      
                      const urlParams = new URLSearchParams(window.location.search);
                      const redirectTo = urlParams.get('redirectTo') || '/app';
                      
                      console.log('🚨 [NUCLEAR] REDIRECTING TO:', redirectTo);
                      
                      clearInterval(authCheckInterval);
                      
                      // FORCE REDIRECT WITH MULTIPLE METHODS
                      window.location.href = redirectTo;
                      
                      setTimeout(() => {
                        if (window.location.pathname.startsWith('/auth/')) {
                          console.log('🚨 [NUCLEAR] First redirect failed, trying assign');
                          window.location.assign(redirectTo);
                        }
                      }, 100);
                      
                      setTimeout(() => {
                        if (window.location.pathname.startsWith('/auth/')) {
                          console.log('🚨 [NUCLEAR] Second redirect failed, trying replace');
                          window.location.replace(redirectTo);
                        }
                      }, 300);
                      
                      return;
                    }
                    
                    // Stop after 10 attempts to avoid infinite loop while we debug
                    if (authCheckAttempts >= 10) {
                      console.log('🚨 [NUCLEAR] Stopping after 10 attempts for debugging');
                      clearInterval(authCheckInterval);
                      return;
                    }
                    
                    console.log('🚨 [NUCLEAR] No auth cookie yet, continuing...');
                    
                  } catch (error) {
                    console.error('🚨 [NUCLEAR] Error in auth check:', error);
                  }
                }, 500); // Check every 500ms
              }
              
              // Start the checker when page loads
              if (typeof window !== 'undefined') {
                window.addEventListener('load', function() {
                  console.log('🚨 [NUCLEAR] Page loaded, starting auth checker');
                  startGlobalAuthCheck();
                });
                
                // Also start immediately if already loaded
                if (document.readyState === 'complete') {
                  console.log('🚨 [NUCLEAR] Page already loaded, starting auth checker immediately');
                  startGlobalAuthCheck();
                }
              }
            `,
          }}
        />
        
          {/* Feedback Button - Available on all pages */}
          <div id="feedback-portal" />
        </body>
      </html>
  );
}