const express = require('express');
const router = express.Router();

// Simulación de base de datos en memoria (reemplazar con DB real)
let documentTemplates = new Map();
let userDocuments = new Map();
let documentSubmissions = new Map();

// Tipos de campos disponibles para documentos
const FIELD_TYPES = {
  SHORT_TEXT: 'short_text',
  LONG_TEXT: 'long_text',
  PARAGRAPH: 'paragraph',
  NUMBER: 'number',
  DROPDOWN: 'dropdown',
  RADIO: 'radio',
  CHECKBOX: 'checkbox',
  MULTI_SELECT: 'multi_select',
  DATE: 'date',
  TIME: 'time',
  EMAIL: 'email',
  PHONE: 'phone',
  SIGNATURE: 'signature',
  SECTION_HEADER: 'section_header',
  DIVIDER: 'divider',
  YES_NO: 'yes_no',
  ADDRESS: 'address',
  DOCUMENT_TITLE: 'document_title',
  LEGAL_TEXT: 'legal_text',
  CHECKBOX_AGREEMENT: 'checkbox_agreement'
};

// Templates predefinidos para documentos legales/administrativos
const initPredefinedDocumentTemplates = () => {
  // Consentimiento Informado para Atención en Salud Mental
  const consentimientoInformado = {
    id: 'consentimiento_salud_mental',
    name: 'Consentimiento Informado - Atención en Salud Mental',
    description: 'Documento de consentimiento para servicios de atención psicológica y psiquiátrica',
    category: 'legal',
    type: 'consent',
    isSystem: true,
    isRequired: true,
    validityPeriod: 365, // días
    createdAt: new Date().toISOString(),
    fields: [
      {
        id: 'doc_title',
        type: FIELD_TYPES.DOCUMENT_TITLE,
        label: 'CONSENTIMIENTO INFORMADO PARA ATENCIÓN EN SALUD MENTAL',
        required: false,
        order: 1,
        styling: {
          textAlign: 'center',
          fontSize: '20px',
          fontWeight: 'bold',
          marginBottom: '20px'
        }
      },
      {
        id: 'paciente_info_header',
        type: FIELD_TYPES.SECTION_HEADER,
        label: 'INFORMACIÓN DEL PACIENTE',
        required: false,
        order: 2
      },
      {
        id: 'paciente_nombre_completo',
        type: FIELD_TYPES.SHORT_TEXT,
        label: 'Nombre Completo del Paciente',
        placeholder: 'Escriba el nombre completo',
        required: true,
        order: 3
      },
      {
        id: 'paciente_fecha_nacimiento',
        type: FIELD_TYPES.DATE,
        label: 'Fecha de Nacimiento',
        required: true,
        order: 4
      },
      {
        id: 'paciente_telefono',
        type: FIELD_TYPES.PHONE,
        label: 'Teléfono de Contacto',
        placeholder: '+52 55 1234-5678',
        required: true,
        order: 5
      },
      {
        id: 'paciente_email',
        type: FIELD_TYPES.EMAIL,
        label: 'Correo Electrónico',
        placeholder: 'ejemplo@correo.com',
        required: false,
        order: 6
      },
      {
        id: 'proposito_header',
        type: FIELD_TYPES.SECTION_HEADER,
        label: 'PROPÓSITO DEL TRATAMIENTO',
        required: false,
        order: 7
      },
      {
        id: 'proposito_texto',
        type: FIELD_TYPES.LEGAL_TEXT,
        label: '',
        content: `El propósito de este documento es informarle sobre los servicios de salud mental que recibirá y obtener su consentimiento para el tratamiento. Los servicios pueden incluir:

• Evaluación psicológica y/o psiquiátrica
• Psicoterapia individual, grupal o familiar
• Prescripción y monitoreo de medicamentos (si aplica)
• Intervenciones en crisis
• Referencia a otros servicios especializados

El tratamiento en salud mental está diseñado para ayudarle a mejorar su bienestar emocional, mental y social.`,
        required: false,
        order: 8
      },
      {
        id: 'beneficios_riesgos_header',
        type: FIELD_TYPES.SECTION_HEADER,
        label: 'BENEFICIOS Y RIESGOS DEL TRATAMIENTO',
        required: false,
        order: 9
      },
      {
        id: 'beneficios_texto',
        type: FIELD_TYPES.LEGAL_TEXT,
        label: '',
        content: `BENEFICIOS ESPERADOS:
• Reducción de síntomas psicológicos
• Mejora en el funcionamiento diario
• Desarrollo de estrategias de afrontamiento
• Mejor calidad de vida
• Prevención de crisis futuras

RIESGOS Y LIMITACIONES:
• Algunos pacientes pueden experimentar emociones intensas durante el tratamiento
• Los resultados no están garantizados y varían según cada persona
• Puede haber efectos secundarios de medicamentos (si aplica)
• En raras ocasiones, los síntomas pueden empeorar temporalmente
• El tratamiento requiere tiempo y compromiso del paciente`,
        required: false,
        order: 10
      },
      {
        id: 'confidencialidad_header',
        type: FIELD_TYPES.SECTION_HEADER,
        label: 'CONFIDENCIALIDAD',
        required: false,
        order: 11
      },
      {
        id: 'confidencialidad_texto',
        type: FIELD_TYPES.LEGAL_TEXT,
        label: '',
        content: `Toda la información compartida durante el tratamiento es estrictamente confidencial y está protegida por las leyes aplicables. La información solo será compartida en las siguientes circunstancias:

• Con su autorización escrita
• Cuando existe riesgo inminente de daño a usted o a terceros
• Por orden judicial
• Para reportar sospechas de abuso infantil o de adultos mayores
• Para facturación y coordinación de seguros (si aplica)
• Para supervisión profesional y mejora de la calidad`,
        required: false,
        order: 12
      },
      {
        id: 'derechos_header',
        type: FIELD_TYPES.SECTION_HEADER,
        label: 'SUS DERECHOS COMO PACIENTE',
        required: false,
        order: 13
      },
      {
        id: 'derechos_texto',
        type: FIELD_TYPES.LEGAL_TEXT,
        label: '',
        content: `Usted tiene derecho a:
• Recibir información clara sobre su diagnóstico y tratamiento
• Participar activamente en las decisiones sobre su cuidado
• Solicitar una segunda opinión
• Terminar el tratamiento en cualquier momento
• Acceder a sus registros médicos
• Presentar quejas sobre su atención
• Recibir tratamiento sin discriminación
• Que se respete su privacidad y dignidad`,
        required: false,
        order: 14
      },
      {
        id: 'emergencias_header',
        type: FIELD_TYPES.SECTION_HEADER,
        label: 'PROCEDIMIENTOS DE EMERGENCIA',
        required: false,
        order: 15
      },
      {
        id: 'emergencias_texto',
        type: FIELD_TYPES.LEGAL_TEXT,
        label: '',
        content: `En caso de emergencia psiquiátrica fuera del horario de consulta:
• Acuda al servicio de urgencias más cercano
• Llame al 911 o servicios de emergencia
• Contacte la línea de crisis: [Incluir número local]
• Si es una emergencia que no pone en riesgo la vida, deje un mensaje y será contactado lo antes posible`,
        required: false,
        order: 16
      },
      {
        id: 'contacto_emergencia',
        type: FIELD_TYPES.SHORT_TEXT,
        label: 'Contacto de Emergencia (Nombre y Teléfono)',
        placeholder: 'Nombre completo - teléfono',
        required: true,
        order: 17
      },
      {
        id: 'consentimiento_header',
        type: FIELD_TYPES.SECTION_HEADER,
        label: 'CONSENTIMIENTO',
        required: false,
        order: 18
      },
      {
        id: 'acepto_tratamiento',
        type: FIELD_TYPES.CHECKBOX_AGREEMENT,
        label: 'He leído y entendido la información proporcionada. Acepto voluntariamente recibir servicios de salud mental.',
        required: true,
        order: 19
      },
      {
        id: 'acepto_riesgos',
        type: FIELD_TYPES.CHECKBOX_AGREEMENT,
        label: 'Entiendo los beneficios y riesgos del tratamiento mencionados anteriormente.',
        required: true,
        order: 20
      },
      {
        id: 'acepto_confidencialidad',
        type: FIELD_TYPES.CHECKBOX_AGREEMENT,
        label: 'Entiendo las políticas de confidencialidad y las excepciones mencionadas.',
        required: true,
        order: 21
      },
      {
        id: 'acepto_emergencias',
        type: FIELD_TYPES.CHECKBOX_AGREEMENT,
        label: 'Entiendo los procedimientos de emergencia y mi responsabilidad de buscar ayuda cuando sea necesario.',
        required: true,
        order: 22
      },
      {
        id: 'divider_firmas',
        type: FIELD_TYPES.DIVIDER,
        required: false,
        order: 23
      },
      {
        id: 'firma_paciente',
        type: FIELD_TYPES.SIGNATURE,
        label: 'Firma del Paciente (o Representante Legal)',
        required: true,
        order: 24
      },
      {
        id: 'fecha_firma',
        type: FIELD_TYPES.DATE,
        label: 'Fecha',
        required: true,
        order: 25,
        defaultValue: 'today'
      },
      {
        id: 'firma_profesional',
        type: FIELD_TYPES.SIGNATURE,
        label: 'Firma del Profesional de Salud Mental',
        required: true,
        order: 26
      },
      {
        id: 'nombre_profesional',
        type: FIELD_TYPES.SHORT_TEXT,
        label: 'Nombre del Profesional',
        required: true,
        order: 27
      },
      {
        id: 'cedula_profesional',
        type: FIELD_TYPES.SHORT_TEXT,
        label: 'Cédula Profesional',
        required: true,
        order: 28
      }
    ]
  };

  // Aviso de Privacidad
  const avisoPrivacidad = {
    id: 'aviso_privacidad',
    name: 'Aviso de Privacidad',
    description: 'Documento de aviso de privacidad conforme a la Ley Federal de Protección de Datos Personales',
    category: 'legal',
    type: 'privacy',
    isSystem: true,
    isRequired: true,
    validityPeriod: 365,
    createdAt: new Date().toISOString(),
    fields: [
      {
        id: 'titulo_aviso',
        type: FIELD_TYPES.DOCUMENT_TITLE,
        label: 'AVISO DE PRIVACIDAD',
        required: false,
        order: 1,
        styling: {
          textAlign: 'center',
          fontSize: '20px',
          fontWeight: 'bold',
          marginBottom: '20px'
        }
      },
      {
        id: 'responsable_header',
        type: FIELD_TYPES.SECTION_HEADER,
        label: 'RESPONSABLE DEL TRATAMIENTO',
        required: false,
        order: 2
      },
      {
        id: 'responsable_texto',
        type: FIELD_TYPES.LEGAL_TEXT,
        label: '',
        content: `[NOMBRE DE LA CLÍNICA/PROFESIONAL], con domicilio en [DIRECCIÓN COMPLETA], es el responsable del uso y protección de sus datos personales, y al respecto le informamos lo siguiente:`,
        required: false,
        order: 3
      },
      {
        id: 'finalidades_header',
        type: FIELD_TYPES.SECTION_HEADER,
        label: 'FINALIDADES DEL TRATAMIENTO',
        required: false,
        order: 4
      },
      {
        id: 'finalidades_texto',
        type: FIELD_TYPES.LEGAL_TEXT,
        label: '',
        content: `Sus datos personales serán utilizados para las siguientes finalidades:

FINALIDADES PRIMARIAS (necesarias para la relación jurídica):
• Proporcionar servicios de atención en salud mental
• Llevar un historial médico y expediente clínico
• Dar seguimiento a tratamientos y terapias
• Facturación y cobranza de servicios
• Cumplir con obligaciones legales y regulatorias

FINALIDADES SECUNDARIAS (no necesarias para la relación jurídica):
• Envío de recordatorios de citas
• Comunicación sobre nuevos servicios
• Invitación a programas de bienestar
• Fines estadísticos y de mejora de servicios
• Evaluación de satisfacción del paciente

Si no desea que sus datos sean tratados para las finalidades secundarias, puede manifestar su negativa en el apartado correspondiente.`,
        required: false,
        order: 5
      },
      {
        id: 'datos_recabados_header',
        type: FIELD_TYPES.SECTION_HEADER,
        label: 'DATOS PERSONALES RECABADOS',
        required: false,
        order: 6
      },
      {
        id: 'datos_texto',
        type: FIELD_TYPES.LEGAL_TEXT,
        label: '',
        content: `Para las finalidades señaladas, podemos recabar los siguientes datos personales:

DATOS DE IDENTIFICACIÓN:
• Nombre completo
• Fecha de nacimiento
• Lugar de nacimiento
• Nacionalidad
• CURP
• RFC
• Identificación oficial

DATOS DE CONTACTO:
• Domicilio
• Teléfono fijo y móvil
• Correo electrónico

DATOS LABORALES:
• Ocupación
• Lugar de trabajo
• Ingresos

DATOS ACADÉMICOS:
• Escolaridad
• Profesión

DATOS DE SALUD (SENSIBLES):
• Historia clínica
• Diagnósticos
• Tratamientos
• Medicamentos
• Estudios médicos
• Información psicológica y psiquiátrica

DATOS FAMILIARES:
• Estado civil
• Información de contacto de emergencia
• Historial médico familiar relevante`,
        required: false,
        order: 7
      },
      {
        id: 'transferencias_header',
        type: FIELD_TYPES.SECTION_HEADER,
        label: 'TRANSFERENCIAS DE DATOS',
        required: false,
        order: 8
      },
      {
        id: 'transferencias_texto',
        type: FIELD_TYPES.LEGAL_TEXT,
        label: '',
        content: `Sus datos personales pueden ser transferidos y tratados dentro y fuera del país, por las siguientes personas, empresas, organizaciones o autoridades:

• Autoridades de salud competentes
• Compañías de seguros (para reembolsos)
• Laboratorios clínicos y estudios médicos
• Otros profesionales de la salud (para interconsulta)
• Proveedores de servicios de tecnología médica
• Autoridades judiciales (cuando sea requerido por ley)

Estas transferencias se realizan con el objetivo de dar cumplimiento a las finalidades previstas en este aviso de privacidad.`,
        required: false,
        order: 9
      },
      {
        id: 'derechos_arco_header',
        type: FIELD_TYPES.SECTION_HEADER,
        label: 'DERECHOS ARCO',
        required: false,
        order: 10
      },
      {
        id: 'derechos_texto',
        type: FIELD_TYPES.LEGAL_TEXT,
        label: '',
        content: `Usted tiene derecho a conocer qué datos personales tenemos de usted, para qué los utilizamos y las condiciones del uso que les damos (Acceso). Asimismo, es su derecho solicitar la corrección de su información personal en caso de que esté desactualizada, sea inexacta o incompleta (Rectificación); que la eliminemos de nuestros registros o bases de datos cuando considere que la misma no está siendo utilizada adecuadamente (Cancelación); así como oponerse al uso de sus datos personales para fines específicos (Oposición). Estos derechos se conocen como derechos ARCO.

Para el ejercicio de cualquiera de los derechos ARCO, puede acudir a nuestras oficinas ubicadas en [DIRECCIÓN] o enviar la solicitud correspondiente al correo electrónico [EMAIL_PRIVACIDAD].

Su solicitud deberá contener y acompañar lo siguiente:
• Nombre del titular y domicilio
• Documentos que acrediten la identidad del titular
• Descripción clara y precisa de los datos respecto de los que busca ejercer alguno de los derechos ARCO
• Cualquier otro elemento que facilite la localización de sus datos

El plazo para atender su solicitud es de 20 días hábiles.`,
        required: false,
        order: 11
      },
      {
        id: 'cambios_header',
        type: FIELD_TYPES.SECTION_HEADER,
        label: 'MODIFICACIONES AL AVISO DE PRIVACIDAD',
        required: false,
        order: 12
      },
      {
        id: 'cambios_texto',
        type: FIELD_TYPES.LEGAL_TEXT,
        label: '',
        content: `El presente aviso de privacidad puede sufrir modificaciones, cambios o actualizaciones derivadas de nuevos requerimientos legales; de nuestras propias necesidades por los productos o servicios que ofrecemos; de nuestras prácticas de privacidad; de cambios en nuestro modelo de negocio, o por otras causas.

Nos comprometemos a mantenerle informado sobre los cambios que pueda sufrir el presente aviso de privacidad, a través de [MEDIO DE COMUNICACIÓN].`,
        required: false,
        order: 13
      },
      {
        id: 'contacto_privacidad_header',
        type: FIELD_TYPES.SECTION_HEADER,
        label: 'DATOS DE CONTACTO',
        required: false,
        order: 14
      },
      {
        id: 'contacto_texto',
        type: FIELD_TYPES.LEGAL_TEXT,
        label: '',
        content: `Para cualquier duda sobre el presente aviso de privacidad, puede contactarnos a través de:

Teléfono: [TELÉFONO]
Correo electrónico: [EMAIL_PRIVACIDAD]
Domicilio: [DIRECCIÓN COMPLETA]

Fecha de última actualización: [FECHA]`,
        required: false,
        order: 15
      },
      {
        id: 'consentimiento_privacidad_header',
        type: FIELD_TYPES.SECTION_HEADER,
        label: 'CONSENTIMIENTO',
        required: false,
        order: 16
      },
      {
        id: 'acepto_aviso_privacidad',
        type: FIELD_TYPES.CHECKBOX_AGREEMENT,
        label: 'He leído y acepto los términos del presente Aviso de Privacidad',
        required: true,
        order: 17
      },
      {
        id: 'acepto_finalidades_secundarias',
        type: FIELD_TYPES.YES_NO,
        label: '¿Autoriza el uso de sus datos para finalidades secundarias (recordatorios, comunicación de servicios, etc.)?',
        required: true,
        order: 18
      },
      {
        id: 'firma_titular_datos',
        type: FIELD_TYPES.SIGNATURE,
        label: 'Firma del Titular de los Datos',
        required: true,
        order: 19
      },
      {
        id: 'fecha_aceptacion',
        type: FIELD_TYPES.DATE,
        label: 'Fecha de Aceptación',
        required: true,
        order: 20,
        defaultValue: 'today'
      }
    ]
  };

  // Formulario de Primera Vez - Evaluación Inicial de Salud Mental
  const formularioPrimeraVez = {
    id: 'primera_vez_salud_mental',
    name: 'Formulario de Primera Vez - Evaluación Inicial',
    description: 'Formulario completo de evaluación inicial para pacientes de primera vez en servicios de salud mental',
    category: 'intake',
    type: 'initial_assessment',
    isSystem: true,
    isRequired: false,
    validityPeriod: 365,
    createdAt: new Date().toISOString(),
    fields: [
      {
        id: 'titulo_formulario',
        type: FIELD_TYPES.DOCUMENT_TITLE,
        label: 'FORMULARIO DE EVALUACIÓN INICIAL - SALUD MENTAL',
        required: false,
        order: 1,
        styling: {
          textAlign: 'center',
          fontSize: '18px',
          fontWeight: 'bold',
          marginBottom: '20px'
        }
      },
      {
        id: 'fecha_evaluacion',
        type: FIELD_TYPES.DATE,
        label: 'Fecha de Evaluación',
        required: true,
        order: 2,
        defaultValue: 'today'
      },
      {
        id: 'datos_demograficos_header',
        type: FIELD_TYPES.SECTION_HEADER,
        label: 'DATOS DEMOGRÁFICOS',
        required: false,
        order: 3
      },
      {
        id: 'nombre_completo',
        type: FIELD_TYPES.SHORT_TEXT,
        label: 'Nombre Completo',
        placeholder: 'Primer nombre, segundo nombre, apellido paterno, apellido materno',
        required: true,
        order: 4
      },
      {
        id: 'fecha_nacimiento',
        type: FIELD_TYPES.DATE,
        label: 'Fecha de Nacimiento',
        required: true,
        order: 5
      },
      {
        id: 'edad',
        type: FIELD_TYPES.NUMBER,
        label: 'Edad',
        required: true,
        order: 6,
        validation: { min: 0, max: 120 }
      },
      {
        id: 'genero',
        type: FIELD_TYPES.RADIO,
        label: 'Género',
        required: true,
        order: 7,
        options: [
          { value: 'masculino', label: 'Masculino' },
          { value: 'femenino', label: 'Femenino' },
          { value: 'no_binario', label: 'No binario' },
          { value: 'otro', label: 'Otro' },
          { value: 'prefiero_no_responder', label: 'Prefiero no responder' }
        ]
      },
      {
        id: 'estado_civil',
        type: FIELD_TYPES.DROPDOWN,
        label: 'Estado Civil',
        required: true,
        order: 8,
        options: [
          { value: 'soltero', label: 'Soltero(a)' },
          { value: 'casado', label: 'Casado(a)' },
          { value: 'union_libre', label: 'Unión libre' },
          { value: 'divorciado', label: 'Divorciado(a)' },
          { value: 'viudo', label: 'Viudo(a)' },
          { value: 'separado', label: 'Separado(a)' }
        ]
      },
      {
        id: 'direccion',
        type: FIELD_TYPES.ADDRESS,
        label: 'Dirección Completa',
        placeholder: 'Calle, número, colonia, ciudad, estado, código postal',
        required: true,
        order: 9
      },
      {
        id: 'telefono_principal',
        type: FIELD_TYPES.PHONE,
        label: 'Teléfono Principal',
        required: true,
        order: 10
      },
      {
        id: 'telefono_secundario',
        type: FIELD_TYPES.PHONE,
        label: 'Teléfono Secundario',
        required: false,
        order: 11
      },
      {
        id: 'email',
        type: FIELD_TYPES.EMAIL,
        label: 'Correo Electrónico',
        required: true,
        order: 12
      },
      {
        id: 'ocupacion',
        type: FIELD_TYPES.SHORT_TEXT,
        label: 'Ocupación/Trabajo Actual',
        required: true,
        order: 13
      },
      {
        id: 'escolaridad',
        type: FIELD_TYPES.DROPDOWN,
        label: 'Nivel de Escolaridad',
        required: true,
        order: 14,
        options: [
          { value: 'primaria_incompleta', label: 'Primaria incompleta' },
          { value: 'primaria_completa', label: 'Primaria completa' },
          { value: 'secundaria_incompleta', label: 'Secundaria incompleta' },
          { value: 'secundaria_completa', label: 'Secundaria completa' },
          { value: 'preparatoria_incompleta', label: 'Preparatoria incompleta' },
          { value: 'preparatoria_completa', label: 'Preparatoria completa' },
          { value: 'universidad_incompleta', label: 'Universidad incompleta' },
          { value: 'universidad_completa', label: 'Universidad completa' },
          { value: 'posgrado', label: 'Posgrado' }
        ]
      },
      {
        id: 'contacto_emergencia_header',
        type: FIELD_TYPES.SECTION_HEADER,
        label: 'CONTACTO DE EMERGENCIA',
        required: false,
        order: 15
      },
      {
        id: 'emergencia_nombre',
        type: FIELD_TYPES.SHORT_TEXT,
        label: 'Nombre Completo',
        required: true,
        order: 16
      },
      {
        id: 'emergencia_relacion',
        type: FIELD_TYPES.SHORT_TEXT,
        label: 'Relación (familiar, amigo, etc.)',
        required: true,
        order: 17
      },
      {
        id: 'emergencia_telefono',
        type: FIELD_TYPES.PHONE,
        label: 'Teléfono',
        required: true,
        order: 18
      },
      {
        id: 'motivo_consulta_header',
        type: FIELD_TYPES.SECTION_HEADER,
        label: 'MOTIVO DE CONSULTA',
        required: false,
        order: 19
      },
      {
        id: 'motivo_principal',
        type: FIELD_TYPES.LONG_TEXT,
        label: '¿Cuál es el motivo principal por el que busca ayuda profesional?',
        placeholder: 'Describa detalladamente lo que le motivó a buscar atención...',
        required: true,
        order: 20,
        validation: { minLength: 20, maxLength: 1000 }
      },
      {
        id: 'sintomas_actuales',
        type: FIELD_TYPES.MULTI_SELECT,
        label: '¿Cuáles de los siguientes síntomas está experimentando actualmente?',
        required: true,
        order: 21,
        options: [
          { value: 'ansiedad', label: 'Ansiedad o nerviosismo excesivo' },
          { value: 'depresion', label: 'Tristeza o depresión' },
          { value: 'panico', label: 'Ataques de pánico' },
          { value: 'insomnio', label: 'Problemas para dormir' },
          { value: 'concentracion', label: 'Dificultad para concentrarse' },
          { value: 'irritabilidad', label: 'Irritabilidad o enojo' },
          { value: 'cambios_humor', label: 'Cambios bruscos de humor' },
          { value: 'pensamientos_negativos', label: 'Pensamientos negativos persistentes' },
          { value: 'aislamiento', label: 'Tendencia al aislamiento social' },
          { value: 'fatiga', label: 'Fatiga o pérdida de energía' },
          { value: 'apetito', label: 'Cambios en el apetito' },
          { value: 'autoestima', label: 'Baja autoestima' },
          { value: 'otros', label: 'Otros (especificar en comentarios)' }
        ]
      },
      {
        id: 'duracion_sintomas',
        type: FIELD_TYPES.RADIO,
        label: '¿Cuánto tiempo ha estado experimentando estos síntomas?',
        required: true,
        order: 22,
        options: [
          { value: 'menos_1_mes', label: 'Menos de 1 mes' },
          { value: '1_3_meses', label: '1-3 meses' },
          { value: '3_6_meses', label: '3-6 meses' },
          { value: '6_12_meses', label: '6-12 meses' },
          { value: 'mas_1_ano', label: 'Más de 1 año' },
          { value: 'varios_anos', label: 'Varios años' }
        ]
      },
      {
        id: 'intensidad_sintomas',
        type: FIELD_TYPES.RADIO,
        label: '¿Cómo calificaría la intensidad de sus síntomas?',
        required: true,
        order: 23,
        options: [
          { value: 'leve', label: 'Leve - Apenas interfieren con mi vida diaria' },
          { value: 'moderada', label: 'Moderada - Interfieren algunas veces' },
          { value: 'grave', label: 'Grave - Interfieren significativamente' },
          { value: 'severa', label: 'Severa - Impiden mi funcionamiento normal' }
        ]
      },
      {
        id: 'historial_medico_header',
        type: FIELD_TYPES.SECTION_HEADER,
        label: 'HISTORIAL MÉDICO Y PSIQUIÁTRICO',
        required: false,
        order: 24
      },
      {
        id: 'tratamiento_previo_salud_mental',
        type: FIELD_TYPES.YES_NO,
        label: '¿Ha recibido tratamiento de salud mental anteriormente?',
        required: true,
        order: 25
      },
      {
        id: 'detalles_tratamiento_previo',
        type: FIELD_TYPES.LONG_TEXT,
        label: 'Si respondió sí, describa el tipo de tratamiento, cuándo y resultados',
        placeholder: 'Incluya fechas, tipos de terapia, medicamentos, hospitalización, etc.',
        required: false,
        order: 26,
        conditionalLogic: {
          showWhen: {
            field: 'tratamiento_previo_salud_mental',
            operator: 'equals',
            value: 'yes'
          }
        }
      },
      {
        id: 'medicamentos_actuales',
        type: FIELD_TYPES.LONG_TEXT,
        label: '¿Está tomando algún medicamento actualmente? (incluya psiquiátricos y médicos)',
        placeholder: 'Liste todos los medicamentos con dosis y frecuencia',
        required: false,
        order: 27
      },
      {
        id: 'alergias_medicamentos',
        type: FIELD_TYPES.LONG_TEXT,
        label: '¿Tiene alergias a medicamentos o sustancias?',
        placeholder: 'Liste todas las alergias conocidas',
        required: false,
        order: 28
      },
      {
        id: 'condiciones_medicas',
        type: FIELD_TYPES.LONG_TEXT,
        label: '¿Tiene alguna condición médica actual o pasada?',
        placeholder: 'Diabetes, hipertensión, enfermedades cardíacas, etc.',
        required: false,
        order: 29
      },
      {
        id: 'historial_familiar_header',
        type: FIELD_TYPES.SECTION_HEADER,
        label: 'HISTORIAL FAMILIAR DE SALUD MENTAL',
        required: false,
        order: 30
      },
      {
        id: 'antecedentes_familiares_salud_mental',
        type: FIELD_TYPES.YES_NO,
        label: '¿Hay antecedentes de problemas de salud mental en su familia?',
        required: true,
        order: 31
      },
      {
        id: 'detalles_antecedentes_familiares',
        type: FIELD_TYPES.LONG_TEXT,
        label: 'Si respondió sí, describa qué familiares y qué tipo de problemas',
        placeholder: 'Especifique el parentesco y el tipo de problema (depresión, ansiedad, etc.)',
        required: false,
        order: 32,
        conditionalLogic: {
          showWhen: {
            field: 'antecedentes_familiares_salud_mental',
            operator: 'equals',
            value: 'yes'
          }
        }
      },
      {
        id: 'uso_sustancias_header',
        type: FIELD_TYPES.SECTION_HEADER,
        label: 'USO DE SUSTANCIAS',
        required: false,
        order: 33
      },
      {
        id: 'consume_alcohol',
        type: FIELD_TYPES.RADIO,
        label: '¿Consume alcohol?',
        required: true,
        order: 34,
        options: [
          { value: 'nunca', label: 'Nunca' },
          { value: 'ocasionalmente', label: 'Ocasionalmente (1-2 veces por mes)' },
          { value: 'social', label: 'Socialmente (1-2 veces por semana)' },
          { value: 'regular', label: 'Regularmente (3-6 veces por semana)' },
          { value: 'diario', label: 'Diariamente' }
        ]
      },
      {
        id: 'consume_drogas',
        type: FIELD_TYPES.YES_NO,
        label: '¿Ha usado drogas recreativas en los últimos 12 meses?',
        required: true,
        order: 35
      },
      {
        id: 'fuma_tabaco',
        type: FIELD_TYPES.RADIO,
        label: '¿Fuma tabaco?',
        required: true,
        order: 36,
        options: [
          { value: 'nunca', label: 'Nunca he fumado' },
          { value: 'ex_fumador', label: 'Ex fumador' },
          { value: 'ocasional', label: 'Fumador ocasional' },
          { value: 'regular', label: 'Fumador regular' }
        ]
      },
      {
        id: 'factores_psicosociales_header',
        type: FIELD_TYPES.SECTION_HEADER,
        label: 'FACTORES PSICOSOCIALES',
        required: false,
        order: 37
      },
      {
        id: 'situacion_vivienda',
        type: FIELD_TYPES.RADIO,
        label: '¿Con quién vive actualmente?',
        required: true,
        order: 38,
        options: [
          { value: 'solo', label: 'Solo/a' },
          { value: 'pareja', label: 'Con pareja' },
          { value: 'familia', label: 'Con familia' },
          { value: 'amigos', label: 'Con amigos/roommates' },
          { value: 'otros', label: 'Otros' }
        ]
      },
      {
        id: 'apoyo_social',
        type: FIELD_TYPES.RADIO,
        label: '¿Cómo evaluaría su sistema de apoyo social?',
        required: true,
        order: 39,
        options: [
          { value: 'excelente', label: 'Excelente - Tengo mucho apoyo' },
          { value: 'bueno', label: 'Bueno - Tengo apoyo suficiente' },
          { value: 'regular', label: 'Regular - Poco apoyo' },
          { value: 'malo', label: 'Malo - Sin apoyo' }
        ]
      },
      {
        id: 'estresores_actuales',
        type: FIELD_TYPES.MULTI_SELECT,
        label: '¿Cuáles de los siguientes factores le están causando estrés actualmente?',
        required: false,
        order: 40,
        options: [
          { value: 'trabajo', label: 'Problemas laborales' },
          { value: 'economicos', label: 'Problemas económicos' },
          { value: 'relaciones', label: 'Problemas de pareja/relaciones' },
          { value: 'familia', label: 'Problemas familiares' },
          { value: 'salud', label: 'Problemas de salud' },
          { value: 'legal', label: 'Problemas legales' },
          { value: 'vivienda', label: 'Problemas de vivienda' },
          { value: 'academicos', label: 'Problemas académicos' },
          { value: 'duelo', label: 'Pérdida/duelo' },
          { value: 'otros', label: 'Otros' }
        ]
      },
      {
        id: 'trauma_historia',
        type: FIELD_TYPES.YES_NO,
        label: '¿Ha experimentado algún evento traumático significativo? (abuso, violencia, accidente, etc.)',
        required: true,
        order: 41
      },
      {
        id: 'objetivos_tratamiento_header',
        type: FIELD_TYPES.SECTION_HEADER,
        label: 'OBJETIVOS DEL TRATAMIENTO',
        required: false,
        order: 42
      },
      {
        id: 'que_espera_tratamiento',
        type: FIELD_TYPES.LONG_TEXT,
        label: '¿Qué espera lograr con el tratamiento?',
        placeholder: 'Describa sus metas y expectativas...',
        required: true,
        order: 43,
        validation: { minLength: 20, maxLength: 500 }
      },
      {
        id: 'preferencias_tratamiento',
        type: FIELD_TYPES.MULTI_SELECT,
        label: '¿Qué tipo de tratamiento prefiere o le interesa?',
        required: false,
        order: 44,
        options: [
          { value: 'terapia_individual', label: 'Terapia individual' },
          { value: 'terapia_grupal', label: 'Terapia grupal' },
          { value: 'terapia_pareja', label: 'Terapia de pareja' },
          { value: 'terapia_familia', label: 'Terapia familiar' },
          { value: 'medicacion', label: 'Medicación psiquiátrica' },
          { value: 'combinado', label: 'Combinación de terapia y medicación' }
        ]
      },
      {
        id: 'disponibilidad',
        type: FIELD_TYPES.LONG_TEXT,
        label: '¿Cuál es su disponibilidad para las citas? (días, horarios)',
        placeholder: 'Especifique días de la semana y horarios preferidos',
        required: true,
        order: 45
      },
      {
        id: 'evaluacion_riesgo_header',
        type: FIELD_TYPES.SECTION_HEADER,
        label: 'EVALUACIÓN DE RIESGO',
        required: false,
        order: 46
      },
      {
        id: 'pensamientos_suicidas',
        type: FIELD_TYPES.YES_NO,
        label: '¿Ha tenido pensamientos de hacerse daño o quitarse la vida?',
        required: true,
        order: 47
      },
      {
        id: 'plan_suicida',
        type: FIELD_TYPES.YES_NO,
        label: '¿Tiene un plan específico para hacerse daño?',
        required: true,
        order: 48,
        conditionalLogic: {
          showWhen: {
            field: 'pensamientos_suicidas',
            operator: 'equals',
            value: 'yes'
          }
        }
      },
      {
        id: 'pensamientos_violencia',
        type: FIELD_TYPES.YES_NO,
        label: '¿Ha tenido pensamientos de hacerle daño a otras personas?',
        required: true,
        order: 49
      },
      {
        id: 'informacion_adicional_header',
        type: FIELD_TYPES.SECTION_HEADER,
        label: 'INFORMACIÓN ADICIONAL',
        required: false,
        order: 50
      },
      {
        id: 'informacion_adicional',
        type: FIELD_TYPES.PARAGRAPH,
        label: '¿Hay algo más que considere importante que sepamos sobre usted o su situación?',
        placeholder: 'Cualquier información adicional que considere relevante...',
        required: false,
        order: 51
      },
      {
        id: 'como_conocio_servicio',
        type: FIELD_TYPES.DROPDOWN,
        label: '¿Cómo se enteró de nuestros servicios?',
        required: false,
        order: 52,
        options: [
          { value: 'referencia_medico', label: 'Referencia de médico' },
          { value: 'referencia_familia', label: 'Referencia de familia/amigos' },
          { value: 'internet', label: 'Búsqueda en internet' },
          { value: 'redes_sociales', label: 'Redes sociales' },
          { value: 'seguro_medico', label: 'A través del seguro médico' },
          { value: 'directorio', label: 'Directorio médico' },
          { value: 'otros', label: 'Otros' }
        ]
      },
      {
        id: 'consentimiento_evaluacion',
        type: FIELD_TYPES.CHECKBOX_AGREEMENT,
        label: 'Confirmo que toda la información proporcionada es verdadera y completa al mejor de mi conocimiento',
        required: true,
        order: 53
      },
      {
        id: 'acepto_contacto',
        type: FIELD_TYPES.CHECKBOX_AGREEMENT,
        label: 'Autorizo a ser contactado para programar citas y recibir recordatorios',
        required: true,
        order: 54
      },
      {
        id: 'firma_paciente_evaluacion',
        type: FIELD_TYPES.SIGNATURE,
        label: 'Firma del Paciente',
        required: true,
        order: 55
      },
      {
        id: 'fecha_completado',
        type: FIELD_TYPES.DATE,
        label: 'Fecha de Completado',
        required: true,
        order: 56,
        defaultValue: 'today'
      }
    ]
  };

  documentTemplates.set(consentimientoInformado.id, consentimientoInformado);
  documentTemplates.set(avisoPrivacidad.id, avisoPrivacidad);
  documentTemplates.set(formularioPrimeraVez.id, formularioPrimeraVez);
};

initPredefinedDocumentTemplates();

// ==================== TEMPLATE MANAGEMENT ====================

// Obtener todos los templates de documentos
router.get('/templates', (req, res) => {
  try {
    const { category, type, search } = req.query;
    let templates = Array.from(documentTemplates.values());

    // Filtros
    if (category && category !== 'all') {
      templates = templates.filter(template => template.category === category);
    }

    if (type && type !== 'all') {
      templates = templates.filter(template => template.type === type);
    }

    if (search) {
      const searchTerm = search.toLowerCase();
      templates = templates.filter(template =>
        template.name.toLowerCase().includes(searchTerm) ||
        template.description.toLowerCase().includes(searchTerm)
      );
    }

    // Ordenar por importancia (requeridos primero) y fecha
    templates.sort((a, b) => {
      if (a.isRequired && !b.isRequired) return -1;
      if (!a.isRequired && b.isRequired) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    res.json({
      success: true,
      data: templates,
      total: templates.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo templates de documentos',
      error: error.message
    });
  }
});

// Obtener template específico
router.get('/templates/:id', (req, res) => {
  try {
    const templateId = req.params.id;

    if (!documentTemplates.has(templateId)) {
      return res.status(404).json({
        success: false,
        message: 'Template no encontrado'
      });
    }

    const template = documentTemplates.get(templateId);
    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo template',
      error: error.message
    });
  }
});

// Crear nuevo template de documento
router.post('/templates', (req, res) => {
  try {
    const { name, description, category, type, fields, validityPeriod } = req.body;

    const templateId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newTemplate = {
      id: templateId,
      name,
      description,
      category: category || 'custom',
      type: type || 'custom',
      isSystem: false,
      isRequired: false,
      validityPeriod: validityPeriod || 365,
      createdAt: new Date().toISOString(),
      fields: fields.map((field, index) => ({
        ...field,
        id: field.id || `field_${index + 1}`,
        order: field.order || index + 1
      }))
    };

    documentTemplates.set(templateId, newTemplate);

    res.status(201).json({
      success: true,
      message: 'Template de documento creado exitosamente',
      data: newTemplate
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creando template de documento',
      error: error.message
    });
  }
});

// Actualizar template
router.put('/templates/:id', (req, res) => {
  try {
    const templateId = req.params.id;
    const updates = req.body;

    if (!documentTemplates.has(templateId)) {
      return res.status(404).json({
        success: false,
        message: 'Template no encontrado'
      });
    }

    const template = documentTemplates.get(templateId);

    // No permitir editar templates del sistema
    if (template.isSystem) {
      return res.status(403).json({
        success: false,
        message: 'No se pueden editar templates del sistema'
      });
    }

    const updatedTemplate = {
      ...template,
      ...updates,
      id: templateId,
      isSystem: template.isSystem,
      updatedAt: new Date().toISOString()
    };

    documentTemplates.set(templateId, updatedTemplate);

    res.json({
      success: true,
      message: 'Template actualizado exitosamente',
      data: updatedTemplate
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error actualizando template',
      error: error.message
    });
  }
});

// ==================== USER DOCUMENTS ====================

// Crear documento para usuario
router.post('/documents', (req, res) => {
  try {
    const { templateId, userId, patientId, title } = req.body;

    if (!documentTemplates.has(templateId)) {
      return res.status(404).json({
        success: false,
        message: 'Template no encontrado'
      });
    }

    const template = documentTemplates.get(templateId);
    const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const userDocument = {
      id: documentId,
      templateId,
      userId,
      patientId: patientId || null,
      title: title || template.name,
      status: 'draft',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + (template.validityPeriod * 24 * 60 * 60 * 1000)).toISOString(),
      fields: template.fields.map(field => ({
        ...field,
        value: field.defaultValue || null,
        touched: false
      }))
    };

    userDocuments.set(documentId, userDocument);

    res.status(201).json({
      success: true,
      message: 'Documento creado exitosamente',
      data: userDocument
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creando documento',
      error: error.message
    });
  }
});

// Obtener documentos de usuario
router.get('/documents/user/:userId', (req, res) => {
  try {
    const userId = req.params.userId;
    const { status, templateId, type } = req.query;

    let documents = Array.from(userDocuments.values()).filter(doc => doc.userId === userId);

    // Filtros
    if (status && status !== 'all') {
      documents = documents.filter(doc => doc.status === status);
    }

    if (templateId) {
      documents = documents.filter(doc => doc.templateId === templateId);
    }

    if (type) {
      documents = documents.filter(doc => {
        const template = documentTemplates.get(doc.templateId);
        return template && template.type === type;
      });
    }

    // Agregar información del template
    documents = documents.map(doc => ({
      ...doc,
      template: documentTemplates.get(doc.templateId)
    }));

    // Ordenar por fecha de creación
    documents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({
      success: true,
      data: documents,
      total: documents.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo documentos del usuario',
      error: error.message
    });
  }
});

// Obtener documento específico
router.get('/documents/:id', (req, res) => {
  try {
    const documentId = req.params.id;

    if (!userDocuments.has(documentId)) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }

    const document = userDocuments.get(documentId);
    const template = documentTemplates.get(document.templateId);

    res.json({
      success: true,
      data: {
        ...document,
        template
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo documento',
      error: error.message
    });
  }
});

// Actualizar documento
router.put('/documents/:id', (req, res) => {
  try {
    const documentId = req.params.id;
    const { fieldId, value, autoSave } = req.body;

    if (!userDocuments.has(documentId)) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }

    const document = userDocuments.get(documentId);

    // Actualizar campo específico
    if (fieldId) {
      const fieldIndex = document.fields.findIndex(field => field.id === fieldId);
      if (fieldIndex !== -1) {
        document.fields[fieldIndex].value = value;
        document.fields[fieldIndex].touched = true;
      }
    }

    document.updatedAt = new Date().toISOString();
    if (!autoSave) {
      document.status = 'in_progress';
    }

    userDocuments.set(documentId, document);

    res.json({
      success: true,
      message: 'Documento actualizado exitosamente',
      data: document
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error actualizando documento',
      error: error.message
    });
  }
});

// Completar documento
router.post('/documents/:id/complete', (req, res) => {
  try {
    const documentId = req.params.id;

    if (!userDocuments.has(documentId)) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }

    const document = userDocuments.get(documentId);

    // Validar campos requeridos
    const missingFields = document.fields.filter(field => 
      field.required && (field.value === null || field.value === undefined || field.value === '')
    );

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos',
        missingFields: missingFields.map(field => ({ id: field.id, label: field.label }))
      });
    }

    document.status = 'completed';
    document.completedAt = new Date().toISOString();

    userDocuments.set(documentId, document);

    // Crear entrada en submissions para historial
    const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const submission = {
      id: submissionId,
      documentId,
      userId: document.userId,
      templateId: document.templateId,
      submittedAt: new Date().toISOString(),
      data: document.fields,
      isLegalDocument: true
    };

    documentSubmissions.set(submissionId, submission);

    res.json({
      success: true,
      message: 'Documento completado exitosamente',
      data: document
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error completando documento',
      error: error.message
    });
  }
});

// ==================== ANALYTICS & COMPLIANCE ====================

// Estadísticas de documentos
router.get('/analytics/stats', (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;
    let documents = Array.from(userDocuments.values());
    let submissions = Array.from(documentSubmissions.values());

    // Filtros
    if (startDate) {
      const start = new Date(startDate);
      documents = documents.filter(doc => new Date(doc.createdAt) >= start);
      submissions = submissions.filter(sub => new Date(sub.submittedAt) >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      documents = documents.filter(doc => new Date(doc.createdAt) <= end);
      submissions = submissions.filter(sub => new Date(sub.submittedAt) <= end);
    }

    if (userId) {
      documents = documents.filter(doc => doc.userId === userId);
      submissions = submissions.filter(sub => sub.userId === userId);
    }

    const stats = {
      totalDocuments: documents.length,
      completedDocuments: documents.filter(d => d.status === 'completed').length,
      inProgressDocuments: documents.filter(d => d.status === 'in_progress').length,
      draftDocuments: documents.filter(d => d.status === 'draft').length,
      expiredDocuments: documents.filter(d => new Date() > new Date(d.expiresAt)).length,
      completionRate: documents.length > 0 ? Math.round((submissions.length / documents.length) * 100) : 0,
      documentsByType: getDocumentsByType(documents),
      complianceStatus: getComplianceStatus(documents)
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estadísticas',
      error: error.message
    });
  }
});

// Estado de cumplimiento por usuario
router.get('/compliance/:userId', (req, res) => {
  try {
    const userId = req.params.userId;
    const userDocs = Array.from(userDocuments.values()).filter(doc => doc.userId === userId);
    
    const requiredTemplates = Array.from(documentTemplates.values()).filter(t => t.isRequired);
    const complianceStatus = {
      userId,
      overall: 'compliant',
      requiredDocuments: [],
      missingDocuments: [],
      expiredDocuments: []
    };

    requiredTemplates.forEach(template => {
      const userDoc = userDocs.find(doc => doc.templateId === template.id && doc.status === 'completed');
      
      if (!userDoc) {
        complianceStatus.missingDocuments.push({
          templateId: template.id,
          name: template.name,
          type: template.type,
          required: true
        });
        complianceStatus.overall = 'non_compliant';
      } else if (new Date() > new Date(userDoc.expiresAt)) {
        complianceStatus.expiredDocuments.push({
          documentId: userDoc.id,
          templateId: template.id,
          name: template.name,
          expiredDate: userDoc.expiresAt
        });
        complianceStatus.overall = 'expired';
      } else {
        complianceStatus.requiredDocuments.push({
          documentId: userDoc.id,
          templateId: template.id,
          name: template.name,
          completedDate: userDoc.completedAt,
          expiresAt: userDoc.expiresAt
        });
      }
    });

    res.json({
      success: true,
      data: complianceStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estado de cumplimiento',
      error: error.message
    });
  }
});

// ==================== HELPER FUNCTIONS ====================

function getDocumentsByType(documents) {
  const typeCount = {};
  documents.forEach(doc => {
    const template = documentTemplates.get(doc.templateId);
    const type = template ? template.type : 'unknown';
    typeCount[type] = (typeCount[type] || 0) + 1;
  });
  return typeCount;
}

function getComplianceStatus(documents) {
  const requiredTemplates = Array.from(documentTemplates.values()).filter(t => t.isRequired);
  const completedRequired = documents.filter(doc => {
    const template = documentTemplates.get(doc.templateId);
    return template && template.isRequired && doc.status === 'completed';
  });

  return {
    requiredCount: requiredTemplates.length,
    completedCount: completedRequired.length,
    complianceRate: requiredTemplates.length > 0 
      ? Math.round((completedRequired.length / requiredTemplates.length) * 100) 
      : 100
  };
}

// Obtener tipos de campos disponibles
router.get('/field-types', (req, res) => {
  res.json({
    success: true,
    data: Object.entries(FIELD_TYPES).map(([key, value]) => ({
      key,
      value,
      label: key.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }))
  });
});

module.exports = router;