// Expedix Prescription PDF Generation Django Proxy
import { getAuthenticatedUser, createResponse, createErrorResponse } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic';

const DJANGO_API_BASE = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'https://mindhub-django-backend.vercel.app';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[PRESCRIPTION PDF PROXY] Processing PDF generation request for ID:', params.id);
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      console.error('[PRESCRIPTION PDF PROXY] Auth error:', authError);
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }
    
    // Forward request to Django
    const djangoUrl = `${DJANGO_API_BASE}/api/expedix/prescriptions/${params.id}/generate_pdf/`;
    console.log('[PRESCRIPTION PDF PROXY] Forwarding to:', djangoUrl);
    
    const response = await fetch(djangoUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'X-Proxy-Auth': 'verified',
        'X-User-Id': user.id,
        'X-User-Email': user.email || '',
        'X-Glian-Dual-System': 'enabled',
      },
    });

    if (!response.ok) {
      console.error('[PRESCRIPTION PDF PROXY] Django error:', response.status, response.statusText);
      throw new Error(`Django API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[PRESCRIPTION PDF PROXY] Successfully generated PDF');

    return createResponse(data);

  } catch (error) {
    console.error('[PRESCRIPTION PDF PROXY] Error:', error);
    return createErrorResponse(
      'Failed to generate prescription PDF',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[PRESCRIPTION PDF PROXY] Processing PDF download request for ID:', params.id);
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      console.error('[PRESCRIPTION PDF PROXY] Auth error:', authError);
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }
    
    // Check if PDF is already generated, if not generate it first
    const djangoUrl = `${DJANGO_API_BASE}/api/expedix/prescriptions/${params.id}/`;
    console.log('[PRESCRIPTION PDF PROXY] Checking prescription status:', djangoUrl);
    
    const checkResponse = await fetch(djangoUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'X-Proxy-Auth': 'verified',
        'X-User-Id': user.id,
        'X-User-Email': user.email || '',
        'X-Glian-Dual-System': 'enabled',
      },
    });

    if (!checkResponse.ok) {
      console.error('[PRESCRIPTION PDF PROXY] Error checking prescription:', checkResponse.status);
      throw new Error(`Failed to check prescription: ${checkResponse.status}`);
    }

    const prescriptionData = await checkResponse.json();
    
    // If PDF not generated, generate it first
    if (!prescriptionData.data?.pdf_generated) {
      console.log('[PRESCRIPTION PDF PROXY] PDF not generated, generating now...');
      
      const generateUrl = `${DJANGO_API_BASE}/api/expedix/prescriptions/${params.id}/generate_pdf/`;
      const generateResponse = await fetch(generateUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'X-Proxy-Auth': 'verified',
          'X-User-Id': user.id,
          'X-User-Email': user.email || '',
          'X-Glian-Dual-System': 'enabled',
        },
      });

      if (!generateResponse.ok) {
        console.error('[PRESCRIPTION PDF PROXY] Error generating PDF:', generateResponse.status);
        throw new Error(`Failed to generate PDF: ${generateResponse.status}`);
      }

      const generateData = await generateResponse.json();
      
      // Return the generation result with PDF info
      return createResponse({
        success: true,
        message: 'PDF generated successfully',
        pdf_info: generateData.pdf_info,
        download_ready: true
      });
    }

    // PDF already exists, return download info
    return createResponse({
      success: true,
      message: 'PDF ready for download',
      pdf_info: {
        pdf_url: prescriptionData.data.pdf_url,
        pdf_generated_at: prescriptionData.data.pdf_generated_at,
        prescription_number: prescriptionData.data.prescription_number
      },
      download_ready: true
    });

  } catch (error) {
    console.error('[PRESCRIPTION PDF PROXY] Error:', error);
    return createErrorResponse(
      'Failed to prepare prescription PDF',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}