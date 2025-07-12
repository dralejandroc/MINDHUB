'use client';

import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  ExclamationTriangleIcon,
  LockClosedIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

interface HubAccessGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function HubAccessGuard({ children, fallback }: HubAccessGuardProps) {
  const { 
    isLoading, 
    isAuthenticated, 
    hasCurrentHubAccess, 
    currentHubConfig,
    navigateToHub 
  } = useAuth();

  // Show loading spinner while authentication state is being determined
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-sm text-gray-600">
            Verifying access to {currentHubConfig.hubName}...
          </p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md mx-auto p-8 text-center">
          <LockClosedIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-6">
            You need to sign in to access {currentHubConfig.hubName}.
          </p>
          <a
            href="/api/auth/login"
            className="btn-primary w-full"
          >
            Sign In
          </a>
        </Card>
      </div>
    );
  }

  // Show access denied if user doesn't have permissions for current hub
  if (!hasCurrentHubAccess()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-lg mx-auto p-8 text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Access Restricted
          </h2>
          <p className="text-gray-600 mb-2">
            You don't have permission to access <strong>{currentHubConfig.hubName}</strong>.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            {currentHubConfig.description}
          </p>
          
          <div className="space-y-3">
            <Button
              variant="primary"
              onClick={() => navigateToHub('app')}
              className="w-full"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Return to Dashboard
            </Button>
            
            <Button
              variant="outline"
              onClick={() => window.location.href = '/api/auth/logout'}
              className="w-full"
            >
              Sign Out
            </Button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Need access?</strong><br />
              Contact your administrator to request permissions for this hub.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Show custom fallback or children if access is granted
  return fallback ? <>{fallback}</> : <>{children}</>;
}

// Higher-order component version
export function withHubAccessGuard<T extends object>(
  Component: React.ComponentType<T>
) {
  return function GuardedComponent(props: T) {
    return (
      <HubAccessGuard>
        <Component {...props} />
      </HubAccessGuard>
    );
  };
}