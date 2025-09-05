import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// API Routes para gestionar configuraciones de Expedix
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authorization token' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    // Obtener el usuario actual
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Buscar configuración existente
    const { data: settings, error } = await supabase
      .from('expedix_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching Expedix settings:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Configuración por defecto si no existe
    const defaultSettings = {
      user_id: user.id,
      default_view: 'cards',
      patients_per_page: 20,
      auto_save_consultations: true,
      require_consultation_reason: true,
      use_consultation_templates: true,
      default_template_id: '',
      show_vital_signs: true,
      show_mental_exam: true,
      notify_on_new_patient: true,
      notify_on_consultation: true,
      email_notifications: false,
      require_password_for_delete: true,
      audit_log_enabled: true,
      data_retention_days: 365,
      sync_with_agenda: true,
      sync_with_clinimetrix: true,
      sync_with_resources: true,
      show_age: true,
      show_last_visit: true,
      show_phone: true,
      show_email: true,
      date_format: 'DD/MM/YYYY',
      print_header: true,
      print_logo: true,
      print_signature: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      settings: settings || defaultSettings
    });

  } catch (error) {
    console.error('Error in Expedix settings GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authorization token' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    // Obtener el usuario actual
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const settings = {
      user_id: user.id,
      default_view: body.defaultView,
      patients_per_page: body.patientsPerPage,
      auto_save_consultations: body.autoSaveConsultations,
      require_consultation_reason: body.requireConsultationReason,
      use_consultation_templates: body.useConsultationTemplates,
      default_template_id: body.defaultTemplateId,
      show_vital_signs: body.showVitalSigns,
      show_mental_exam: body.showMentalExam,
      notify_on_new_patient: body.notifyOnNewPatient,
      notify_on_consultation: body.notifyOnConsultation,
      email_notifications: body.emailNotifications,
      require_password_for_delete: body.requirePasswordForDelete,
      audit_log_enabled: body.auditLogEnabled,
      data_retention_days: body.dataRetentionDays,
      sync_with_agenda: body.syncWithAgenda,
      sync_with_clinimetrix: body.syncWithClinimetrix,
      sync_with_resources: body.syncWithResources,
      show_age: body.showAge,
      show_last_visit: body.showLastVisit,
      show_phone: body.showPhone,
      show_email: body.showEmail,
      date_format: body.dateFormat,
      print_header: body.printHeader,
      print_logo: body.printLogo,
      print_signature: body.printSignature,
      updated_at: new Date().toISOString()
    };

    // Usar upsert para crear o actualizar
    const { data, error } = await supabase
      .from('expedix_settings')
      .upsert(settings, { 
        onConflict: 'user_id',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving Expedix settings:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully',
      settings: data
    });

  } catch (error) {
    console.error('Error in Expedix settings POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  // Reutilizar la lógica de POST para actualizaciones
  return POST(request);
}