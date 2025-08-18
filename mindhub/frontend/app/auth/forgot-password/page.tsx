'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      
      if (error) {
        toast.error(error.message)
        return
      }

      setSent(true)
      toast.success('Revisa tu email para restablecer tu contraseña')
    } catch (error) {
      toast.error('Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-700 to-teal-600 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">MindHub</h1>
            <p className="text-blue-100">Plataforma de Gestión Sanitaria</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-xl p-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 text-green-600">
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Email Enviado
              </h2>
              <p className="text-gray-600 mb-6">
                Hemos enviado un enlace para restablecer tu contraseña a <strong>{email}</strong>
              </p>
              <p className="text-sm text-gray-500 mb-8">
                Si no recibes el email en unos minutos, revisa tu carpeta de spam.
              </p>
              <a
                href="/auth/sign-in"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Volver al Login
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-700 to-teal-600 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">MindHub</h1>
          <p className="text-blue-100">Plataforma de Gestión Sanitaria</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 text-center">
              Recuperar Contraseña
            </h2>
            <p className="text-gray-600 text-center mt-2">
              Ingresa tu email para recibir un enlace de recuperación
            </p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="tu@email.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enviando...
                </div>
              ) : (
                'Enviar Enlace de Recuperación'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a
              href="/auth/sign-in"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              ← Volver al login
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}