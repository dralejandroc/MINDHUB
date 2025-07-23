import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Forward all query parameters
    const params = new URLSearchParams();
    searchParams.forEach((value, key) => {
      params.append(key, value);
    });
    
    let url = 'http://localhost:8080/api/v1/finance/stats';
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying finance stats request:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch financial statistics from backend',
        data: {
          summary: {
            totalAmount: 0,
            totalTransactions: 0,
            averageAmount: 0,
            period: {
              from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              to: new Date()
            }
          },
          breakdown: {
            bySource: [],
            byPaymentMethod: [],
            byProfessional: []
          },
          trends: {
            daily: []
          }
        }
      }, 
      { status: 500 }
    );
  }
}