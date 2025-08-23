'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signUp } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'
import { 
  EyeIcon, 
  EyeSlashIcon, 
  HeartIcon, 
  UserIcon, 
  BuildingOfficeIcon,
  AcademicCapIcon,
  PhoneIcon,
  MapPinIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function SignUpPage() {
  const [step, setStep] = useState(1)
  const [accountType, setAccountType] = useState<'individual' | 'clinic'>('individual')
  
  // Basic Info
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // Personal Info
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [specialization, setSpecialization] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')
  
  // Clinic Info (if applicable)
  const [clinicName, setClinicName] = useState('')
  const [clinicAddress, setClinicAddress] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const router = useRouter()

  const validateStep1 = () => {
    if (!email || !password || !confirmPassword) {
      toast.error('Por favor completa todos los campos')
      return false
    }
    
    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return false
    }

    if (password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres')
      return false
    }

    if (!agreeTerms) {
      toast.error('Debes aceptar los términos y condiciones')
      return false
    }

    return true
  }

  const validateStep2 = () => {
    if (!firstName || !lastName || !phone || !specialization) {
      toast.error('Por favor completa todos los campos')
      return false
    }
    return true
  }

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
    } else if (step === 2 && validateStep2()) {
      setStep(3)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const metadata = {
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        specialization: specialization,
        license_number: licenseNumber,
        role: 'professional',
        account_type: accountType,
        ...(accountType === 'clinic' && {
          clinic_name: clinicName,
          clinic_address: clinicAddress
        })
      }

      const { data, error } = await signUp(email, password, metadata)
      
      if (error) {
        toast.error(error.message)
        return
      }

      if (data.user) {
        toast.success('¡Cuenta creada! Revisa tu email para confirmar tu cuenta.')
        router.push('/auth/sign-in')
      }
    } catch (error) {
      toast.error('Error inesperado al crear la cuenta')
    } finally {
      setLoading(false)
    }
  }

  const specializations = [
    'Medicina General', 'Psicología', 'Psiquiatría', 'Cardiología', 'Dermatología',
    'Pediatría', 'Ginecología', 'Neurología', 'Ortopedia', 'Oftalmología', 'Otra'
  ]

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex lg:w-2/5 relative overflow-hidden">
        <div className="absolute inset-0 gradient-secondary"></div>
        
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-10">
          <div 
            className="w-full h-full"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M20 20c0 4.4-3.6 8-8 8s-8-3.6-8-8 3.6-8 8-8 8 3.6 8 8zm0 0c0 4.4 3.6 8 8 8s8-3.6 8-8-3.6-8-8-8-8 3.6-8 8z'/%3E%3C/g%3E%3C/svg%3E")`
            }}
          />
        </div>
        
        <div className="relative z-10 flex flex-col justify-center px-12 py-20 text-white">
          <div className="max-w-lg">
            {/* Logo */}
            <div className="flex items-center mb-12">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mr-4">
                <HeartIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-heading font-bold">MindHub</h1>
                <p className="text-secondary-100 text-sm">Healthcare Management Platform</p>
              </div>
            </div>

            {/* Hero content */}
            <div className="space-y-8">
              <div>
                <h2 className="text-4xl font-heading font-bold mb-6 leading-tight">
                  Únete a la nueva generación de profesionales de la salud
                </h2>
                <p className="text-secondary-100 text-lg leading-relaxed mb-8">
                  Crea tu cuenta profesional y accede a herramientas avanzadas 
                  para la gestión integral de tu práctica médica.
                </p>
              </div>

              {/* Steps indicator */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step >= 1 ? 'bg-white text-secondary-600' : 'bg-white/20 text-white'
                  }`}>
                    {step > 1 ? <CheckCircleIcon className="w-5 h-5" /> : '1'}
                  </div>
                  <span className="text-secondary-100">Información de acceso</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step >= 2 ? 'bg-white text-secondary-600' : 'bg-white/20 text-white'
                  }`}>
                    {step > 2 ? <CheckCircleIcon className="w-5 h-5" /> : '2'}
                  </div>
                  <span className="text-secondary-100">Información profesional</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step >= 3 ? 'bg-white text-secondary-600' : 'bg-white/20 text-white'
                  }`}>
                    3
                  </div>
                  <span className="text-secondary-100">Confirmación</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Registration Form */}
      <div className="w-full lg:w-3/5 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 gradient-background">
        <div className="max-w-lg w-full">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-secondary shadow-secondary mb-4">
              <HeartIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-dark-green mb-2">MindHub</h1>
            <p className="text-gray-600">Crea tu cuenta profesional</p>
          </div>

          {/* Registration Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-secondary-100 overflow-hidden">
            {/* Header with gradient */}
            <div className="relative px-8 py-6 gradient-background border-b border-secondary-100">
              <div className="text-center">
                <h2 className="text-2xl font-heading font-bold text-dark-green mb-2">
                  {step === 1 && 'Crea tu cuenta'}
                  {step === 2 && 'Información profesional'}
                  {step === 3 && 'Confirma tu registro'}
                </h2>
                <p className="text-gray-600">
                  Paso {step} de 3 - {
                    step === 1 ? 'Información básica de acceso' :
                    step === 2 ? 'Datos profesionales y contacto' :
                    'Revisa y confirma tu información'
                  }
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="px-8 py-8">
              {/* Step 1: Account Type & Basic Info */}
              {step === 1 && (
                <div className="space-y-6">
                  {/* Account Type Selection */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-dark-green">
                      Tipo de cuenta
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setAccountType('individual')}
                        className={`p-4 border-2 rounded-xl text-center transition-all hover-lift ${
                          accountType === 'individual'
                            ? 'border-secondary-500 bg-secondary-50'
                            : 'border-gray-200 hover:border-secondary-300'
                        }`}
                      >
                        <UserIcon className={`w-8 h-8 mx-auto mb-2 ${
                          accountType === 'individual' ? 'text-secondary-600' : 'text-gray-600'
                        }`} />
                        <h3 className="font-semibold text-sm">Profesional Individual</h3>
                        <p className="text-xs text-gray-600">Consulta privada</p>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setAccountType('clinic')}
                        className={`p-4 border-2 rounded-xl text-center transition-all hover-lift ${
                          accountType === 'clinic'
                            ? 'border-secondary-500 bg-secondary-50'
                            : 'border-gray-200 hover:border-secondary-300'
                        }`}
                      >
                        <BuildingOfficeIcon className={`w-8 h-8 mx-auto mb-2 ${
                          accountType === 'clinic' ? 'text-secondary-600' : 'text-gray-600'
                        }`} />
                        <h3 className="font-semibold text-sm">Clínica/Hospital</h3>
                        <p className="text-xs text-gray-600">Equipo médico</p>
                      </button>
                    </div>
                  </div>

                  {/* Email */}
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm transition-all duration-200 ease-in-out bg-white focus:outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-100 hover:border-secondary-300"
                      placeholder="tu@email.com"
                    />
                  </div>

                  {/* Password */}
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
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl text-sm transition-all duration-200 ease-in-out bg-white focus:outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-100 hover:border-secondary-300"
                        placeholder="Mínimo 8 caracteres"
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

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-dark-green">
                      Confirmar Contraseña
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl text-sm transition-all duration-200 ease-in-out bg-white focus:outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-100 hover:border-secondary-300"
                        placeholder="Repite tu contraseña"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeSlashIcon className="w-5 h-5" />
                        ) : (
                          <EyeIcon className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Terms & Conditions */}
                  <div className="flex items-start space-x-3">
                    <input
                      id="terms"
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-1 h-4 w-4 text-secondary-600 focus:ring-secondary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="terms" className="text-sm text-gray-600">
                      Acepto los{' '}
                      <a href="#" className="text-secondary-600 hover:text-secondary-700 font-medium">
                        Términos de Servicio
                      </a>{' '}
                      y{' '}
                      <a href="#" className="text-secondary-600 hover:text-secondary-700 font-medium">
                        Política de Privacidad
                      </a>
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={handleNext}
                    className="w-full gradient-secondary text-white font-semibold py-3 px-4 rounded-xl shadow-secondary hover:shadow-secondary-hover transition-all duration-300 ease-in-out hover-lift focus:outline-none focus:ring-4 focus:ring-secondary-200"
                  >
                    Continuar
                  </button>
                </div>
              )}

              {/* Step 2: Professional Info */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="firstName" className="block text-sm font-medium text-dark-green">
                        Nombre(s)
                      </label>
                      <input
                        id="firstName"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm transition-all duration-200 ease-in-out bg-white focus:outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-100 hover:border-secondary-300"
                        placeholder="Juan Carlos"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="lastName" className="block text-sm font-medium text-dark-green">
                        Apellidos
                      </label>
                      <input
                        id="lastName"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm transition-all duration-200 ease-in-out bg-white focus:outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-100 hover:border-secondary-300"
                        placeholder="Pérez García"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="phone" className="block text-sm font-medium text-dark-green">
                      <PhoneIcon className="w-4 h-4 inline mr-1" />
                      Teléfono
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm transition-all duration-200 ease-in-out bg-white focus:outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-100 hover:border-secondary-300"
                      placeholder="+52 999 123 4567"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="specialization" className="block text-sm font-medium text-dark-green">
                      <AcademicCapIcon className="w-4 h-4 inline mr-1" />
                      Especialidad
                    </label>
                    <select
                      id="specialization"
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm transition-all duration-200 ease-in-out bg-white focus:outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-100 hover:border-secondary-300"
                    >
                      <option value="">Selecciona tu especialidad</option>
                      {specializations.map((spec) => (
                        <option key={spec} value={spec}>{spec}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="licenseNumber" className="block text-sm font-medium text-dark-green">
                      Número de Cédula (opcional)
                    </label>
                    <input
                      id="licenseNumber"
                      type="text"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm transition-all duration-200 ease-in-out bg-white focus:outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-100 hover:border-secondary-300"
                      placeholder="1234567"
                    />
                  </div>

                  {/* Clinic Info (if clinic account) */}
                  {accountType === 'clinic' && (
                    <>
                      <div className="space-y-2">
                        <label htmlFor="clinicName" className="block text-sm font-medium text-dark-green">
                          <BuildingOfficeIcon className="w-4 h-4 inline mr-1" />
                          Nombre de la Clínica/Hospital
                        </label>
                        <input
                          id="clinicName"
                          type="text"
                          value={clinicName}
                          onChange={(e) => setClinicName(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm transition-all duration-200 ease-in-out bg-white focus:outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-100 hover:border-secondary-300"
                          placeholder="Hospital General"
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="clinicAddress" className="block text-sm font-medium text-dark-green">
                          <MapPinIcon className="w-4 h-4 inline mr-1" />
                          Dirección de la Clínica
                        </label>
                        <input
                          id="clinicAddress"
                          type="text"
                          value={clinicAddress}
                          onChange={(e) => setClinicAddress(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm transition-all duration-200 ease-in-out bg-white focus:outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-100 hover:border-secondary-300"
                          placeholder="Calle 60 #123, Centro, Mérida, Yuc."
                        />
                      </div>
                    </>
                  )}

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200 ease-in-out"
                    >
                      Atrás
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="flex-1 gradient-secondary text-white font-semibold py-3 px-4 rounded-xl shadow-secondary hover:shadow-secondary-hover transition-all duration-300 ease-in-out hover-lift focus:outline-none focus:ring-4 focus:ring-secondary-200"
                    >
                      Continuar
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Confirmation */}
              {step === 3 && (
                <form onSubmit={handleSignUp} className="space-y-6">
                  <div className="bg-secondary-50 rounded-xl p-6 space-y-4">
                    <h3 className="font-semibold text-dark-green">Resumen de tu cuenta</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tipo de cuenta:</span>
                        <span className="font-medium">
                          {accountType === 'individual' ? 'Profesional Individual' : 'Clínica/Hospital'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium">{email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Nombre:</span>
                        <span className="font-medium">{firstName} {lastName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Especialidad:</span>
                        <span className="font-medium">{specialization}</span>
                      </div>
                      {accountType === 'clinic' && clinicName && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Clínica:</span>
                          <span className="font-medium">{clinicName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200 ease-in-out"
                    >
                      Atrás
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 relative overflow-hidden gradient-secondary text-white font-semibold py-3 px-4 rounded-xl shadow-secondary hover:shadow-secondary-hover transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed hover-lift focus:outline-none focus:ring-4 focus:ring-secondary-200 group"
                    >
                      {/* Shimmer effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
                      
                      <span className="relative z-10 flex items-center justify-center">
                        {loading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                            Creando cuenta...
                          </>
                        ) : (
                          'Crear Cuenta'
                        )}
                      </span>
                    </button>
                  </div>
                </form>
              )}

              {/* Back to Sign In */}
              {step === 1 && (
                <div className="mt-8 text-center">
                  <p className="text-sm text-gray-600">
                    ¿Ya tienes cuenta?{' '}
                    <Link
                      href="/auth/sign-in"
                      className="text-secondary-600 hover:text-secondary-700 font-medium"
                    >
                      Inicia sesión aquí
                    </Link>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}