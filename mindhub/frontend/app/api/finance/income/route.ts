import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, createResponse, createErrorResponse } from '@/lib/supabase/admin'

// Prevent static generation for this API route
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'https://mindhub-django-backend.vercel.app';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    

    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      console.error('[EXPEDIX APPOINTMENTS PROXY] Auth error:', authError);
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }
    console.log('TEST INCOME AUTH:', request.headers.get('Authorization'));
    // Forward all query parameters
    const params = new URLSearchParams();
    searchParams.forEach((value, key) => {
      params.append(key, value);
    });
    
    let url = `${BACKEND_URL}/api/finance/api/income/`;
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    // Forward authentication headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Forward Authorization header (Auth token)
    const authHeader = request.headers.get('Authorization');
    console.log('AUTHHEADER:', authHeader);
  
    
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    // Forward user context
    // const userContextHeader = request.headers.get('X-User-Context');
    // if (userContextHeader) {
    //   headers['X-User-Context'] = userContextHeader;
    // }
    console.log('FINAL URL:', url);
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying finance income GET request:', error);
    
    // Return empty data instead of mock data - real data only!
    return NextResponse.json(
      { 
        success: true, 
        message: 'No data available - backend connection failed',
        data: [], // Empty array - NO MOCK DATA
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0
        }
      }, 
      { status: 200 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
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
    
    const response = await fetch(`${BACKEND_URL}/api/finance/api/income/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating income record:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create income record',
        message: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    );
  }
}