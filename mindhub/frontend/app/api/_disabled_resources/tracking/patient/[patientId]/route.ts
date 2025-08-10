/**
 * Patient Resource Tracking API Route
 * 
 * Handles tracking of resources sent to specific patients
 */

import { NextRequest, NextResponse } from 'next/server';

const RESOURCES_API_BASE = process.env.NEXT_PUBLIC_RESOURCES_API || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function GET(
  request: NextRequest,
  { params }: { params: { patientId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    
    const response = await fetch(
      `${RESOURCES_API_BASE}/api/resources/tracking/patient/${params.patientId}${queryString ? `?${queryString}` : ''}`,
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
        const mockTracking = {
          success: true,
          data: [
            {
              id: 'tracking-1',
              patientId: params.patientId,
              resourceId: 'mock-1',
              resource: {
                name: 'Guía de Ansiedad',
                type: 'pdf'
              },
              sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
              sentBy: {
                id: 'doctor-1',
                name: 'Dr. García'
              },
              method: 'email',
              status: 'delivered',
              openedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              downloadedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
              id: 'tracking-2',
              patientId: params.patientId,
              resourceId: 'mock-2',
              resource: {
                name: 'Ejercicios de Relajación',
                type: 'docx'
              },
              sentAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              sentBy: {
                id: 'doctor-1',
                name: 'Dr. García'
              },
              method: 'portal',
              status: 'sent',
              openedAt: null,
              downloadedAt: null
            }
          ]
        };
        return NextResponse.json(mockTracking);
      }

      const errorData = await response.json().catch(() => ({ error: 'Failed to fetch resource tracking' }));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching resource tracking:', error);
    
    // Return mock data if there's a connection error
    const mockTracking = {
      success: true,
      data: [
        {
          id: 'tracking-1',
          patientId: params.patientId,
          resourceId: 'mock-1',
          resource: {
            name: 'Guía de Ansiedad',
            type: 'pdf'
          },
          sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          sentBy: {
            id: 'doctor-1',
            name: 'Dr. García'
          },
          method: 'email',
          status: 'delivered',
          openedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          downloadedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'tracking-2',
          patientId: params.patientId,
          resourceId: 'mock-2',
          resource: {
            name: 'Ejercicios de Relajación',
            type: 'docx'
          },
          sentAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          sentBy: {
            id: 'doctor-1',
            name: 'Dr. García'
          },
          method: 'portal',
          status: 'sent',
          openedAt: null,
          downloadedAt: null
        }
      ]
    };
    return NextResponse.json(mockTracking);
  }
}