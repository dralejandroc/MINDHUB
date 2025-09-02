/**
 * Analytics API - Settings by ID Proxy to Django
 * Provides analytics settings management by ID
 */

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const DJANGO_BASE_URL = process.env.DJANGO_API_URL || 'https://mindhub-django-backend.vercel.app'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      id: params.id,
      ...body,
      updated_at: new Date().toISOString()
    }

    return NextResponse.json(updatedSettings)

  } catch (error) {
    console.error('Analytics settings PUT by ID proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to update analytics settings' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    // Mock successful deletion
    return NextResponse.json(
      { message: 'Analytics settings deleted successfully' },
      { status: 204 }
    )

  } catch (error) {
    console.error('Analytics settings DELETE proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to delete analytics settings' },
      { status: 500 }
    )
  }
}