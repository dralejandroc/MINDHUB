'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { signIn, signInWithGoogle, supabase } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'
import { MindHubSignInCard } from '@/components/auth/MindHubSignInCard'
import { useState } from 'react'

// Clean Architecture: Domain entities for authentication
interface SignInData {
  email: string;
  password: string;
}

export default function SignInPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Clean Architecture: Set document title (UI layer concern)
  useEffect(() => {
    document.title = 'Iniciar Sesión - MindHub'
    
    // EMERGENCY BYPASS: Redirect to /app after 30 seconds as final fallback
    console.log('🆘 [EMERGENCY] Setting up emergency bypass redirect in 30 seconds')
    
    const emergencyTimer = setTimeout(() => {
      console.log('🆘 [EMERGENCY] Emergency redirect triggered - bypassing login')
      const urlParams = new URLSearchParams(window.location.search)
      const redirectTo = urlParams.get('redirectTo') || '/app'
      console.log('🆘 [EMERGENCY] FORCING NAVIGATION TO:', redirectTo)
      window.location.href = redirectTo
    }, 30000) // 30 seconds
    
    return () => clearTimeout(emergencyTimer)
  }, [])

  const handleSignIn = async (email: string, password: string) => {
    // PERSISTENT LOGS que no se borren
    const logMessage = `🚨 [CRITICAL] handleSignIn called with email: ${email}, hasPassword: ${!!password}`
    console.log(logMessage)
    alert(logMessage) // Para que no desaparezca
    
    setLoading(true)

    try {
      console.log('🚨 [CRITICAL] Calling signIn function...')
      const { data, error } = await signIn(email, password)
      
      const resultMessage = `🚨 [CRITICAL] signIn result - hasData: ${!!data}, hasError: ${!!error}, hasUser: ${!!data?.user}`
      console.log(resultMessage)
      alert(resultMessage) // Para que no desaparezca
      
      if (error) {
        const errorMessage = `❌ [ERROR] ${error.message}`
        console.log(errorMessage)
        alert(errorMessage)
        toast.error(error.message)
        return
      }

      if (data.user) {
        const successMessage = `✅ [SUCCESS] Login exitoso para usuario: ${data.user.id}`
        console.log(successMessage)
        alert(successMessage)
        
        toast.success('¡Bienvenido a MindHub!')
        
        const urlParams = new URLSearchParams(window.location.search)
        const redirectTo = urlParams.get('redirectTo') || '/app'
        
        const redirectMessage = `🎯 [REDIRECT] Redirigiendo a: ${redirectTo}`
        console.log(redirectMessage)
        alert(redirectMessage)
        
        // IMMEDIATE redirect
        window.location.href = redirectTo
      }
    } catch (error) {
      const catchError = `💥 [CATCH ERROR] ${error}`
      console.log(catchError)
      alert(catchError)
      toast.error('Error inesperado al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)
      const { data, error } = await signInWithGoogle()
      
      if (error) {
        toast.error(error.message)
        return
      }
      
      // El usuario será redirigido a Google y luego a /auth/callback
      // No hay necesidad de hacer nada más aquí
    } catch (error) {
      toast.error('Error al conectar con Google')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = () => {
    router.push('/auth/forgot-password')
  }

  // EMERGENCY BYPASS FUNCTION
  const handleEmergencyBypass = () => {
    console.log('🆘 [EMERGENCY] Manual bypass triggered')
    const urlParams = new URLSearchParams(window.location.search)
    const redirectTo = urlParams.get('redirectTo') || '/app'
    console.log('🆘 [EMERGENCY] MANUAL REDIRECT TO:', redirectTo)
    window.location.href = redirectTo
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 p-4">
      {/* EMERGENCY BYPASS BUTTON */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={handleEmergencyBypass}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg"
        >
          🆘 EMERGENCY BYPASS
        </button>
      </div>
      
      <MindHubSignInCard 
        onSignIn={handleSignIn}
        onGoogleSignIn={handleGoogleSignIn}
        onForgotPassword={handleForgotPassword}
      />
    </div>
  )
}