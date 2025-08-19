'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { clearSupabaseSession } from '@/lib/supabase/cleanup'

export default function ClearSessionPage() {
  const [clearing, setClearing] = useState(false)
  const [cleared, setCleared] = useState(false)
  const router = useRouter()

  const handleClearSession = async () => {
    setClearing(true)
    
    try {
      // Clear all Supabase data
      clearSupabaseSession()
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setCleared(true)
      setClearing(false)
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/auth/sign-in')
      }, 2000)
      
    } catch (error) {
      console.error('Error clearing session:', error)
      setClearing(false)
    }
  }

  useEffect(() => {
    // Auto-clear if there's a clear parameter in the URL
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('auto') === 'true') {
      handleClearSession()
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-700 to-teal-600 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Limpiar Sesión
            </h2>
            
            {!cleared ? (
              <>
                <p className="text-gray-600 mb-6">
                  Si experimentas problemas al iniciar sesión, puedes limpiar los datos de sesión corruptos.
                </p>
                
                <button
                  onClick={handleClearSession}
                  disabled={clearing}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {clearing ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Limpiando...
                    </div>
                  ) : (
                    'Limpiar Datos de Sesión'
                  )}
                </button>
              </>
            ) : (
              <>
                <div className="mb-4">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <p className="text-green-600 font-medium mb-4">
                  ¡Datos de sesión limpiados exitosamente!
                </p>
                <p className="text-gray-500 text-sm">
                  Redirigiendo al login en unos segundos...
                </p>
              </>
            )}
          </div>
          
          <div className="mt-6 text-center">
            <a
              href="/auth/sign-in"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Volver al login
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}