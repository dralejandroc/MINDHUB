'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  HeartIcon, 
  UserGroupIcon, 
  ClipboardDocumentListIcon, 
  BookOpenIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  SparklesIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function HomePage() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Redirect authenticated users to their dashboard
    if (user && !isLoading) {
      router.push('/hubs');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="relative bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <HeartIcon className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-2xl font-bold text-gray-900">
                MindHub
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                href="/api/auth/login"
                className="btn-primary inline-flex items-center"
              >
                Sign In
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Healthcare Platform for
            <span className="text-primary-600 block">
              Mental Health Professionals
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Comprehensive SaaS platform designed exclusively for psychiatrists and psychologists. 
            Streamline clinical assessments, manage patient records, build custom forms, and access 
            psychoeducational resources—all in one secure, compliant platform.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/api/auth/login"
              className="btn-primary text-lg px-8 py-3 inline-flex items-center justify-center"
            >
              Get Started
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
            
            <Link
              href="#features"
              className="btn-secondary text-lg px-8 py-3 inline-flex items-center justify-center"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Four Essential Hubs for Mental Health Practice
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Each Hub is designed to automate and streamline specific aspects of your practice, 
              allowing you to focus on what matters most—your patients.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Clinimetrix Hub */}
            <div className="card hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-clinimetrix-100 rounded-lg flex items-center justify-center">
                  <ClipboardDocumentListIcon className="h-6 w-6 text-clinimetrix-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold text-gray-900">Clinimetrix</h3>
                  <p className="text-sm text-clinimetrix-600">Clinical Assessment System</p>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                Automated system with 50+ standardized clinical scales. Apply assessments 
                in-person or remotely with tokenized links. Standardized interface for all 
                instruments with automated scoring and results visualization.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• 50+ validated clinical assessment scales</li>
                <li>• Self-administered and hetero-administered modes</li>
                <li>• Secure tokenized remote assessments</li>
                <li>• Automated scoring and interpretation</li>
              </ul>
            </div>

            {/* Expedix Hub */}
            <div className="card hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-expedix-100 rounded-lg flex items-center justify-center">
                  <UserGroupIcon className="h-6 w-6 text-expedix-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold text-gray-900">Expedix</h3>
                  <p className="text-sm text-expedix-600">Patient Management System</p>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                Digital clinical records with consultation history and automated prescription 
                management. Features dropdown medication search, customizable drug catalog, 
                digital signatures with QR codes, and visual patient categorization.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Comprehensive patient record management</li>
                <li>• Automated prescription generation</li>
                <li>• Digital signatures with QR security</li>
                <li>• Patient categorization with visual tags</li>
              </ul>
            </div>

            {/* Formx Hub */}
            <div className="card hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-formx-100 rounded-lg flex items-center justify-center">
                  <SparklesIcon className="h-6 w-6 text-formx-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold text-gray-900">Formx</h3>
                  <p className="text-sm text-formx-600">Form Builder System</p>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                Drag-and-drop form constructor for pre/post-consultation questionnaires. 
                Import existing PDFs or JotForm formats. Create custom intake forms, 
                satisfaction surveys, and follow-up questionnaires.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Drag-and-drop form builder interface</li>
                <li>• PDF and JotForm import capabilities</li>
                <li>• Custom field types and validation</li>
                <li>• Automated email delivery and collection</li>
              </ul>
            </div>

            {/* Resources Hub */}
            <div className="card hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-resources-100 rounded-lg flex items-center justify-center">
                  <BookOpenIcon className="h-6 w-6 text-resources-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold text-gray-900">Resources</h3>
                  <p className="text-sm text-resources-600">Psychoeducational Library</p>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                Curated library of psychoeducational materials and follow-up resources. 
                Categorized catalog with secure distribution, version control, and usage 
                tracking. Send resources digitally or print for in-person delivery.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Categorized psychoeducational materials</li>
                <li>• Secure digital distribution system</li>
                <li>• Version control and access logging</li>
                <li>• Bulk upload and management tools</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Compliance Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                <ShieldCheckIcon className="h-8 w-8 text-primary-600" />
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Security & Compliance First
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built specifically for healthcare environments with enterprise-grade security 
              and full compliance with medical data protection regulations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <LockClosedIcon className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                NOM-024 Compliance
              </h3>
              <p className="text-gray-600">
                Full compliance with Mexican healthcare data protection standards 
                (NOM-024-SSA3-2010) and HL7/IHE integration protocols.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <ShieldCheckIcon className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Enterprise Security
              </h3>
              <p className="text-gray-600">
                End-to-end encryption, secure authentication with Auth0, 
                audit logging, and quarterly penetration testing.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <SparklesIcon className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Cloud-Native
              </h3>
              <p className="text-gray-600">
                Built on Google Cloud Platform with automatic scaling, 
                99.9% uptime SLA, and automated backups.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Practice?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join mental health professionals who trust MindHub to streamline their clinical workflows 
            and improve patient care.
          </p>
          
          <Link
            href="/api/auth/login"
            className="bg-white text-primary-600 hover:bg-gray-100 font-semibold text-lg px-8 py-3 rounded-lg inline-flex items-center transition-colors duration-200"
          >
            Start Your Free Trial
            <ArrowRightIcon className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <HeartIcon className="h-6 w-6 text-primary-400" />
              <span className="ml-2 text-xl font-bold text-white">MindHub</span>
            </div>
            
            <div className="text-sm text-gray-400">
              © 2024 MindHub. Healthcare platform for mental health professionals.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}