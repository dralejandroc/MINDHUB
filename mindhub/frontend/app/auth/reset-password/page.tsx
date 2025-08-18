'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'
import { Suspense } from 'react'

function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [validSession, setValidSession] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check if we have a valid reset session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setValidSession(true)
      } else {
        toast.error('Enlace inválido o expirado')
        router.push('/auth/forgot-password')
      }
    }

    checkSession()
  }, [router])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })
      
      if (error) {
        toast.error(error.message)
        return
      }

      toast.success('Contraseña actualizada exitosamente')
      router.push('/auth/sign-in')
    } catch (error) {
      toast.error('Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  if (!validSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-700 to-teal-600">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Verificando enlace...</p>
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
              Nueva Contraseña
            </h2>
            <p className="text-gray-600 text-center mt-2">
              Ingresa tu nueva contraseña
            </p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Nueva Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirmar Contraseña
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Repite tu contraseña"
              />
            </div>

            {password && confirmPassword && password !== confirmPassword && (
              <p className="text-red-500 text-sm">Las contraseñas no coinciden</p>
            )}

            <button
              type="submit"
              disabled={loading || password !== confirmPassword || password.length < 6}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Actualizando...
                </div>
              ) : (
                'Actualizar Contraseña'
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-700 to-teal-600">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Cargando...</p>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}