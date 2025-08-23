'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'
import { EyeIcon, EyeSlashIcon, HeartIcon, ShieldCheckIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await signIn(email, password)
      
      if (error) {
        toast.error(error.message)
        return
      }

      if (data.user) {
        toast.success('¡Bienvenido!')
        router.push('/app')
      }
    } catch (error) {
      toast.error('Error inesperado al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary"></div>
        
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-10">
          <div 
            className="w-full h-full"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}
          />
        </div>
        
        <div className="relative z-10 flex flex-col justify-center px-12 py-20 text-white">
          <div className="max-w-lg">
            {/* Logo */}
            <div className="flex items-center mb-12">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mr-4">
                <HeartIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-heading font-bold">MindHub</h1>
                <p className="text-primary-100 text-sm">Healthcare Management Platform</p>
              </div>
            </div>

            {/* Hero content */}
            <div className="space-y-8">
              <div>
                <h2 className="text-4xl font-heading font-bold mb-4 leading-tight">
                  Gestiona tu práctica médica de forma inteligente
                </h2>
                <p className="text-primary-100 text-lg leading-relaxed">
                  Plataforma integral que conecta expedientes, evaluaciones clínicas, 
                  agenda y recursos en una sola herramienta profesional.
                </p>
              </div>

              {/* Features */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <ShieldCheckIcon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-primary-100">Seguridad y privacidad garantizada</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <UserGroupIcon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-primary-100">Gestión integral de pacientes</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <HeartIcon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-primary-100">Evaluaciones clínicas especializadas</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 gradient-background">
        <div className="max-w-md w-full">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary shadow-primary mb-4">
              <HeartIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-dark-green mb-2">MindHub</h1>
            <p className="text-gray-600">Plataforma de Gestión Sanitaria</p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-primary-100 overflow-hidden">
            {/* Header with gradient */}
            <div className="relative px-8 py-6 gradient-background border-b border-primary-100">
              <div className="text-center">
                <h2 className="text-2xl font-heading font-bold text-dark-green mb-2">
                  Bienvenido de nuevo
                </h2>
                <p className="text-gray-600">
                  Accede a tu cuenta profesional
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="px-8 py-8">
              <form onSubmit={handleSignIn} className="space-y-6">
                {/* Email Input */}
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-dark-green">
                    Correo Electrónico
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm transition-all duration-200 ease-in-out bg-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 hover:border-primary-300"
                    placeholder="tu@email.com"
                  />
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-medium text-dark-green">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl text-sm transition-all duration-200 ease-in-out bg-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 hover:border-primary-300"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Forgot Password */}
                <div className="text-right">
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-primary-600 hover:text-primary-700 transition-colors font-medium"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full relative overflow-hidden gradient-primary text-white font-semibold py-3 px-4 rounded-xl shadow-primary hover:shadow-primary-hover transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed hover-lift focus:outline-none focus:ring-4 focus:ring-primary-200 group"
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-300 will-change-transform"></div>
                  
                  <span className="relative z-10 flex items-center justify-center">
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Iniciando sesión...
                      </>
                    ) : (
                      'Iniciar Sesión'
                    )}
                  </span>
                </button>
              </form>

              {/* Divider */}
              <div className="mt-8 relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">¿Nuevo en MindHub?</span>
                </div>
              </div>

              {/* Sign Up Link */}
              <div className="mt-6 text-center">
                <Link
                  href="/auth/sign-up"
                  className="inline-flex items-center justify-center w-full px-4 py-3 border-2 border-primary-600 text-primary-600 font-semibold rounded-xl hover:bg-primary-50 transition-all duration-200 ease-in-out hover-lift"
                >
                  Crear cuenta gratuita
                </Link>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              Al iniciar sesión, aceptas nuestros{' '}
              <a href="/terms" target="_blank" className="text-primary-600 hover:text-primary-700 underline">
                Términos de Servicio
              </a>{' '}
              y{' '}
              <a href="/privacy" target="_blank" className="text-primary-600 hover:text-primary-700 underline">
                Política de Privacidad
              </a>
            </p>
            <p className="text-xs text-gray-400 mt-2">v2.1.0</p>
          </div>
        </div>
      </div>
    </div>
  )
}