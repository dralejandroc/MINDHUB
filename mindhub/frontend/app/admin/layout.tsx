/**
 * Admin Dashboard Layout - RESTRICTED ACCESS
 * 
 * SECURITY: Only org:admin users can access this section
 * DOMAIN: admin.mindhub.cloud (separate from main platform)
 * 
 * This layout should be deployed to a separate subdomain and is completely
 * hidden from regular platform users
 */

import { ClerkProvider } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { auth, clerkClient } from '@clerk/nextjs/server';

interface AdminLayoutProps {
  children: React.ReactNode;
}

/**
 * Server-side admin authentication check
 */
async function checkAdminAccess() {
  const { userId } = auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  try {
    // Get user's organization memberships to check if admin
    const orgMemberships = await clerkClient.users.getOrganizationMembershipList({
      userId: userId
    });

    const isAdmin = orgMemberships.some(membership => membership.role === 'org:admin');
    
    if (!isAdmin) {
      // Return 404 to hide admin panel existence from non-admins
      redirect('/404');
    }

    return true;
  } catch (error) {
    console.error('Admin access check failed:', error);
    redirect('/404');
  }
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  // Verify admin access on every page load
  await checkAdminAccess();

  return (
    <ClerkProvider>
      <html lang="es">
        <head>
          <title>MindHub Admin Dashboard</title>
          <meta name="robots" content="noindex, nofollow" /> {/* Hide from search engines */}
          <meta name="description" content="MindHub Administrative Dashboard" />
        </head>
        <body className="bg-gray-50">
          <div className="min-h-screen">
            {/* Admin Header */}
            <header className="bg-red-900 text-white shadow-lg">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4">
                  <div className="flex items-center">
                    <h1 className="text-2xl font-bold">🔐 MindHub Admin</h1>
                    <span className="ml-4 px-3 py-1 bg-red-700 rounded text-sm">
                      RESTRICTED ACCESS
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-red-200">Administrator Panel</span>
                  </div>
                </div>
              </div>
            </header>

            {/* Admin Navigation */}
            <nav className="bg-red-800 shadow">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex space-x-8 py-3">
                  <a
                    href="/admin"
                    className="text-red-100 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    📊 Dashboard
                  </a>
                  <a
                    href="/admin/analytics"
                    className="text-red-100 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    📈 Analytics
                  </a>
                  <a
                    href="/admin/users"
                    className="text-red-100 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    👥 Users
                  </a>
                  <a
                    href="/admin/finance"
                    className="text-red-100 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    💰 Finance
                  </a>
                  <a
                    href="/admin/system"
                    className="text-red-100 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    ⚙️ System
                  </a>
                </div>
              </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
              <div className="px-4 py-6 sm:px-0">
                {/* Security Notice */}
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      ⚠️
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Security Notice
                      </h3>
                      <p className="mt-1 text-sm text-yellow-700">
                        This admin panel displays only aggregated, anonymized data. 
                        No sensitive patient information is accessible through this interface.
                      </p>
                    </div>
                  </div>
                </div>

                {children}
              </div>
            </main>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}