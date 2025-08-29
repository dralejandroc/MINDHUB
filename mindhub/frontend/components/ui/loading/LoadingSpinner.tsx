// Clean Architecture: UI Component - Loading States
'use client';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white' | 'gray';
  message?: string;
  className?: string;
}

// Clean Architecture: Entity - Size variants for spinner
const sizeVariants = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16'
} as const;

// Clean Architecture: Entity - Color variants for spinner
const colorVariants = {
  primary: 'text-primary-teal',
  secondary: 'text-primary-blue',
  white: 'text-white',
  gray: 'text-gray-600'
} as const;

export function LoadingSpinner({ 
  size = 'md', 
  color = 'primary', 
  message,
  className = '' 
}: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div
        className={`animate-spin rounded-full border-2 border-current border-t-transparent ${sizeVariants[size]} ${colorVariants[color]}`}
        role="status"
        aria-label="Loading"
      >
        <span className="sr-only">Cargando...</span>
      </div>
      {message && (
        <p className={`text-sm font-medium ${colorVariants[color]} text-center`}>
          {message}
        </p>
      )}
    </div>
  );
}

// Clean Architecture: Specialized loading components
export function PageLoadingSpinner({ message = "Cargando página..." }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <LoadingSpinner size="xl" message={message} />
    </div>
  );
}

export function ComponentLoadingSpinner({ message = "Cargando..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <LoadingSpinner size="lg" message={message} />
    </div>
  );
}

export function ButtonLoadingSpinner({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  return (
    <LoadingSpinner size={size} color="white" className="mr-2" />
  );
}