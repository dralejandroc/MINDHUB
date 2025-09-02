'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signUp, signUpWithGoogle, signOut, getCurrentUser } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'
import { MindHubSignUpCard } from '@/components/auth/MindHubSignUpCard'

// Clean Architecture: Domain entities for registration
interface SignUpData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  clinicName: string;
}

export default function SignUpPage() {
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const router = useRouter()

  // Clean Architecture: Set document title (UI layer concern)
  useEffect(() => {
    document.title = 'Crear Cuenta - MindHub'
  }, [])

  // Check if user is already logged in and handle accordingly
  useEffect(() => {
    const checkCurrentUser = async () => {
      try {
        const { user } = await getCurrentUser()
        
        if (user) {
          // User is already logged in, ask if they want to sign up with different account
          const wantNewAccount = confirm(
            `Ya tienes una sesión activa con ${user.email}. ¿Quieres cerrar sesión para crear una nueva cuenta?`
          )
          
          if (wantNewAccount) {
            await signOut()
            toast.success('Sesión cerrada. Ahora puedes crear una nueva cuenta.')
          } else {
            // Redirect to dashboard if they want to keep current session
            router.push('/dashboard')
            return
          }
        }
      } catch (error) {
        console.warn('Error checking current user:', error)
        // Continue with signup if there's an error
      } finally {
        setCheckingAuth(false)
      }
    }

    checkCurrentUser()
  }, [])


  // Clean Architecture: Use Case - Handle user registration
  const handleSignUp = async (data: SignUpData) => {
    setLoading(true)

    try {
      const metadata = {
        first_name: data.firstName,
        last_name: data.lastName,
        role: 'professional',
        account_type: 'clinic',
        clinic_name: data.clinicName
      }

      const { data: authData, error } = await signUp(data.email, data.password, metadata)
      
      if (error) {
        toast.error(error.message)
        return
      }

      if (authData.user) {
        toast.success('¡Cuenta creada! Revisa tu email para confirmar tu cuenta.')
        router.push('/auth/sign-in')
      }
    } catch (error) {
      toast.error('Error inesperado al crear la cuenta')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    try {
      setLoading(true)
      const { data, error } = await signUpWithGoogle()
      
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

  const handleSignInRedirect = () => {
    router.push('/auth/sign-in')
  }

  // Show loading while checking authentication
  if (checkingAuth) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Verificando sesión actual...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 p-4">
      <MindHubSignUpCard 
        onSignUp={handleSignUp}
        onGoogleSignUp={handleGoogleSignUp}
        onSignInRedirect={handleSignInRedirect}
      />
    </div>
  )
}