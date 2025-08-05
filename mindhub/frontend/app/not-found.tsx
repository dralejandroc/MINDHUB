import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h1 className="text-9xl font-bold bg-gradient-to-r from-primary-teal to-primary-blue bg-clip-text text-transparent mb-4">
          404
        </h1>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Página no encontrada
        </h2>
        <p className="text-gray-600 mb-8">
          La página que buscas no existe o ha sido movida.
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-teal to-primary-blue text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}