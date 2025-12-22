'use client';

import { FlickeringGrid } from '@/components/ui/flickering-grid';

export function StorytellingSection() {
  return (
    <section className="relative py-16 bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/30 overflow-hidden">
      {/* Subtle FlickeringGrid Background */}
      <div className="absolute inset-0 z-0">
        <FlickeringGrid
          squareSize={3}
          gridGap={9}
          flickerChance={0.2}
          color="rgb(6, 182, 212)" // secondary-500
          maxOpacity={0.06}
          className="w-full h-full"
        />
      </div>
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            El reto diario de los profesionales de salud mental
          </h2>
        </div>
        
        <div className="space-y-8 text-lg text-gray-700 leading-relaxed text-center">
          <p>
            Cada día, psicólogos y psiquiatras dedican horas valiosas a tareas administrativas que los alejan 
            de lo más importante: sus pacientes. Entre expedientes dispersos, escalas clínicas en papel, 
            y sistemas desconectados, el tiempo se fragmenta y la práctica se vuelve menos eficiente.
          </p>
          
          <p>
            <strong className="text-gray-900">Glian nace de esta realidad.</strong> Desarrollado por profesionales 
            de salud mental para profesionales de salud mental, integra todo lo que necesitas en una sola plataforma: 
            expedientes digitales completos, escalas clinimétricas validadas científicamente, recursos terapéuticos 
            organizados y herramientas de gestión práctica.
          </p>
          
          <p>
            No más tiempo perdido en tareas repetitivas. No más información dispersa. 
            <strong className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600"> Solo más tiempo para lo que realmente importa: 
            brindar el mejor cuidado a tus pacientes.</strong>
          </p>
        </div>
      </div>
    </section>
  );
}