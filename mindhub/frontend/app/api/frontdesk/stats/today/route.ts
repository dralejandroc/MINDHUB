import { NextRequest, NextResponse } from 'next/server';

// Prevent static generation for this API route
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_URL || 'https://mindhub-django-backend.vercel.app';

export async function GET(request: NextRequest) {
  try {
    // Forward authentication headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Forward Authorization header (Auth token)
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    // Forward user context
    const userContextHeader = request.headers.get('X-User-Context');
    if (userContextHeader) {
      headers['X-User-Context'] = userContextHeader;
    }

    const response = await fetch(`${BACKEND_URL}/api/frontdesk/stats/today`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying frontdesk stats today request:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch today stats from backend',
        data: {
          appointments: {
            total: 8,
            confirmed: 6,
            pending: 1,
            cancelled: 1
          },
          tasks: {
            total: 12,
            completed: 8,
            pending: 4
          },
          patients: {
            total: 15,
            new: 3,
            returning: 12
          }
        }
      }, 
      { status: 500 }
    );
  }
}