'use client'

import { useState } from 'react'
import { usePatients, useCreatePatient } from '@/lib/apollo/hooks/usePatients'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/badge'

/**
 * Componente de demostración para mostrar cómo usar GraphQL
 * con pacientes en lugar de las APIs REST actuales
 * 
 * Esta es una demostración de:
 * ANTES: Frontend → Next.js API → Django REST → Supabase
 * AHORA: Frontend → Apollo Client → Supabase GraphQL
 */
export default function GraphQLPatientsDemo() {
  const [showDemo, setShowDemo] = useState(false)
  
  // Hook GraphQL para obtener pacientes
  const { data, loading, error, refetch } = usePatients({
    first: 5,
    filter: { is_active: { eq: true } }
  })

  // Hook GraphQL para crear paciente
  const { createPatient, loading: creating } = useCreatePatient()

  const handleCreateTestPatient = async () => {
    try {
      await createPatient({
        variables: {
          input: {
            first_name: `Test GraphQL ${Date.now()}`,
            last_name: 'Patient',
            email: `test${Date.now()}@example.com`,
            phone: '555-0123',
            gender: 'other',
            is_active: true,
            clinic_id: '550e8400-e29b-41d4-a716-446655440000' // Mock clinic ID
          }
        }
      })
      
      // Refrescar la lista
      refetch()
    } catch (error) {
      console.error('Error creating patient via GraphQL:', error)
    }
  }

  if (!showDemo) {
    return (
      <Card className="border border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800 flex items-center gap-2">
            🚀 GraphQL Demo Available
            <Badge variant="secondary">New</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-blue-700 mb-4">
            Demostración de GraphQL vs REST API. Muestra cómo los pacientes pueden
            obtenerse directamente desde Supabase sin pasar por Django.
          </p>
          <Button 
            onClick={() => setShowDemo(true)}
            variant="primary"
            className="bg-blue-600 hover:bg-blue-700"
          >
            Ver Demo GraphQL
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="border border-green-200 bg-green-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-green-800">
              ✅ GraphQL Direct Connection Demo
            </CardTitle>
            <Button 
              onClick={() => setShowDemo(false)}
              variant="ghost"
              size="sm"
            >
              Ocultar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <h4 className="font-semibold text-red-800 mb-2">❌ ANTES (REST)</h4>
              <p className="text-sm text-red-700">
                Frontend → API Route → Django → PostgreSQL<br/>
                <span className="text-xs">4 capas, múltiples puntos de fallo</span>
              </p>
            </div>
            
            <div className="p-3 bg-green-100 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">✅ AHORA (GraphQL)</h4>
              <p className="text-sm text-green-700">
                Frontend → Supabase GraphQL → PostgreSQL<br/>
                <span className="text-xs">2 capas, conexión directa</span>
              </p>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <Button 
              onClick={handleCreateTestPatient}
              disabled={creating}
              variant="primary"
              size="sm"
            >
              {creating ? 'Creando...' : 'Crear Paciente Test'}
            </Button>
            
            <Button 
              onClick={() => refetch()}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              {loading ? 'Cargando...' : 'Refrescar'}
            </Button>
          </div>

          {error && (
            <div className="p-3 bg-red-100 border border-red-300 rounded-lg mb-4">
              <h4 className="font-semibold text-red-800 mb-1">Error GraphQL:</h4>
              <p className="text-sm text-red-700">{error.message}</p>
            </div>
          )}

          <div>
            <h4 className="font-semibold mb-2">
              Pacientes obtenidos via GraphQL ({data?.patientsCollection?.edges?.length || 0}):
            </h4>
            
            {loading ? (
              <p className="text-gray-600">Cargando pacientes...</p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {data?.patientsCollection?.edges?.map((edge: any) => (
                  <div 
                    key={edge.node.id} 
                    className="p-2 bg-white border rounded-lg flex justify-between items-center"
                  >
                    <div>
                      <span className="font-medium">
                        {edge.node.first_name} {edge.node.last_name}
                      </span>
                      <span className="text-sm text-gray-600 ml-2">
                        {edge.node.email}
                      </span>
                    </div>
                    <Badge variant={edge.node.is_active ? "default" : "secondary"}>
                      {edge.node.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                ))}
                
                {(!data?.patientsCollection?.edges || data.patientsCollection.edges.length === 0) && !loading && (
                  <p className="text-gray-500 italic">
                    No hay pacientes. Crea uno usando el botón de arriba.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 p-3 bg-blue-100 rounded-lg">
            <h5 className="font-semibold text-blue-800 mb-1">💡 Nota Técnica:</h5>
            <p className="text-sm text-blue-700">
              Este componente usa Apollo Client hooks que conectan directamente 
              a Supabase GraphQL API. Las RLS policies aseguran que solo veas 
              pacientes de tu clínica. <strong>Sin Django, sin API routes</strong>.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}