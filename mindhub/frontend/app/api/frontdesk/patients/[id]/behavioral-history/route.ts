import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const patientId = params.id;

    // Call Django backend for behavioral history/assessments
    const djangoResponse = await fetch(
      `${process.env.NEXT_PUBLIC_DJANGO_API_URL}/api/expedix/patients/${patientId}/assessments/`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token}`,
        },
      }
    );

    if (!djangoResponse.ok) {
      // Return empty array instead of error for non-fatal cases
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
        message: 'No behavioral history found'
      });
    }

    const data = await djangoResponse.json();
    
    return NextResponse.json({
      success: true,
      data: data.results || data.data || [],
      total: data.count || data.total || 0
    });

  } catch (error) {
    console.error('Error fetching behavioral history:', error);
    
    // Return empty array for graceful fallback
    return NextResponse.json({
      success: true,
      data: [],
      total: 0,
      message: 'Behavioral history temporarily unavailable'
    });
  }
}