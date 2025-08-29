'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signUp, signUpWithGoogle } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'
import { MindHubSignUpCard } from '@/components/auth/MindHubSignUpCard'

export default function SignUpPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()


  const handleSignUp = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    clinicName: string;
  }) => {
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