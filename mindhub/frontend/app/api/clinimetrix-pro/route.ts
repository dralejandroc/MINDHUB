import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    // Map frontend URL to correct Django backend URL
    const path = request.nextUrl.pathname.replace('/api/clinimetrix-pro', '');
    let djangoEndpoint = '/assessments/react-api'; // Default endpoint
    
    // Map specific endpoints to react-api URLs
    if (path.includes('/templates/catalog')) {
      djangoEndpoint = '/assessments/react-api/catalog';
    } else if (path.startsWith('/templates/')) {
      const templateId = path.replace('/templates/', '');
      djangoEndpoint = `/assessments/react-api/template/${templateId}`;
    } else if (path.includes('/assessments')) {
      djangoEndpoint = `/assessments/react-api${path.replace('/assessments', '')}`;
    } else if (path.includes('/health')) {
      djangoEndpoint = '/assessments/react-api/health';
    }
    
    const backendUrl = `${BACKEND_URL}${djangoEndpoint}${queryString ? `?${queryString}` : ''}`;

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

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers,
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Clinimetrix Pro API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from Clinimetrix Pro API' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Map frontend URL to correct Django backend URL  
    const path = request.nextUrl.pathname.replace('/api/clinimetrix-pro', '');
    let djangoEndpoint = '/assessments/react-api'; // Default endpoint
    
    // Map specific endpoints for POST
    if (path.includes('/assessments/new')) {
      djangoEndpoint = '/assessments/react-api/assessment/create';
    } else if (path.includes('/assessments/') && path.includes('/responses')) {
      const assessmentId = path.split('/')[2]; // Extract assessment ID
      djangoEndpoint = `/assessments/react-api/assessment/${assessmentId}/responses`;
    } else if (path.includes('/assessments/') && path.includes('/complete')) {
      const assessmentId = path.split('/')[2]; // Extract assessment ID
      djangoEndpoint = `/assessments/react-api/assessment/${assessmentId}/complete`;
    }
    
    const backendUrl = `${BACKEND_URL}${djangoEndpoint}`;

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

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Clinimetrix Pro API Error:', error);
    return NextResponse.json(
      { error: 'Failed to post to Clinimetrix Pro API' },
      { status: 500 }
    );
  }
}