'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { resetPassword } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'
import { EnvelopeIcon, ArrowLeftIcon, HeartIcon, CheckCircleIcon, LockClosedIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const router = useRouter()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await resetPassword(email)
      
      if (error) {
        toast.error(error.message)
        return
      }

      setEmailSent(true)
      toast.success('Email de recuperación enviado')
    } catch (error) {
      toast.error('Error inesperado al enviar email de recuperación')
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
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

              {/* Success content */}
              <div className="space-y-8">
                <div className="flex items-center justify-center mb-8">
                  <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircleIcon className="w-12 h-12 text-green-300" />
                  </div>
                </div>

                <div className="text-center">
                  <h2 className="text-3xl font-heading font-bold mb-4 leading-tight">
                    Email enviado exitosamente
                  </h2>
                  <p className="text-primary-100 text-lg leading-relaxed">
                    Te hemos enviado un enlace seguro para restablecer tu contraseña. 
                    Revisa tu bandeja de entrada y sigue las instrucciones.
                  </p>
                </div>

                {/* Instructions */}
                <div className="space-y-4 bg-white/10 backdrop-blur-sm rounded-xl p-6">
                  <h3 className="font-semibold text-lg">Próximos pasos:</h3>
                  <div className="space-y-3 text-primary-100">
                    <div className="flex items-start space-x-3">
                      <span className="w-6 h-6 rounded-full bg-primary-200 text-primary-800 flex items-center justify-center text-sm font-medium mt-0.5">1</span>
                      <span>Revisa tu correo electrónico (incluyendo spam)</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="w-6 h-6 rounded-full bg-primary-200 text-primary-800 flex items-center justify-center text-sm font-medium mt-0.5">2</span>
                      <span>Haz clic en el enlace de recuperación</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="w-6 h-6 rounded-full bg-primary-200 text-primary-800 flex items-center justify-center text-sm font-medium mt-0.5">3</span>
                      <span>Crea tu nueva contraseña segura</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Success Message */}
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

            {/* Success Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-primary-100 overflow-hidden">
              {/* Header with gradient */}
              <div className="relative px-8 py-6 gradient-background border-b border-primary-100">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                    <CheckCircleIcon className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-heading font-bold text-dark-green mb-2">
                    ¡Email enviado!
                  </h2>
                  <p className="text-gray-600">
                    Revisa tu correo para restablecer tu contraseña
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="px-8 py-8">
                <div className="text-center mb-8">
                  <p className="text-gray-700 mb-4">
                    Hemos enviado un enlace de recuperación a:
                  </p>
                  <div className="inline-flex items-center px-4 py-3 bg-gray-50 rounded-lg">
                    <EnvelopeIcon className="w-5 h-5 text-gray-500 mr-2" />
                    <span className="font-medium text-gray-900">{email}</span>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <LockClosedIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        Seguridad Garantizada
                      </h3>
                      <p className="mt-1 text-sm text-blue-700">
                        El enlace de recuperación es seguro y expira en 1 hora por tu protección.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-4">
                  <button
                    onClick={() => handleResetPassword(new Event('submit') as any)}
                    disabled={loading}
                    className="w-full relative overflow-hidden gradient-primary text-white font-semibold py-3 px-4 rounded-xl shadow-primary hover:shadow-primary-hover transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed hover-lift focus:outline-none focus:ring-4 focus:ring-primary-200 group"
                  >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-300 will-change-transform"></div>
                    
                    <span className="relative z-10 flex items-center justify-center">
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          Reenviando...
                        </>
                      ) : (
                        <>
                          <EnvelopeIcon className="w-5 h-5 mr-2" />
                          Reenviar Email
                        </>
                      )}
                    </span>
                  </button>

                  <Link
                    href="/auth/sign-in"
                    className="w-full inline-flex items-center justify-center px-4 py-3 border-2 border-primary-600 text-primary-600 font-semibold rounded-xl hover:bg-primary-50 transition-all duration-200 ease-in-out hover-lift"
                  >
                    <ArrowLeftIcon className="w-5 h-5 mr-2" />
                    Volver al Login
                  </Link>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-xs text-gray-500">
                ¿No recibiste el email? Revisa tu carpeta de spam o{' '}
                <button 
                  onClick={() => {
                    setEmailSent(false)
                    setEmail('')
                  }}
                  className="text-primary-600 hover:text-primary-700 underline"
                >
                  intenta con otro correo
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
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
                  Recupera el acceso a tu cuenta
                </h2>
                <p className="text-primary-100 text-lg leading-relaxed">
                  Te ayudamos a recuperar el acceso a tu plataforma profesional 
                  de gestión sanitaria de forma segura y rápida.
                </p>
              </div>

              {/* Security Features */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <LockClosedIcon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-primary-100">Proceso de recuperación seguro</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <EnvelopeIcon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-primary-100">Confirmación por email</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <CheckCircleIcon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-primary-100">Acceso restaurado rápidamente</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Reset Form */}
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

          {/* Reset Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-primary-100 overflow-hidden">
            {/* Header with gradient */}
            <div className="relative px-8 py-6 gradient-background border-b border-primary-100">
              <div className="text-center">
                <h2 className="text-2xl font-heading font-bold text-dark-green mb-2">
                  Restablecer contraseña
                </h2>
                <p className="text-gray-600">
                  Ingresa tu email para recibir un enlace de recuperación
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="px-8 py-8">
              <form onSubmit={handleResetPassword} className="space-y-6">
                {/* Email Input */}
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-dark-green">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-sm transition-all duration-200 ease-in-out bg-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 hover:border-primary-300"
                      placeholder="tu@email.com"
                    />
                    <EnvelopeIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <LockClosedIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        Te enviaremos un enlace seguro para restablecer tu contraseña. 
                        El enlace expira en 1 hora por seguridad.
                      </p>
                    </div>
                  </div>
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
                        Enviando...
                      </>
                    ) : (
                      <>
                        <EnvelopeIcon className="w-5 h-5 mr-2" />
                        Enviar Enlace de Recuperación
                      </>
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
                  <span className="px-4 bg-white text-gray-500">¿Recordaste tu contraseña?</span>
                </div>
              </div>

              {/* Back to Login Link */}
              <div className="mt-6 text-center">
                <Link
                  href="/auth/sign-in"
                  className="inline-flex items-center justify-center w-full px-4 py-3 border-2 border-primary-600 text-primary-600 font-semibold rounded-xl hover:bg-primary-50 transition-all duration-200 ease-in-out hover-lift"
                >
                  <ArrowLeftIcon className="w-5 h-5 mr-2" />
                  Volver al Inicio de Sesión
                </Link>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              ¿Necesitas ayuda?{' '}
              <a href="/contact" target="_blank" className="text-primary-600 hover:text-primary-700 underline">
                Contacta al Soporte
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}