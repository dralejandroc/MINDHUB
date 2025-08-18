// import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-600 via-blue-700 to-blue-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">MindHub</h1>
          <p className="text-blue-100">Únete a nuestra plataforma</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-xl p-8">
          <SignUp 
            appearance={{
              elements: {
                formButtonPrimary: 'bg-teal-600 hover:bg-teal-700 text-sm normal-case',
                card: 'shadow-none',
                headerTitle: 'text-2xl font-semibold text-gray-900',
                headerSubtitle: 'text-gray-600',
                socialButtonsBlockButton: 'border border-gray-300 hover:bg-gray-50',
                formFieldInput: 'border border-gray-300 rounded-md',
                footerActionLink: 'text-teal-600 hover:text-teal-700'
              }
            }}
            routing="path"
            path="/sign-up"
          />
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-blue-100 text-sm">
            ¿Ya tienes cuenta?{' '}
            <a href="/sign-in" className="text-white font-medium hover:underline">
              Inicia sesión aquí
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}