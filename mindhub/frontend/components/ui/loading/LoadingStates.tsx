// Clean Architecture: UI Components - Comprehensive Loading States
'use client';

import { LoadingSpinner } from './LoadingSpinner';

interface LoadingStateProps {
  isLoading: boolean;
  error?: string | null;
  children: React.ReactNode;
  loadingMessage?: string;
  errorMessage?: string;
  className?: string;
}

// Clean Architecture: Higher-order component for loading states
export function LoadingState({
  isLoading,
  error,
  children,
  loadingMessage = "Cargando...",
  errorMessage,
  className = ""
}: LoadingStateProps) {
  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
        <div className="text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Error al cargar
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {errorMessage || error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-teal text-white rounded-lg hover:bg-primary-blue transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <LoadingSpinner size="lg" message={loadingMessage} />
      </div>
    );
  }

  return <>{children}</>;
}

// Clean Architecture: Specialized loading states for different UI contexts
export function TableLoadingState({ rowCount = 5 }: { rowCount?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rowCount }).map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded-lg"></div>
        </div>
      ))}
    </div>
  );
}

export function CardLoadingState({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="h-8 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function FormLoadingState() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="h-10 bg-gray-200 rounded w-full"></div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="h-10 bg-gray-200 rounded w-full"></div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="h-24 bg-gray-200 rounded w-full"></div>
      </div>
      <div className="h-10 bg-gray-200 rounded w-32"></div>
    </div>
  );
}

export function DashboardLoadingState() {
  return (
    <div className="space-y-6 p-6">
      {/* Header skeleton */}
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
      
      {/* Stats skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-white rounded-lg border p-6 space-y-3">
              <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Main content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 animate-pulse">
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
        <div className="animate-pulse">
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex space-x-3">
                  <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PageLoadingSpinner({ message = "Cargando..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingSpinner size="xl" message={message} />
    </div>
  );
}