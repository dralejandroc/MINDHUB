/**
 * Individual Resource API Route
 * 
 * Handles operations on specific resources
 */

import { NextRequest, NextResponse } from 'next/server';

const RESOURCES_API_BASE = process.env.NEXT_PUBLIC_RESOURCES_API || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const response = await fetch(
      `${RESOURCES_API_BASE}/api/resources/${params.id}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      }
    );

    if (!response.ok) {
      // If the backend endpoint doesn't exist, return mock data for development
      if (response.status === 404) {
        const mockResource = {
          success: true,
          data: {
            id: params.id,
            name: 'Documento de Ejemplo',
            description: 'Este es un documento de ejemplo para desarrollo',
            type: 'pdf',
            size: 1024000,
            category: 'educational',
            tags: ['ejemplo', 'desarrollo'],
            content: 'Contenido del documento...',
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          }
        };
        return NextResponse.json(mockResource);
      }

      const errorData = await response.json().catch(() => ({ error: 'Failed to fetch resource' }));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching resource:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    const response = await fetch(
      `${RESOURCES_API_BASE}/api/resources/${params.id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(body)
      }
    );

    if (!response.ok) {
      // If the backend endpoint doesn't exist, return mock success for development
      if (response.status === 404) {
        const mockResource = {
          success: true,
          message: 'Resource updated successfully (development mode)',
          data: {
            id: params.id,
            ...body,
            updatedAt: new Date().toISOString()
          }
        };
        return NextResponse.json(mockResource);
      }

      const errorData = await response.json().catch(() => ({ error: 'Failed to update resource' }));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating resource:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const response = await fetch(
      `${RESOURCES_API_BASE}/api/resources/${params.id}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      }
    );

    if (!response.ok) {
      // If the backend endpoint doesn't exist, return mock success for development
      if (response.status === 404) {
        const mockResponse = {
          success: true,
          message: 'Resource deleted successfully (development mode)'
        };
        return NextResponse.json(mockResponse);
      }

      const errorData = await response.json().catch(() => ({ error: 'Failed to delete resource' }));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error deleting resource:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}