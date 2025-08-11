import { NextRequest, NextResponse } from 'next/server';

/**
 * ClinimetrixPro Templates Catalog API Route
 * Proxies requests to the backend ClinimetrixPro API
 */

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_URL || 'https://mindhub-production.up.railway.app';

export async function GET(request: NextRequest) {
  try {
    // Forward authentication headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Forward Authorization header (Clerk token)
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    // Forward user context
    const userContextHeader = request.headers.get('X-User-Context');
    if (userContextHeader) {
      headers['X-User-Context'] = userContextHeader;
    }

    const response = await fetch(`${BACKEND_URL}/api/clinimetrix-pro/templates/catalog`, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('ClinimetrixPro Templates Catalog API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates catalog from ClinimetrixPro API' }, 
      { status: 500 }
    );
  }
}