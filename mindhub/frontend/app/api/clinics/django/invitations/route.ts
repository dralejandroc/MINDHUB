/**
 * Clinic Invitations API Proxy Route
 * Forwards requests to Django REST API for clinic team management
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const DJANGO_BASE_URL = process.env.DJANGO_BASE_URL || 'https://mindhub-django-backend.vercel.app';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      return NextResponse.json({ error: 'No authentication token' }, { status: 401 });
    }

    const url = new URL(request.url);
    const queryString = url.searchParams.toString();
    const djangoUrl = `${DJANGO_BASE_URL}/api/clinics/invitations/${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(djangoUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        'X-Proxy-Auth': 'verified',
        'X-User-ID': session.user.id,
        'X-User-Email': session.user.email || '',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Django invitations fetch error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to fetch invitations', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Invitations API proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      return NextResponse.json({ error: 'No authentication token' }, { status: 401 });
    }

    const body = await request.json();
    const djangoUrl = `${DJANGO_BASE_URL}/api/clinics/invitations/`;

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
      console.error('Django invitation creation error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to create invitation', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Invitation creation proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}