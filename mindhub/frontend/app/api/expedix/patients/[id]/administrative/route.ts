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

    // Get both appointments and financial data from Django
    const [appointmentsResponse, financialResponse] = await Promise.all([
      fetch(
        `${process.env.NEXT_PUBLIC_DJANGO_API_URL}/api/agenda/appointments/`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.access_token}`,
            'X-Patient-Filter': patientId, // Custom header to filter by patient
          },
        }
      ),
      fetch(
        `${process.env.NEXT_PUBLIC_DJANGO_API_URL}/api/finance/patients/${patientId}/summary/`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.access_token}`,
          },
        }
      )
    ]);

    // Handle appointments data
    let appointments = [];
    if (appointmentsResponse.ok) {
      const appointmentsData = await appointmentsResponse.json();
      appointments = appointmentsData.results || appointmentsData.data || [];
    }

    // Handle financial data
    let financialSummary = {
      totalPaid: 0,
      totalCharged: 0,
      currentBalance: 0,
      totalInvoices: 0,
      totalPayments: 0,
      totalRefunds: 0,
      transactions: []
    };

    if (financialResponse.ok) {
      const financialData = await financialResponse.json();
      financialSummary = {
        totalPaid: financialData.total_paid || 0,
        totalCharged: financialData.total_charged || 0,
        currentBalance: financialData.current_balance || 0,
        totalInvoices: financialData.total_invoices || 0,
        totalPayments: financialData.total_payments || 0,
        totalRefunds: financialData.total_refunds || 0,
        transactions: financialData.recent_transactions || []
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        appointments,
        financial: financialSummary
      }
    });

  } catch (error) {
    console.error('Error fetching administrative data:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch administrative data',
      data: {
        appointments: [],
        financial: {
          totalPaid: 0,
          totalCharged: 0,
          currentBalance: 0,
          totalInvoices: 0,
          totalPayments: 0,
          totalRefunds: 0,
          transactions: []
        }
      }
    }, { status: 500 });
  }
}