import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, createResponse, createErrorResponse } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const DJANGO_BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_DJANGO_API_URL || 'https://mindhub-django-backend.vercel.app';

export async function GET(request: NextRequest) {
  try {
    console.log('[DAILY STATS API] Processing GET request - Django Backend Proxy');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Extract query parameters from original request
    const url = new URL(request.url);
    const queryString = url.search; // Preserves all query parameters

    // Build Django backend URL
    const djangoUrl = `${DJANGO_BACKEND_URL}/api/expedix/agenda/daily-stats${queryString}`;
    console.log('[DAILY STATS API] Proxying to Django:', djangoUrl);

    // Use service role key for Django auth since we've already validated the user
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YmNwbGR6b3lpY2VmZHRud2tkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQwMTQ3MCwiZXhwIjoyMDcwOTc3NDcwfQ.-iooltGuYeGqXVh7pgRhH_Oo_R64VtHIssbE3u_y0WQ';
    
    const djangoResponse = await fetch(djangoUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'X-User-ID': user.id,
        'X-User-Email': user.email || '',
        'X-Proxy-Auth': 'verified',
      }
    });

    console.log('[DAILY STATS API] Django response status:', djangoResponse.status);

    if (!djangoResponse.ok) {
      const errorText = await djangoResponse.text();
      console.error('[DAILY STATS API] Django backend error:', errorText);
      
      // Return empty stats when backend fails
      return createResponse({
        expectedIncome: 0,
        advancePayments: 0,
        actualIncome: 0,
        firstTimeConsultations: 0,
        followUpConsultations: 0,
        videoConsultations: 0,
        blockedSlots: 0,
        blockedReasons: []
      });
    }

    // Get response data from Django
    const responseData = await djangoResponse.json();
    console.log('[DAILY STATS API] Successfully proxied to Django');

    // Return Django response as-is
    return createResponse(responseData);

  } catch (error) {
    console.error('[DAILY STATS API] Proxy error:', error);
    
    // Return empty stats on error
    return createResponse({
      expectedIncome: 0,
      advancePayments: 0,
      actualIncome: 0,
      firstTimeConsultations: 0,
      followUpConsultations: 0,
      videoConsultations: 0,
      blockedSlots: 0,
      blockedReasons: []
    });
  }
}