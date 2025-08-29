// Clean Architecture: UI Components - User-friendly Error Messages
'use client';

interface ErrorMessageProps {
  title?: string;
  message: string;
  type?: 'error' | 'warning' | 'info';
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

// Clean Architecture: Error message variants
const errorVariants = {
  error: {
    icon: '🚨',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-800',
    buttonColor: 'bg-red-600 hover:bg-red-700'
  },
  warning: {
    icon: '⚠️',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-800',
    buttonColor: 'bg-yellow-600 hover:bg-yellow-700'
  },
  info: {
    icon: 'ℹ️',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-800',
    buttonColor: 'bg-blue-600 hover:bg-blue-700'
  }
} as const;

export function ErrorMessage({
  title = "Error",
  message,
  type = 'error',
  onRetry,
  onDismiss,
  className = ""
}: ErrorMessageProps) {
  const variant = errorVariants[type];
  
  return (
    <div className={`rounded-lg border p-4 ${variant.bgColor} ${variant.borderColor} ${className}`}>
      <div className="flex items-start space-x-3">
        <div className="text-2xl">{variant.icon}</div>
        <div className="flex-1">
          <h3 className={`font-semibold ${variant.textColor} mb-1`}>
            {title}
          </h3>
          <p className={`text-sm ${variant.textColor}`}>
            {message}
          </p>
          
          {(onRetry || onDismiss) && (
            <div className="mt-3 flex space-x-2">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className={`px-3 py-1.5 text-sm text-white rounded-lg transition-colors ${variant.buttonColor}`}
                >
                  Reintentar
                </button>
              )}
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cerrar
                </button>
              )}
            </div>
          )}
        </div>
        
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`text-xl ${variant.textColor} hover:opacity-70 transition-opacity`}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

// Clean Architecture: Specialized error message components
export function NetworkErrorMessage({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorMessage
      title="Error de conexión"
      message="No se pudo conectar con el servidor. Verifica tu conexión a internet e intenta nuevamente."
      type="error"
      onRetry={onRetry}
    />
  );
}

export function AuthErrorMessage({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorMessage
      title="Error de autenticación"
      message="Tu sesión ha expirado. Por favor, inicia sesión nuevamente."
      type="warning"
      onRetry={onRetry}
    />
  );
}

export function NotFoundErrorMessage({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorMessage
      title="Contenido no encontrado"
      message="El recurso que buscas no existe o ha sido eliminado."
      type="info"
      onRetry={onRetry}
    />
  );
}

export function ServerErrorMessage({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorMessage
      title="Error del servidor"
      message="Ha ocurrido un error interno. Nuestro equipo ha sido notificado y estamos trabajando para solucionarlo."
      type="error"
      onRetry={onRetry}
    />
  );
}

export function ValidationErrorMessage({ errors }: { errors: string[] }) {
  return (
    <ErrorMessage
      title="Errores de validación"
      message={
        errors.length === 1 
          ? errors[0] 
          : `Se encontraron ${errors.length} errores:\n${errors.map(e => `• ${e}`).join('\n')}`
      }
      type="warning"
    />
  );
}

// Clean Architecture: Generic error handler utility
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as any).message);
  }
  
  return 'Ha ocurrido un error inesperado';
}

// Clean Architecture: Error type detector
export function getErrorType(error: unknown): 'network' | 'auth' | 'validation' | 'server' | 'unknown' {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'network';
    }
    
    if (message.includes('unauthorized') || message.includes('authentication')) {
      return 'auth';
    }
    
    if (message.includes('validation') || message.includes('invalid')) {
      return 'validation';
    }
    
    if (message.includes('server') || message.includes('500')) {
      return 'server';
    }
  }
  
  return 'unknown';
}

// Clean Architecture: Error message resolver
export function ErrorMessageResolver({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const errorType = getErrorType(error);
  const errorMessage = getErrorMessage(error);
  
  switch (errorType) {
    case 'network':
      return <NetworkErrorMessage onRetry={onRetry} />;
    case 'auth':
      return <AuthErrorMessage onRetry={onRetry} />;
    case 'server':
      return <ServerErrorMessage onRetry={onRetry} />;
    default:
      return <ErrorMessage message={errorMessage} onRetry={onRetry} />;
  }
}