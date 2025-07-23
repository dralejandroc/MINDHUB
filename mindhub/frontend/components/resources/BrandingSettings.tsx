'use client';

import React, { useState, useRef } from 'react';
import {
  ArrowLeftIcon,
  PhotoIcon,
  TrashIcon,
  EyeIcon,
  Cog6ToothIcon,
  PaintBrushIcon,
  SwatchIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';

interface BrandingSettingsProps {
  onBack: () => void;
}

interface BrandingConfig {
  logo?: {
    file: File | null;
    url: string;
    position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
    size: 'small' | 'medium' | 'large';
  };
  background?: {
    type: 'color' | 'image' | 'none';
    value: string;
    opacity: number;
  };
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  typography: {
    fontFamily: string;
    fontSize: number;
    lineHeight: number;
  };
  colors: {
    primary: string;
    secondary: string;
    text: string;
  };
}

const DEFAULT_CONFIG: BrandingConfig = {
  logo: {
    file: null,
    url: '',
    position: 'top-right',
    size: 'medium'
  },
  background: {
    type: 'none',
    value: '#ffffff',
    opacity: 100
  },
  margins: {
    top: 40,
    bottom: 40,
    left: 40,
    right: 40
  },
  typography: {
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 1.5
  },
  colors: {
    primary: '#3B82F6',
    secondary: '#6B7280',
    text: '#111827'
  }
};

export const BrandingSettings: React.FC<BrandingSettingsProps> = ({ onBack }) => {
  const [config, setConfig] = useState<BrandingConfig>(DEFAULT_CONFIG);
  const [activeTab, setActiveTab] = useState<'logo' | 'background' | 'layout' | 'typography' | 'preview'>('logo');
  const logoInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setConfig(prev => ({
          ...prev,
          logo: {
            ...prev.logo!,
            file,
            url: e.target?.result as string
          }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setConfig(prev => ({
          ...prev,
          background: {
            ...prev.background!,
            type: 'image',
            value: e.target?.result as string
          }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveConfig = async () => {
    try {
      // Here would be the API call to save the branding configuration
      console.log('Saving branding config:', config);
      // await resourcesApi.saveBrandingConfig(config);
      alert('Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error saving branding config:', error);
      alert('Error al guardar la configuración');
    }
  };

  const tabs = [
    { id: 'logo', name: 'Logotipo', icon: PhotoIcon },
    { id: 'background', name: 'Fondo', icon: SwatchIcon },
    { id: 'layout', name: 'Márgenes', icon: DocumentTextIcon },
    { id: 'typography', name: 'Tipografía', icon: Cog6ToothIcon },
    { id: 'preview', name: 'Vista Previa', icon: EyeIcon }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button
            onClick={onBack}
            variant="outline"
            className="mr-4"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Personalización de Marca</h2>
            <p className="text-sm text-gray-600">Configura el diseño y branding de tus recursos</p>
          </div>
        </div>
        <Button
          onClick={handleSaveConfig}
          className="bg-orange-600 hover:bg-orange-700 text-white"
        >
          <CheckCircleIcon className="w-4 h-4 mr-2" />
          Guardar Configuración
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Logo Tab */}
          {activeTab === 'logo' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Configuración de Logotipo</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subir Logotipo
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors">
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      {config.logo?.url ? (
                        <div className="space-y-2">
                          <img
                            src={config.logo.url}
                            alt="Logo preview"
                            className="h-20 w-auto mx-auto"
                          />
                          <div className="flex justify-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => logoInputRef.current?.click()}
                            >
                              Cambiar Logo
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setConfig(prev => ({
                                ...prev,
                                logo: { ...prev.logo!, file: null, url: '' }
                              }))}
                              className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto" />
                          <Button
                            onClick={() => logoInputRef.current?.click()}
                            variant="outline"
                          >
                            <ArrowUpTrayIcon className="w-4 h-4 mr-2" />
                            Subir Logo
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Posición del Logo
                    </label>
                    <select
                      value={config.logo?.position}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        logo: { ...prev.logo!, position: e.target.value as any }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="top-left">Superior Izquierda</option>
                      <option value="top-center">Superior Centro</option>
                      <option value="top-right">Superior Derecha</option>
                      <option value="bottom-left">Inferior Izquierda</option>
                      <option value="bottom-center">Inferior Centro</option>
                      <option value="bottom-right">Inferior Derecha</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tamaño del Logo
                    </label>
                    <select
                      value={config.logo?.size}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        logo: { ...prev.logo!, size: e.target.value as any }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="small">Pequeño</option>
                      <option value="medium">Mediano</option>
                      <option value="large">Grande</option>
                    </select>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Vista Previa</h4>
                  <div className="bg-white rounded border p-4 h-64 relative">
                    {config.logo?.url && (
                      <img
                        src={config.logo.url}
                        alt="Logo preview"
                        className={`absolute ${
                          config.logo.size === 'small' ? 'h-8' :
                          config.logo.size === 'medium' ? 'h-12' : 'h-16'
                        } w-auto ${
                          config.logo.position.includes('top') ? 'top-2' : 'bottom-2'
                        } ${
                          config.logo.position.includes('left') ? 'left-2' :
                          config.logo.position.includes('right') ? 'right-2' : 'left-1/2 transform -translate-x-1/2'
                        }`}
                      />
                    )}
                    <div className="h-full flex items-center justify-center text-gray-400">
                      Documento de ejemplo
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Background Tab */}
          {activeTab === 'background' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Configuración de Fondo</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Fondo
                    </label>
                    <select
                      value={config.background?.type}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        background: { ...prev.background!, type: e.target.value as any }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="none">Sin Fondo</option>
                      <option value="color">Color Sólido</option>
                      <option value="image">Imagen</option>
                    </select>
                  </div>

                  {config.background?.type === 'color' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Color de Fondo
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={config.background.value}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            background: { ...prev.background!, value: e.target.value }
                          }))}
                          className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={config.background.value}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            background: { ...prev.background!, value: e.target.value }
                          }))}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>
                  )}

                  {config.background?.type === 'image' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Imagen de Fondo
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        <input
                          ref={backgroundInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleBackgroundUpload}
                          className="hidden"
                        />
                        <Button
                          onClick={() => backgroundInputRef.current?.click()}
                          variant="outline"
                        >
                          <ArrowUpTrayIcon className="w-4 h-4 mr-2" />
                          Subir Imagen
                        </Button>
                      </div>
                    </div>
                  )}

                  {config.background?.type !== 'none' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Opacidad: {config.background?.opacity}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={config.background?.opacity}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          background: { ...prev.background!, opacity: parseInt(e.target.value) }
                        }))}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Vista Previa</h4>
                  <div 
                    className="bg-white rounded border p-4 h-64 relative overflow-hidden"
                    style={{
                      backgroundColor: config.background?.type === 'color' ? config.background.value : '#ffffff',
                      backgroundImage: config.background?.type === 'image' ? `url(${config.background.value})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    <div 
                      className="absolute inset-0 bg-white"
                      style={{ 
                        opacity: config.background?.type !== 'none' ? (100 - (config.background?.opacity || 0)) / 100 : 0 
                      }}
                    />
                    <div className="relative h-full flex items-center justify-center text-gray-600">
                      Contenido del documento
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Layout Tab */}
          {activeTab === 'layout' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Configuración de Márgenes</h3>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {(['top', 'bottom', 'left', 'right'] as const).map((margin) => (
                  <div key={margin}>
                    <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                      {margin === 'top' ? 'Superior' :
                       margin === 'bottom' ? 'Inferior' :
                       margin === 'left' ? 'Izquierdo' : 'Derecho'}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={config.margins[margin]}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          margins: { ...prev.margins, [margin]: parseInt(e.target.value) || 0 }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      <span className="absolute right-3 top-2 text-sm text-gray-500">px</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Vista Previa de Márgenes</h4>
                <div 
                  className="bg-white border rounded-lg relative"
                  style={{ height: '300px' }}
                >
                  <div 
                    className="border-dashed border-2 border-orange-300 absolute bg-orange-50"
                    style={{
                      top: `${config.margins.top}px`,
                      bottom: `${config.margins.bottom}px`,
                      left: `${config.margins.left}px`,
                      right: `${config.margins.right}px`
                    }}
                  >
                    <div className="h-full flex items-center justify-center text-gray-600">
                      Área de contenido
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Typography Tab */}
          {activeTab === 'typography' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Configuración de Tipografía</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fuente
                    </label>
                    <select
                      value={config.typography.fontFamily}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        typography: { ...prev.typography, fontFamily: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="Inter">Inter</option>
                      <option value="Arial">Arial</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Georgia">Georgia</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tamaño de Fuente: {config.typography.fontSize}px
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="24"
                      value={config.typography.fontSize}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        typography: { ...prev.typography, fontSize: parseInt(e.target.value) }
                      }))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Altura de Línea: {config.typography.lineHeight}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="0.1"
                      value={config.typography.lineHeight}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        typography: { ...prev.typography, lineHeight: parseFloat(e.target.value) }
                      }))}
                      className="w-full"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Color Primario
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={config.colors.primary}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            colors: { ...prev.colors, primary: e.target.value }
                          }))}
                          className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={config.colors.primary}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            colors: { ...prev.colors, primary: e.target.value }
                          }))}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Vista Previa</h4>
                  <div className="bg-white rounded border p-4">
                    <div
                      style={{
                        fontFamily: config.typography.fontFamily,
                        fontSize: `${config.typography.fontSize}px`,
                        lineHeight: config.typography.lineHeight,
                        color: config.colors.text
                      }}
                    >
                      <h1 style={{ color: config.colors.primary, fontSize: `${config.typography.fontSize + 6}px`, marginBottom: '8px' }}>
                        Título de Documento
                      </h1>
                      <p style={{ marginBottom: '12px' }}>
                        Este es un ejemplo de cómo se verá el texto en tus documentos personalizados.
                      </p>
                      <p>
                        La tipografía seleccionada se aplicará a todo el contenido de texto en los recursos que generes.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preview Tab */}
          {activeTab === 'preview' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Vista Previa Completa</h3>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <div 
                  className="bg-white rounded border shadow-lg mx-auto"
                  style={{ 
                    width: '8.5in', 
                    height: '11in', 
                    maxWidth: '100%',
                    transform: 'scale(0.6)',
                    transformOrigin: 'top center'
                  }}
                >
                  <div
                    className="h-full relative"
                    style={{
                      backgroundColor: config.background?.type === 'color' ? config.background.value : '#ffffff',
                      backgroundImage: config.background?.type === 'image' ? `url(${config.background.value})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    {config.background?.type !== 'none' && (
                      <div 
                        className="absolute inset-0 bg-white"
                        style={{ 
                          opacity: (100 - (config.background?.opacity || 0)) / 100 
                        }}
                      />
                    )}
                    
                    {/* Logo */}
                    {config.logo?.url && (
                      <img
                        src={config.logo.url}
                        alt="Logo"
                        className={`absolute z-10 ${
                          config.logo.size === 'small' ? 'h-12' :
                          config.logo.size === 'medium' ? 'h-16' : 'h-20'
                        } w-auto ${
                          config.logo.position.includes('top') ? 'top-4' : 'bottom-4'
                        } ${
                          config.logo.position.includes('left') ? 'left-4' :
                          config.logo.position.includes('right') ? 'right-4' : 'left-1/2 transform -translate-x-1/2'
                        }`}
                      />
                    )}
                    
                    {/* Content Area */}
                    <div
                      className="relative z-0 h-full p-4"
                      style={{
                        paddingTop: `${config.margins.top + 16}px`,
                        paddingBottom: `${config.margins.bottom + 16}px`,
                        paddingLeft: `${config.margins.left + 16}px`,
                        paddingRight: `${config.margins.right + 16}px`
                      }}
                    >
                      <div
                        style={{
                          fontFamily: config.typography.fontFamily,
                          fontSize: `${config.typography.fontSize}px`,
                          lineHeight: config.typography.lineHeight,
                          color: config.colors.text
                        }}
                      >
                        <h1 style={{ 
                          color: config.colors.primary, 
                          fontSize: `${config.typography.fontSize + 8}px`, 
                          marginBottom: '16px',
                          fontWeight: 'bold'
                        }}>
                          Documento de Ejemplo
                        </h1>
                        
                        <p style={{ marginBottom: '12px' }}>
                          Este es un ejemplo de cómo se verán tus recursos personalizados con la configuración actual.
                        </p>
                        
                        <p style={{ marginBottom: '12px' }}>
                          La tipografía, colores, márgenes y elementos de marca se aplicarán automáticamente a todos los documentos que generes.
                        </p>
                        
                        <ul style={{ paddingLeft: '20px', marginBottom: '12px' }}>
                          <li style={{ marginBottom: '6px' }}>✓ Logotipo personalizado</li>
                          <li style={{ marginBottom: '6px' }}>✓ Colores de marca</li>
                          <li style={{ marginBottom: '6px' }}>✓ Tipografía profesional</li>
                          <li style={{ marginBottom: '6px' }}>✓ Márgenes optimizados</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Esta configuración se aplicará a todos los recursos que generes
                </p>
                <Button
                  onClick={handleSaveConfig}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <CheckCircleIcon className="w-4 h-4 mr-2" />
                  Confirmar y Guardar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};