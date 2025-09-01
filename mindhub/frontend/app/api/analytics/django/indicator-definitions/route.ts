/**
 * Analytics API - Indicator Definitions Proxy to Django
 * Provides analytics indicator definitions for settings configuration
 */

import { NextRequest, NextResponse } from 'next/server'

const DJANGO_BASE_URL = process.env.DJANGO_API_URL || 'https://mindhub-django-backend.vercel.app'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    // Mock data for now since Django analytics endpoints don't exist yet
    const mockIndicators = [
      {
        id: 'patient_growth_rate',
        name: 'Tasa de Crecimiento de Pacientes',
        objective: 'Medir el crecimiento mensual de la base de pacientes activos',
        category: 'Crecimiento',
        indicator_type: 'growth',
        frequency: 'Mensual',
        target_value: 5.0,
        is_active: true,
        applies_to: 'Clínicas individuales'
      },
      {
        id: 'appointment_completion_rate',
        name: 'Tasa de Completitud de Citas',
        objective: 'Porcentaje de citas programadas que se completan exitosamente',
        category: 'Eficiencia',
        indicator_type: 'rate',
        frequency: 'Semanal',
        target_value: 85.0,
        is_active: true,
        applies_to: 'Clínicas y usuarios individuales'
      },
      {
        id: 'clinical_note_quality',
        name: 'Calidad de Notas Clínicas',
        objective: 'Evaluar la completitud y calidad de las notas clínicas',
        category: 'Calidad',
        indicator_type: 'quality',
        frequency: 'Diaria',
        target_value: 90.0,
        is_active: true,
        applies_to: 'Usuarios individuales'
      },
      {
        id: 'patient_satisfaction',
        name: 'Satisfacción del Paciente',
        objective: 'Medir la satisfacción general de los pacientes con el servicio',
        category: 'Satisfacción',
        indicator_type: 'satisfaction',
        frequency: 'Mensual',
        target_value: 4.5,
        is_active: true,
        applies_to: 'Clínicas individuales'
      },
      {
        id: 'treatment_adherence',
        name: 'Adherencia al Tratamiento',
        objective: 'Seguimiento de la adherencia de pacientes a planes de tratamiento',
        category: 'Calidad',
        indicator_type: 'adherence',
        frequency: 'Mensual',
        target_value: 75.0,
        is_active: true,
        applies_to: 'Clínicas y usuarios individuales'
      },
      {
        id: 'revenue_per_patient',
        name: 'Ingreso por Paciente',
        objective: 'Ingreso promedio generado por paciente activo',
        category: 'Gestión',
        indicator_type: 'financial',
        frequency: 'Mensual',
        target_value: 1500.0,
        is_active: true,
        applies_to: 'Clínicas individuales'
      }
    ]

    return NextResponse.json({
      results: mockIndicators,
      count: mockIndicators.length,
      message: 'Indicator definitions loaded successfully'
    })

  } catch (error) {
    console.error('Analytics indicator definitions proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch indicator definitions' },
      { status: 500 }
    )
  }
}