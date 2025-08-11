import { NextRequest, NextResponse } from 'next/server';

/**
 * ClinimetrixPro Template by ID API Route
 * Proxies requests to get specific template data
 */

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_URL || 'https://mindhub-production.up.railway.app';

export async function GET(request: NextRequest, { params }: { params: { templateId: string } }) {
  try {
    const { templateId } = params;
    
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

    const response = await fetch(`${BACKEND_URL}/api/clinimetrix-pro/templates/${templateId}`, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('ClinimetrixPro Template API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template from ClinimetrixPro API' }, 
      { status: 500 }
    );
  }
}