import type { Metadata } from 'next';
// import { Inter } from 'next/font/google'; // Temporalmente deshabilitado para evitar problemas de conectividad
import { Toaster } from 'react-hot-toast';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { AuthProvider } from '@/lib/providers/AuthProvider';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { GraphQLProvider } from '@/lib/apollo/provider';
import StartupCleanup from '@/components/StartupCleanup';
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
    <html lang="en" className="font-sans">
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
        </head>
        <body className="bg-theme-primary text-theme-primary antialiased">
          <StartupCleanup />
          <ThemeProvider>
            <AuthProvider>
              <GraphQLProvider>
                <div id="root" className="min-h-screen bg-theme-primary text-theme-primary">
                  {children}
                </div>
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
        
        {/* PWA Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator && typeof window !== 'undefined') {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js', { scope: '/' })
                    .then(function(registration) {
                      console.log('[PWA] Service Worker registered successfully:', registration.scope);
                    })
                    .catch(function(error) {
                      console.log('[PWA] Service Worker registration failed:', error);
                    });
                });
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