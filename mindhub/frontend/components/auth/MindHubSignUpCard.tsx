'use client';

import React, { useState } from "react";
import { Eye, EyeOff, Heart, Brain, User, Mail, Lock, Building } from "lucide-react";
import { motion } from "framer-motion";
import { HealthcareNetworkMap } from "@/components/ui/healthcare-network-map";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

// Helper function to merge class names
const cn = (...classes: string[]) => {
  return classes.filter(Boolean).join(" ");
};

interface MindHubSignUpCardProps {
  onSignUp?: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    clinicName: string;
  }) => void;
  onGoogleSignUp?: () => void;
  onSignInRedirect?: () => void;
}

export const MindHubSignUpCard = ({ 
  onSignUp, 
  onGoogleSignUp, 
  onSignInRedirect 
}: MindHubSignUpCardProps) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    clinicName: ""
  });
  const [isHovered, setIsHovered] = useState(false);
  
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }
    if (onSignUp) {
      onSignUp({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        clinicName: formData.clinicName
      });
    }
  };

  return (
    <div className="flex w-full h-full items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-6xl overflow-hidden rounded-2xl flex bg-white shadow-2xl border border-gray-100"
      >
        {/* Left side - Healthcare Network Visualization */}
        <div className="hidden lg:block w-2/5 h-[750px] relative overflow-hidden border-r border-gray-100">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
            <HealthcareNetworkMap />
            
            {/* MindHub branding overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10">
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="mb-8"
              >
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-teal-500 via-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-teal-200 relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 opacity-20 animate-pulse"></div>
                  <Heart className="text-white h-8 w-8 z-10" />
                  <Brain className="text-white h-6 w-6 absolute top-2 right-2 z-10" />
                </div>
              </motion.div>
              
              <motion.h2 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                className="text-4xl font-bold mb-4 text-center"
              >
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600">
                  MindHub
                </span>
              </motion.h2>
              
              <motion.p 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="text-sm text-center text-gray-600 max-w-xs leading-relaxed"
              >
                Únete a la plataforma que está revolucionando la gestión sanitaria. 
                Conecta tu clínica al futuro del healthcare digital
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="mt-8 grid grid-cols-2 gap-4 text-xs text-gray-600"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                  <span>Expedientes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  <span>Evaluaciones</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <span>Agenda</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span>Recursos</span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
        
        {/* Right side - Sign Up Form */}
        <div className="w-full lg:w-3/5 p-8 md:p-12 flex flex-col justify-center bg-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-lg mx-auto w-full"
          >
            <h1 className="text-3xl font-bold mb-2 text-gray-900">
              Crear cuenta MindHub
            </h1>
            <p className="text-gray-500 mb-8">
              Configura tu clínica en menos de 5 minutos
            </p>
            
            {/* Google Sign Up Button */}
            <div className="mb-6">
              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-3 bg-gray-50 border border-gray-200 rounded-lg p-3 hover:bg-gray-100 hover:border-gray-300 transition-all duration-300 text-gray-700 shadow-sm h-12"
                onClick={onGoogleSignUp}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fillOpacity=".54"
                  />
                  <path
                    fill="#4285F4"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#34A853"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="font-medium">Registrar con Google</span>
              </Button>
            </div>
            
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">o</span>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre <span className="text-teal-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      placeholder="Juan"
                      required
                      className="bg-gray-50 border-gray-200 placeholder:text-gray-400 text-gray-800 w-full pl-10 focus:border-teal-500 focus:ring-teal-500 h-11 rounded-lg"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Apellidos <span className="text-teal-500">*</span>
                  </label>
                  <Input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    placeholder="Pérez"
                    required
                    className="bg-gray-50 border-gray-200 placeholder:text-gray-400 text-gray-800 w-full focus:border-teal-500 focus:ring-teal-500 h-11 rounded-lg"
                  />
                </div>
              </div>
              
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Correo electrónico <span className="text-teal-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="tu@clinica.com"
                    required
                    className="bg-gray-50 border-gray-200 placeholder:text-gray-400 text-gray-800 w-full pl-10 focus:border-teal-500 focus:ring-teal-500 h-11 rounded-lg"
                  />
                </div>
              </div>
              
              {/* Clinic Name */}
              <div>
                <label htmlFor="clinicName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la clínica <span className="text-teal-500">*</span>
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="clinicName"
                    type="text"
                    value={formData.clinicName}
                    onChange={(e) => handleInputChange("clinicName", e.target.value)}
                    placeholder="Centro Médico San Juan"
                    required
                    className="bg-gray-50 border-gray-200 placeholder:text-gray-400 text-gray-800 w-full pl-10 focus:border-teal-500 focus:ring-teal-500 h-11 rounded-lg"
                  />
                </div>
              </div>
              
              {/* Password Fields */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña <span className="text-teal-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="password"
                      type={isPasswordVisible ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      required
                      className="bg-gray-50 border-gray-200 placeholder:text-gray-400 text-gray-800 w-full pl-10 pr-12 focus:border-teal-500 focus:ring-teal-500 h-11 rounded-lg"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 hover:text-gray-700 transition-colors"
                      onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                    >
                      {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar contraseña <span className="text-teal-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="confirmPassword"
                      type={isConfirmPasswordVisible ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      placeholder="Confirma tu contraseña"
                      required
                      className="bg-gray-50 border-gray-200 placeholder:text-gray-400 text-gray-800 w-full pl-10 pr-12 focus:border-teal-500 focus:ring-teal-500 h-11 rounded-lg"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 hover:text-gray-700 transition-colors"
                      onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                    >
                      {isConfirmPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>
              
              <motion.div 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
                className="pt-4"
              >
                <Button
                  type="submit"
                  className={cn(
                    "w-full relative overflow-hidden text-white py-3 h-12 rounded-lg transition-all duration-300 font-medium shadow-primary",
                    "bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 hover:from-teal-700 hover:via-cyan-700 hover:to-blue-700",
                    isHovered ? "shadow-primary-hover" : ""
                  )}
                >
                  <span className="flex items-center justify-center relative z-10">
                    Crear mi cuenta MindHub
                  </span>
                  {isHovered && (
                    <motion.span
                      initial={{ left: "-100%" }}
                      animate={{ left: "100%" }}
                      transition={{ duration: 1, ease: "easeInOut" }}
                      className="absolute top-0 bottom-0 left-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent z-0"
                      style={{ filter: "blur(8px)" }}
                    />
                  )}
                </Button>
              </motion.div>
              
              <div className="text-center mt-6">
                <span className="text-gray-600 text-sm">
                  ¿Ya tienes una cuenta?{" "}
                </span>
                <button 
                  type="button"
                  onClick={onSignInRedirect}
                  className="text-teal-600 hover:text-teal-700 text-sm font-medium transition-colors hover:underline"
                >
                  Iniciar sesión
                </button>
              </div>
              
              <div className="text-xs text-gray-500 text-center mt-4 leading-relaxed">
                Al crear tu cuenta, aceptas nuestros términos de servicio y política de privacidad 
                para el tratamiento de datos sanitarios según RGPD
              </div>
            </form>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};