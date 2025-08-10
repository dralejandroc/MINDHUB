/**
 * Close Cash Register Cut API Route
 * 
 * Handles closing specific cash register cuts
 */

import { NextRequest, NextResponse } from 'next/server';

const FINANCE_API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}));
    
    const response = await fetch(
      `${FINANCE_API_BASE}/api/finance/cash-register/cuts/${params.id}/close`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(body)
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to close cash cut' }));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error closing cash cut:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}