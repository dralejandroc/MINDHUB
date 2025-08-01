import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';
// import { UserProvider } from '@auth0/nextjs-auth0/client';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

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
    <html lang="en" className={inter.variable}>
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
        
        {/* Preconnect to external services */}
        <link rel="preconnect" href={`https://${process.env.AUTH0_DOMAIN}`} />
        <link rel="dns-prefetch" href={`https://${process.env.AUTH0_DOMAIN}`} />
      </head>
      <body className="bg-gray-50 antialiased">
        {/* <UserProvider> */}
                <div id="root" className="min-h-screen">
                  {children}
                </div>
              
              {/* Toast notifications */}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 5000,
                  style: {
                    background: '#fff',
                    color: '#374151',
                    border: '1px solid #e5e7eb',
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
        {/* </UserProvider> */}
      </body>
    </html>
  );
}