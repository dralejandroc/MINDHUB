'use client';

import Link from 'next/link';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-red-500">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            You're Currently Offline
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Glian requires an internet connection for healthcare data security and real-time synchronization.
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="space-y-4">
              <div className="flex items-center p-4 bg-yellow-50 rounded-md">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Healthcare Data Security Notice
                  </h3>
                  <p className="text-xs text-yellow-700 mt-1">
                    Patient data and clinical assessments require a secure connection to ensure HIPAA compliance.
                  </p>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                <p className="font-medium mb-2">While offline, you can:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>View previously loaded information</li>
                  <li>Review cached assessment templates</li>
                  <li>Access offline documentation</li>
                </ul>
              </div>

              <div className="text-sm text-gray-600">
                <p className="font-medium mb-2">To restore full functionality:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Check your internet connection</li>
                  <li>Refresh the page once connected</li>
                  <li>Contact IT support if issues persist</li>
                </ul>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Try Reconnecting
                </button>
              </div>

              <div className="text-center">
                <Link 
                  href="/"
                  className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                >
                  Return to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}