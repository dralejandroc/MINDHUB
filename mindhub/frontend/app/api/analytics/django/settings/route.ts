/**
 * Analytics API - Settings Proxy to Django
 * Provides analytics settings management
 */

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

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

    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')

    // Mock settings data for now
    const mockSettings = {
      id: 'analytics_settings_001',
      clinic_id: clinicId,
      workspace_id: null,
      enabled_indicators: [
        'patient_growth_rate',
        'appointment_completion_rate',
        'clinical_note_quality'
      ],
      custom_targets: {
        'patient_growth_rate': 8.0,
        'appointment_completion_rate': 90.0,
        'clinical_note_quality': 95.0
      },
      notification_preferences: {
        email_alerts: true,
        threshold_alerts: true,
        weekly_reports: false,
        monthly_reports: true,
        alert_threshold: 80
      },
      dashboard_layout: {
        show_trends: true,
        show_classifications: true,
        show_satisfaction: true,
        card_size: 'normal'
      },
      clinical_guidelines: {
        abandonment_tolerance_days: 15,
        minimum_note_completeness: 80,
        protocol_deviation_threshold: 10
      }
    }

    return NextResponse.json({
      results: clinicId ? [mockSettings] : [],
      count: clinicId ? 1 : 0,
      message: 'Analytics settings loaded successfully'
    })

  } catch (error) {
    console.error('Analytics settings GET proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics settings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Mock successful creation
    const createdSettings = {
      id: 'analytics_settings_' + Date.now(),
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    return NextResponse.json(createdSettings, { status: 201 })

  } catch (error) {
    console.error('Analytics settings POST proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to create analytics settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Mock successful update
    const updatedSettings = {
      ...body,
      updated_at: new Date().toISOString()
    }

    return NextResponse.json(updatedSettings)

  } catch (error) {
    console.error('Analytics settings PUT proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to update analytics settings' },
      { status: 500 }
    )
  }
}