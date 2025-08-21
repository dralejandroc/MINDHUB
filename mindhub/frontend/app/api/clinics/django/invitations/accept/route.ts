/**
 * Clinic Invitation Acceptance API Proxy Route
 * Handles accepting clinic team invitations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const DJANGO_BASE_URL = process.env.DJANGO_BASE_URL || 'https://mindhub-django-backend.vercel.app';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      return NextResponse.json({ error: 'No authentication token' }, { status: 401 });
    }

    const body = await request.json();
    const djangoUrl = `${DJANGO_BASE_URL}/api/clinics/invitations/accept/`;

    const response = await fetch(djangoUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        'X-Proxy-Auth': 'verified',
        'X-User-ID': session.user.id,
        'X-User-Email': session.user.email || '',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Django invitation acceptance error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to accept invitation', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Invitation acceptance proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}