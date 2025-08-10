/**
 * Active Professional Contract API Route
 * 
 * Handles fetching the active contract for a specific professional
 */

import { NextRequest, NextResponse } from 'next/server';

const FINANCE_API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function GET(
  request: NextRequest,
  { params }: { params: { professionalId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    
    const response = await fetch(
      `${FINANCE_API_BASE}/api/finance/professional-contracts/professional/${params.professionalId}/active${queryString ? `?${queryString}` : ''}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to fetch active contract' }));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching active contract:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}