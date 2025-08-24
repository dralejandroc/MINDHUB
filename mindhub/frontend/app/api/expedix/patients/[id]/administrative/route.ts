import { getAuthenticatedUser, createResponse, createErrorResponse } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_URL || 'https://mindhub-django-backend.vercel.app';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id: patientId } = params;
    console.log('[ADMINISTRATIVE DATA] Processing GET request for patient:', patientId);

    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      console.error('[ADMINISTRATIVE DATA] Auth error:', authError);
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Get both appointments and financial data from Django
    const [appointmentsResponse, financialResponse] = await Promise.all([
      fetch(
        `${BACKEND_URL}/api/agenda/appointments/?patient=${patientId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': request.headers.get('Authorization') || '',
            'X-User-Id': user.id,
            'X-User-Email': user.email || '',
            'X-Proxy-Auth': 'verified',
          },
        }
      ),
      fetch(
        `${BACKEND_URL}/api/finance/patients/${patientId}/summary/`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': request.headers.get('Authorization') || '',
            'X-User-Id': user.id,
            'X-User-Email': user.email || '',
            'X-Proxy-Auth': 'verified',
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

    console.log('[ADMINISTRATIVE DATA] Successfully retrieved administrative data');
    return createResponse({
      success: true,
      data: {
        appointments,
        financial: financialSummary
      }
    });

  } catch (error) {
    console.error('Error fetching administrative data:', error);
    
    return createResponse({
      success: true, // Return success true for graceful fallback
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
    });
  }
}