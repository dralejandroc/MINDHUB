'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          toast.error('Error en la autenticación')
          router.push('/auth/sign-in')
          return
        }

        if (data.session) {
          toast.success('¡Autenticación exitosa!')
          router.push('/dashboard')
        } else {
          router.push('/auth/sign-in')
        }
      } catch (error) {
        console.error('Callback handling error:', error)
        toast.error('Error en el proceso de autenticación')
        router.push('/auth/sign-in')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mb-4"></div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Procesando autenticación...</h2>
        <p className="text-gray-600">Espera un momento mientras verificamos tu cuenta.</p>
      </div>
    </div>
  )
}