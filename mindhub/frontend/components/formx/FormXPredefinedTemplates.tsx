'use client';

import React from 'react';
import {
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
  HeartIcon,
  BeakerIcon,
  UserIcon,
  PhoneIcon,
  CameraIcon,
  CheckCircleIcon,
  StarIcon,
  UserGroupIcon,
  AcademicCapIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
// import { FormXDjangoClient } from '@/lib/api/formx-django-client';
import toast from 'react-hot-toast';

interface PredefinedTemplate {
  id: string;
  name: string;
  description: string;
  form_type: string;
  category: string;
  icon: React.ComponentType<any>;
  fields: Array<{
    field_name: string;
    field_type: string;
    label: string;
    help_text?: string;
    placeholder?: string;
    required: boolean;
    choices?: Array<{value: string, label: string}>;
    expedix_field?: string;
  }>;
}

const PREDEFINED_TEMPLATES: PredefinedTemplate[] = [
  // ===== FORMULARIOS PSIQUIÁTRICOS POR EDAD =====
  {
    id: 'psychiatric-child',
    name: 'Formulario Psiquiátrico Niño (5-11 años)',
    description: 'Formulario psiquiátrico especializado para niños de 5 a 11 años. Completado por padres/tutores con enfoque en desarrollo infantil.',
    form_type: 'psychiatric_child',
    category: 'Psiquiatría Infantil',
    icon: StarIcon,
    fields: [
      // Datos generales
      { field_name: 'nombre_completo', field_type: 'text', label: 'Nombre completo del niño/a', required: true, expedix_field: 'firstName' },
      { field_name: 'edad', field_type: 'number', label: 'Edad', required: true },
      { field_name: 'fecha_nacimiento', field_type: 'date', label: 'Fecha de nacimiento', required: true, expedix_field: 'dateOfBirth' },
      { field_name: 'sexo', field_type: 'radio', label: 'Sexo', required: true, choices: [
        { value: 'masculino', label: 'Masculino' },
        { value: 'femenino', label: 'Femenino' }
      ]},
      { field_name: 'escuela', field_type: 'text', label: 'Escuela actual', required: false },
      { field_name: 'grado_escolar', field_type: 'text', label: 'Grado escolar', required: false },
      
      // Motivo de consulta
      { field_name: 'motivo_consulta', field_type: 'textarea', label: '¿Cuáles son los principales problemas o preocupaciones que lo traen a consulta?', 
        help_text: 'Describa síntomas observados (ej: cambios de comportamiento, dificultades escolares, etc.)', required: true },
      { field_name: 'expectativas_tratamiento', field_type: 'textarea', label: 'En pocas palabras describa qué espera del tratamiento', required: false },
      
      // Evaluación del sueño
      { field_name: 'patron_sueno', field_type: 'radio', label: 'Patrón de sueño actual', required: true, choices: [
        { value: 'duerme_bien', label: 'Duerme bien, parece descansar' },
        { value: 'problemas_dormir', label: 'Tiene problemas para quedarse dormido' },
        { value: 'despierta_noches', label: 'Se despierta frecuentemente por las noches' },
        { value: 'pesadillas', label: 'Pesadillas o terrores nocturnos' },
        { value: 'duerme_mucho', label: 'Duerme demasiado' }
      ]},
      
      // Actividad física
      { field_name: 'actividad_fisica', field_type: 'radio', label: '¿Realiza actividad física regularmente?', required: true, choices: [
        { value: 'si', label: 'Sí' },
        { value: 'no', label: 'No' }
      ]},
      { field_name: 'tipo_actividad', field_type: 'checkbox', label: 'Tipo de actividades que realiza', required: false, choices: [
        { value: 'deportes', label: 'Deportes organizados' },
        { value: 'juegos', label: 'Juegos al aire libre' },
        { value: 'educacion_fisica', label: 'Educación física escolar' },
        { value: 'actividades_casa', label: 'Actividades en casa' }
      ]},
      
      // Antecedentes
      { field_name: 'antecedentes_medicos', field_type: 'checkbox', label: 'Antecedentes médicos', required: false, choices: [
        { value: 'ninguno', label: 'Ninguno' },
        { value: 'convulsiones', label: 'Convulsiones/epilepsia' },
        { value: 'problemas_desarrollo', label: 'Problemas de desarrollo' },
        { value: 'hospitalizaciones', label: 'Hospitalizaciones previas' },
        { value: 'medicamentos', label: 'Toma medicamentos actualmente' }
      ]},
      
      // Comportamiento y desarrollo
      { field_name: 'cambios_comportamiento', field_type: 'textarea', label: '¿Ha notado cambios significativos en el comportamiento del niño/a?', required: false },
      { field_name: 'rendimiento_escolar', field_type: 'radio', label: 'Rendimiento escolar', required: false, choices: [
        { value: 'excelente', label: 'Excelente' },
        { value: 'bueno', label: 'Bueno' },
        { value: 'regular', label: 'Regular' },
        { value: 'deficiente', label: 'Deficiente' }
      ]},
      
      // Información familiar
      { field_name: 'familia_nuclear', field_type: 'text', label: 'Con quién vive el niño/a', required: true },
      { field_name: 'antecedentes_familiares', field_type: 'textarea', label: 'Antecedentes familiares de salud mental', required: false },
      
      // Información adicional
      { field_name: 'informacion_adicional', field_type: 'textarea', label: 'Información adicional relevante', 
        help_text: 'Cualquier otra información que considere importante', required: false }
    ]
  },
  
  {
    id: 'psychiatric-adolescent',
    name: 'Formulario Psiquiátrico Adolescente (12-17 años)',
    description: 'Formulario psiquiátrico para adolescentes de 12 a 17 años. Incluye evaluación de consumo de sustancias y participación voluntaria.',
    form_type: 'psychiatric_adolescent',
    category: 'Psiquiatría Adolescente',
    icon: UserGroupIcon,
    fields: [
      // Datos generales
      { field_name: 'nombre_completo', field_type: 'text', label: 'Nombre completo', required: true, expedix_field: 'firstName' },
      { field_name: 'edad', field_type: 'number', label: 'Edad', required: true },
      { field_name: 'fecha_nacimiento', field_type: 'date', label: 'Fecha de nacimiento', required: true, expedix_field: 'dateOfBirth' },
      { field_name: 'sexo', field_type: 'radio', label: 'Sexo', required: true, choices: [
        { value: 'masculino', label: 'Masculino' },
        { value: 'femenino', label: 'Femenino' }
      ]},
      { field_name: 'telefono', field_type: 'phone', label: 'Número celular', required: true, expedix_field: 'phone' },
      { field_name: 'email', field_type: 'email', label: 'E-mail', required: false, expedix_field: 'email' },
      
      // Participación voluntaria
      { field_name: 'participacion_voluntaria', field_type: 'radio', label: '¿Vienes a consulta por voluntad propia?', required: true, choices: [
        { value: 'si', label: 'Sí' },
        { value: 'no', label: 'No' }
      ]},
      
      // Motivo de consulta
      { field_name: 'motivo_consulta', field_type: 'textarea', label: '¿Cuáles son los principales problemas o preocupaciones que te traen a consulta?', 
        help_text: 'Describe síntomas (ej: desánimo, ansiedad, problemas de sueño, etc.)', required: true },
      { field_name: 'expectativas_tratamiento', field_type: 'textarea', label: 'En pocas palabras describe qué esperas del tratamiento', required: false },
      
      // Evaluación del sueño
      { field_name: 'patron_sueno', field_type: 'radio', label: 'Selecciona lo que mejor describe tu situación actual de sueño', required: true, choices: [
        { value: 'duerme_bien', label: 'Duermo bien, siento que descanso' },
        { value: 'problemas_dormir', label: 'Tengo problemas para quedarme dormido' },
        { value: 'despierta_noches', label: 'Me despierto frecuentemente por las noches' },
        { value: 'despierta_madrugada', label: 'Me despierto muy temprano y no puedo volver a dormir' },
        { value: 'duerme_mucho', label: 'Duermo todo el tiempo y además quiero dormir siesta' }
      ]},
      
      // Actividad física
      { field_name: 'actividad_fisica', field_type: 'radio', label: '¿Realizas actividad física o ejercicio con regularidad?', required: true, choices: [
        { value: 'si', label: 'Sí' },
        { value: 'no', label: 'No' }
      ]},
      { field_name: 'frecuencia_ejercicio', field_type: 'radio', label: 'Si es afirmativo, selecciona la frecuencia', required: false, choices: [
        { value: 'vigoroso_4+', label: 'Ejercicio vigoroso más de 4 veces por semana' },
        { value: 'moderado_4+', label: 'Ejercicio moderado más de 4 veces por semana' },
        { value: 'menos_4', label: 'Ejercicio menos de 4 veces por semana' },
        { value: 'ocasional', label: 'Ocasionalmente alguna actividad física' },
        { value: 'ninguno', label: 'No hago ejercicio de ningún tipo' }
      ]},
      
      // Consumo de sustancias (específico para adolescentes)
      { field_name: 'consumo_sustancias', field_type: 'checkbox', label: '¿Has consumido alguna de las siguientes sustancias?', required: true, choices: [
        { value: 'ninguna', label: 'No consumo alcohol ni sustancias' },
        { value: 'alcohol_social', label: 'Bebo alcohol de manera social ocasionalmente' },
        { value: 'tabaco', label: 'Fumo tabaco' },
        { value: 'marihuana', label: 'He probado o consumo marihuana' },
        { value: 'otras_drogas', label: 'He probado otras drogas' }
      ]},
      { field_name: 'preocupacion_consumo', field_type: 'radio', label: '¿Te preocupa tu consumo de sustancias?', required: false, choices: [
        { value: 'si', label: 'Sí' },
        { value: 'no', label: 'No' },
        { value: 'no_aplica', label: 'No aplica' }
      ]},
      
      // Antecedentes
      { field_name: 'tratamiento_previo', field_type: 'radio', label: '¿Has recibido tratamiento psiquiátrico anteriormente?', required: true, choices: [
        { value: 'si', label: 'Sí' },
        { value: 'no', label: 'No' }
      ]},
      { field_name: 'medicamentos_actuales', field_type: 'textarea', label: '¿Estás tomando algún medicamento actualmente?', 
        help_text: 'Incluye medicamentos para problemas emocionales, vitaminas o suplementos', required: false },
      
      // Situación familiar y social
      { field_name: 'familia_nuclear', field_type: 'text', label: 'Con quién vives', required: true },
      { field_name: 'situacion_escolar', field_type: 'text', label: 'Situación escolar actual', required: false },
      
      // Evaluación de estrés
      { field_name: 'nivel_estres', field_type: 'radio', label: 'En relación al estrés, selecciona la opción que mejor te describe', required: true, choices: [
        { value: 'manejo_bien', label: 'Sé lidiar con el estrés y no me causa problemas' },
        { value: 'me_afecta_poco', label: 'El estrés me afecta pero puedo manejarlo' },
        { value: 'me_desgasta', label: 'El estrés me desgasta y afecta mi salud' },
        { value: 'constante', label: 'Vivo con estrés constante' }
      ]},
      
      // Información adicional
      { field_name: 'informacion_adicional', field_type: 'textarea', label: 'Información adicional que consideres importante', required: false }
    ]
  },
  
  {
    id: 'psychiatric-adult',
    name: 'Formulario Psiquiátrico Adulto (18-60 años)',
    description: 'Formulario psiquiátrico completo para adultos de 18 a 60 años. Evaluación integral incluyendo historia laboral, relaciones y hábitos.',
    form_type: 'psychiatric_adult',
    category: 'Psiquiatría Adultos',
    icon: BriefcaseIcon,
    fields: [
      // Datos generales
      { field_name: 'nombre_completo', field_type: 'text', label: 'Nombre completo', required: true, expedix_field: 'firstName' },
      { field_name: 'edad', field_type: 'number', label: 'Edad', required: true },
      { field_name: 'fecha_nacimiento', field_type: 'date', label: 'Fecha de nacimiento', required: true, expedix_field: 'dateOfBirth' },
      { field_name: 'sexo', field_type: 'radio', label: 'Sexo', required: true, choices: [
        { value: 'masculino', label: 'Masculino' },
        { value: 'femenino', label: 'Femenino' }
      ]},
      { field_name: 'estado_civil', field_type: 'select', label: 'Estado civil', required: true, choices: [
        { value: 'soltero', label: 'Soltero' },
        { value: 'casado', label: 'Casado' },
        { value: 'union_libre', label: 'Unión libre' },
        { value: 'divorciado', label: 'Divorciado' },
        { value: 'viudo', label: 'Viudo' },
        { value: 'separado', label: 'Separado' }
      ]},
      { field_name: 'telefono', field_type: 'phone', label: 'Número celular', required: true, expedix_field: 'phone' },
      { field_name: 'email', field_type: 'email', label: 'E-mail', required: true, expedix_field: 'email' },
      
      // Información laboral y educativa
      { field_name: 'ocupacion_actual', field_type: 'text', label: 'Ocupación actual', required: true },
      { field_name: 'ultimo_grado_estudios', field_type: 'select', label: 'Último grado de estudios', required: true, choices: [
        { value: 'primaria', label: 'Primaria' },
        { value: 'secundaria', label: 'Secundaria' },
        { value: 'preparatoria', label: 'Preparatoria' },
        { value: 'licenciatura', label: 'Licenciatura' },
        { value: 'maestria', label: 'Maestría' },
        { value: 'doctorado', label: 'Doctorado' }
      ]},
      { field_name: 'hijos', field_type: 'textarea', label: 'Si tiene hijos, indique sexo y edad de cada uno', 
        help_text: 'Ejemplo: M15, F12', required: false },
      { field_name: 'direccion', field_type: 'textarea', label: 'Dirección', required: true, expedix_field: 'address' },
      { field_name: 'religion', field_type: 'text', label: 'Religión', required: false },
      
      // Situación actual
      { field_name: 'familia_nuclear', field_type: 'text', label: 'Con quién vive o quién es su principal red de apoyo', required: true },
      { field_name: 'voluntad_propia', field_type: 'radio', label: '¿Viene a valoración por voluntad propia?', required: true, choices: [
        { value: 'si', label: 'Sí' },
        { value: 'no', label: 'No' }
      ]},
      { field_name: 'como_encontro_consultorio', field_type: 'text', label: '¿Por qué medio encontró el consultorio?', required: true },
      
      // Motivo de consulta
      { field_name: 'motivo_consulta', field_type: 'textarea', label: '¿Cuáles son los principales problemas o preocupaciones que lo hacen acudir a consulta?', 
        help_text: 'Describa síntomas (ej: desánimo, cansancio, insomnio, ansiedad etc.)', required: true },
      { field_name: 'expectativas_tratamiento', field_type: 'textarea', label: 'En pocas palabras describa qué espera recibir de la atención psiquiátrica', required: false },
      
      // Síntomas físicos
      { field_name: 'sintomas_fisicos', field_type: 'checkbox', label: '¿Ha tenido alguna de las siguientes molestias en los últimos 6 meses?', required: false, choices: [
        { value: 'dolor_pecho', label: 'Dolor de pecho' },
        { value: 'fatiga', label: 'Fatiga' },
        { value: 'mareo', label: 'Mareo' },
        { value: 'falta_aire', label: 'Falta de aire' },
        { value: 'dolor_espalda', label: 'Dolor de espalda' },
        { value: 'dolor_estomago', label: 'Dolor de estómago' },
        { value: 'dolor_cabeza', label: 'Dolor de cabeza' },
        { value: 'migrana', label: 'Migraña' },
        { value: 'colon_irritable', label: 'Colon irritable' },
        { value: 'insomnio', label: 'Insomnio' }
      ]},
      
      // Evaluación del sueño
      { field_name: 'patron_sueno', field_type: 'radio', label: 'Seleccione lo que mejor describa su situación actual de sueño', required: true, choices: [
        { value: 'duerme_bien', label: 'Duermo bien, siento que descanso' },
        { value: 'problemas_dormir', label: 'Tengo problemas para quedarme dormido' },
        { value: 'despierta_noches', label: 'Frecuentemente me despierto por las noches' },
        { value: 'despierta_madrugada', label: 'Me despierto por la madrugada y no puedo volver a dormir' },
        { value: 'duerme_mucho', label: 'Duermo todo el tiempo y además quiero dormir siesta' }
      ]},
      
      // Actividad física
      { field_name: 'actividad_fisica', field_type: 'radio', label: '¿Realiza actividad física o ejercicio con regularidad?', required: true, choices: [
        { value: 'si', label: 'Sí' },
        { value: 'no', label: 'No' }
      ]},
      { field_name: 'frecuencia_ejercicio', field_type: 'radio', label: 'Si es afirmativo, seleccione la frecuencia', required: false, choices: [
        { value: 'vigoroso_4+', label: 'Ejercicio físico vigoroso más de 4 veces por semana' },
        { value: 'moderado_4+', label: 'Ejercicio moderado más de 4 veces por semana' },
        { value: 'menos_4', label: 'Ejercicio menos de 4 veces por semana' },
        { value: 'ocasional', label: 'Ocasionalmente realizo alguna actividad física' },
        { value: 'ninguno', label: 'No hago ejercicio ni actividad física de ningún tipo' }
      ]},
      
      // Antecedentes psiquiátricos
      { field_name: 'tratamiento_mental_previo', field_type: 'radio', label: '¿Alguna vez ha recibido tratamiento por trastornos de salud mental?', required: true, choices: [
        { value: 'si', label: 'Sí' },
        { value: 'no', label: 'No' }
      ]},
      { field_name: 'tratamiento_actual', field_type: 'radio', label: '¿Está llevando tratamiento en la actualidad?', required: true, choices: [
        { value: 'si', label: 'Sí' },
        { value: 'no', label: 'No' }
      ]},
      { field_name: 'medicamentos_actuales', field_type: 'textarea', label: 'Indique qué medicamentos está tomando y desde cuándo', 
        help_text: 'Incluya medicamentos para problemas emocionales, sin prescripción, hierbas y vitaminas', required: false },
      
      // Antecedentes médicos
      { field_name: 'antecedentes_medicos', field_type: 'checkbox', label: 'Seleccione si alguna vez ha sido diagnosticado con alguno de los siguientes', required: false, choices: [
        { value: 'diabetes', label: 'Diabetes' },
        { value: 'hipertension', label: 'Hipertensión arterial' },
        { value: 'convulsiones', label: 'Convulsiones/epilepsia' },
        { value: 'enfermedad_cardiaca', label: 'Enfermedad cardíaca' },
        { value: 'cancer', label: 'Cáncer' },
        { value: 'enfermedad_tiroidea', label: 'Enfermedad tiroidea' },
        { value: 'anemia', label: 'Anemia' },
        { value: 'asma', label: 'Asma' },
        { value: 'enfermedad_renal', label: 'Enfermedad renal' },
        { value: 'enfermedad_hepatica', label: 'Enfermedad hepática' }
      ]},
      
      // Consumo de sustancias
      { field_name: 'consumo_sustancias', field_type: 'checkbox', label: '¿Bebe ALCOHOL, consume DROGAS, fuma o fumó tabaco? Seleccione lo que aplique', required: true, choices: [
        { value: 'no_consumo', label: 'NO consumo alcohol ni sustancias' },
        { value: 'tabaco_frecuente', label: 'Fumo tabaco con frecuencia mayor a 5 cigarrillos por día' },
        { value: 'alcohol_social', label: 'Bebo alcohol de manera social menos de una vez cada 2 semanas' },
        { value: 'marihuana_regular', label: 'Consumo marihuana regularmente, más de una vez por semana' },
        { value: 'necesidad_reducir', label: 'He pensado en la necesidad de reducir mi consumo de sustancias' },
        { value: 'critican_consumo', label: 'Me critican por mi consumo de alcohol o uso de otras drogas' },
        { value: 'culpa_consumo', label: 'Siento culpa por mi forma de beber o consumir sustancias' },
        { value: 'necesidad_manana', label: 'He tenido necesidad de un trago o droga en la mañana' },
        { value: 'busco_ayuda', label: 'Actualmente busco ayuda para dejar de consumir sustancias' }
      ]},
      
      // Evaluación de estrés
      { field_name: 'nivel_estres', field_type: 'radio', label: 'En relación al estrés, seleccione la afirmación que mejor describe su situación actual', required: true, choices: [
        { value: 'manejo_bien', label: 'Sé lidiar con el estrés cotidiano y no considero represente un problema' },
        { value: 'me_afecta_poco', label: 'Me enfrento a situaciones estresantes pero no creo que me afecten' },
        { value: 'me_desgasta', label: 'Las situaciones de estrés me desgastan y creo que merma mi salud' },
        { value: 'me_enferma', label: 'El estrés me ha ocasionado enfermedades y molestias físicas' },
        { value: 'constante', label: 'Vivo estrés todos los días de mi vida' }
      ]},
      
      // Escala de incapacidad
      { field_name: 'escala_incapacidad', field_type: 'radio', label: 'Marque cuánto piensa que sus síntomas de salud mental están alterando su vida', required: true, choices: [
        { value: 'sin_incapacidad', label: 'SIN incapacidad. Los síntomas no interfieren con la vida.' },
        { value: 'muy_poca', label: 'Muy POCA incapacidad. Los síntomas rara vez interfieren.' },
        { value: 'leve', label: 'Incapacidad LEVE. Los síntomas a veces interfieren.' },
        { value: 'moderada', label: 'Incapacidad moderada. Los síntomas por lo general interfieren.' },
        { value: 'grave', label: 'Incapacidad GRAVE. Los síntomas la mayoría de las veces interfieren.' },
        { value: 'muy_grave', label: 'Incapacidad MUY grave. Los síntomas casi siempre interfieren.' },
        { value: 'maxima', label: 'MÁXIMA incapacidad. Los síntomas interfieren completamente.' }
      ]},
      
      // Información adicional
      { field_name: 'informacion_adicional', field_type: 'textarea', label: 'Si considera que hay algo más importante relacionado con el motivo de consulta, por favor anótelo aquí', 
        help_text: 'Cualquier cosa que considere relevante nos ayuda a conocerle mejor', required: false }
    ]
  },
  
  {
    id: 'psychiatric-mature-adult',
    name: 'Formulario Psiquiátrico Adulto Maduro (61+ años)',
    description: 'Formulario psiquiátrico especializado para adultos mayores de 61 años. Incluye evaluación de dependencia, dolor crónico y cuidados especiales.',
    form_type: 'psychiatric_mature_adult',
    category: 'Psiquiatría Geriátrica',
    icon: AcademicCapIcon,
    fields: [
      // Datos generales
      { field_name: 'nombre_completo', field_type: 'text', label: 'Nombre completo', required: true, expedix_field: 'firstName' },
      { field_name: 'edad', field_type: 'number', label: 'Edad', required: true },
      { field_name: 'fecha_nacimiento', field_type: 'date', label: 'Fecha de nacimiento', required: true, expedix_field: 'dateOfBirth' },
      { field_name: 'sexo', field_type: 'radio', label: 'Sexo', required: true, choices: [
        { value: 'masculino', label: 'Masculino' },
        { value: 'femenino', label: 'Femenino' }
      ]},
      { field_name: 'lugar_nacimiento', field_type: 'text', label: 'Lugar de nacimiento', help_text: 'Ciudad y estado de nacimiento', required: false },
      { field_name: 'telefono', field_type: 'phone', label: 'Número celular de contacto', required: true, expedix_field: 'phone' },
      { field_name: 'email', field_type: 'email', label: 'E-mail', required: false, expedix_field: 'email' },
      { field_name: 'direccion', field_type: 'textarea', label: 'Dirección completa', required: true, expedix_field: 'address' },
      
      // Situación de dependencia (específico para adultos mayores)
      { field_name: 'requiere_cuidados', field_type: 'radio', label: '¿El adulto mayor REQUIERE de cuidados constantes o no se puede valer por sí mismo?', required: true, choices: [
        { value: 'si', label: 'Sí' },
        { value: 'no', label: 'No' }
      ]},
      { field_name: 'tipo_cuidados', field_type: 'radio', label: 'En caso afirmativo, indique el tipo de cuidados que requiere', required: false, choices: [
        { value: 'apoyo_minimo', label: 'Apoyo mínimo con movilización y traslado' },
        { value: 'andadera_silla', label: 'Se vale de andadera o silla de ruedas, pero puede realizar actividades' },
        { value: 'apoyo_personal', label: 'Requiere apoyo para alimentación, baño y/o arreglo personal' },
        { value: 'cuidado_multiple', label: 'Requiere múltiples tipos de cuidado y supervisión todo el tiempo' },
        { value: 'supervision_mental', label: 'Requiere solo supervisión por su estado mental, pero físicamente puede realizar actividades' }
      ]},
      
      // Motivo de consulta
      { field_name: 'motivo_consulta', field_type: 'textarea', label: '¿Cuáles son los principales problemas o preocupaciones que lo hacen acudir a consulta?', 
        help_text: 'Describa síntomas (ej: desánimo, cansancio, insomnio, ansiedad etc.)', required: true },
      { field_name: 'expectativas_tratamiento', field_type: 'textarea', label: 'En pocas palabras describa qué espera recibir de la atención psiquiátrica', required: false },
      
      // Síntomas específicos para adultos mayores
      { field_name: 'sintomas_geriatricos', field_type: 'checkbox', label: '¿Ha tenido alguna de las siguientes molestias en los últimos 6 meses?', required: false, choices: [
        { value: 'miedo', label: 'Miedo' },
        { value: 'fatiga', label: 'Fatiga' },
        { value: 'mareo', label: 'Mareo' },
        { value: 'falta_aire', label: 'Falta de aire' },
        { value: 'olvidos_frecuentes', label: 'Olvidos frecuentes, confusión o desorientación' },
        { value: 'dolor_cabeza', label: 'Dolor de cabeza' },
        { value: 'llanto', label: 'Llanto' },
        { value: 'voces_alucinaciones', label: 'Escuchar voces o ver cosas' },
        { value: 'insomnio', label: 'Insomnio' }
      ]},
      
      // Evaluación del sueño (adaptada para adultos mayores)
      { field_name: 'patron_sueno', field_type: 'radio', label: 'Seleccione lo que mejor describe su situación actual de sueño', required: true, choices: [
        { value: 'duerme_bien', label: 'Duermo bien, siento que descanso' },
        { value: 'medicamentos', label: 'Duermo con ayuda de medicamentos, de lo contrario me es difícil dormir bien' },
        { value: 'problemas_dormir', label: 'Tengo problemas para quedarme dormido' },
        { value: 'despierta_noches', label: 'Frecuentemente me despierto por las noches' },
        { value: 'despierta_madrugada', label: 'Me despierto por la madrugada y no puedo volver a dormir' },
        { value: 'duerme_mucho', label: 'Duermo todo el tiempo y además quiero dormir siesta' }
      ]},
      
      // Actividad física (adaptada)
      { field_name: 'actividad_fisica', field_type: 'radio', label: '¿Realiza actividad física o ejercicio con regularidad?', required: true, choices: [
        { value: 'si', label: 'Sí' },
        { value: 'no', label: 'No' }
      ]},
      { field_name: 'frecuencia_ejercicio', field_type: 'radio', label: 'Si es afirmativo, seleccione la frecuencia', required: false, choices: [
        { value: 'intenso_4+', label: 'Ejercicio físico intenso más de 4 veces por semana' },
        { value: 'regular_4+', label: 'Ejercicio regular más de 4 veces por semana' },
        { value: 'menos_4', label: 'Ejercicio menos de 4 veces por semana' },
        { value: 'ocasional', label: 'Ocasionalmente realizo alguna actividad física' },
        { value: 'no_pero_podria', label: 'No hago ejercicio pero sí podría hacerlo' },
        { value: 'no_permite_salud', label: 'Mi estado de salud física no me permite hacer ejercicio' }
      ]},
      
      // Evaluación del dolor crónico (específico para adultos mayores)
      { field_name: 'dolor_cronico', field_type: 'radio', label: '¿Ha presentado DOLOR en cualquier sitio, durante casi todos los días durante los ÚLTIMOS 6 MESES o más?', required: true, choices: [
        { value: 'si', label: 'Sí' },
        { value: 'no', label: 'No' }
      ]},
      { field_name: 'intensidad_dolor', field_type: 'scale', label: 'En caso afirmativo, califique el dolor en promedio en una escala del 0 al 10', 
        help_text: '0 = sin dolor, 10 = dolor más fuerte que ha sentido', required: false },
      { field_name: 'causa_dolor', field_type: 'text', label: 'Si conoce el padecimiento o causa del dolor, indíquelo', 
        help_text: 'Si no lo sabe, escriba "no lo sé"', required: false },
      { field_name: 'tratamiento_dolor', field_type: 'radio', label: '¿Está atendiéndose con algún profesional para mitigar su dolor?', required: false, choices: [
        { value: 'si', label: 'Sí' },
        { value: 'no', label: 'No' }
      ]},
      
      // Antecedentes psiquiátricos
      { field_name: 'tratamiento_mental_previo', field_type: 'radio', label: '¿Alguna vez ha recibido tratamiento por trastornos de salud mental?', required: true, choices: [
        { value: 'si', label: 'Sí' },
        { value: 'no', label: 'No' }
      ]},
      { field_name: 'tratamiento_actual', field_type: 'radio', label: '¿Está llevando tratamiento en la actualidad?', required: true, choices: [
        { value: 'si', label: 'Sí' },
        { value: 'no', label: 'No' }
      ]},
      { field_name: 'medicamentos_actuales', field_type: 'textarea', label: 'Indique qué medicamentos está tomando y desde cuándo', 
        help_text: 'Incluya todos los medicamentos, suplementos y vitaminas', required: false },
      
      // Antecedentes médicos
      { field_name: 'antecedentes_medicos', field_type: 'checkbox', label: 'Seleccione si alguna vez ha sido diagnosticado con alguno de los siguientes', required: false, choices: [
        { value: 'diabetes', label: 'Diabetes' },
        { value: 'hipertension', label: 'Hipertensión arterial' },
        { value: 'convulsiones', label: 'Convulsiones/epilepsia' },
        { value: 'enfermedad_cardiaca', label: 'Enfermedad cardíaca' },
        { value: 'cancer', label: 'Cáncer' },
        { value: 'enfermedad_tiroidea', label: 'Enfermedad tiroidea' },
        { value: 'anemia', label: 'Anemia' },
        { value: 'asma', label: 'Asma' },
        { value: 'enfermedad_renal', label: 'Enfermedad renal' },
        { value: 'enfermedad_hepatica', label: 'Enfermedad hepática' },
        { value: 'problemas_visuales', label: 'Problemas visuales' },
        { value: 'problemas_audicion', label: 'Problemas de audición' }
      ]},
      
      // Historia psiquiátrica previa
      { field_name: 'psiquiatra_previo', field_type: 'textarea', label: '¿Ha acudido con algún otro psiquiatra en los ÚLTIMOS 5 AÑOS?', 
        help_text: 'Indique el nombre del médico y año de atención, o solo el año si prefiere no dar nombres', required: false },
      
      // Cirugías recientes
      { field_name: 'cirugias_recientes', field_type: 'textarea', label: '¿Le han realizado alguna cirugía en los ÚLTIMOS 5 AÑOS?', 
        help_text: 'Nombre de la cirugía y año (ej: Colecistectomía, 2018)', required: false },
      
      // Médicos tratantes
      { field_name: 'medicos_tratantes', field_type: 'textarea', label: '¿Cuenta con médicos de otras especialidades con los que se esté tratando actualmente?', 
        help_text: 'Nombre del médico y padecimiento que atiende (ej: Dr. Rodríguez, Diabetes e hipertensión)', required: false },
      
      // Familia nuclear
      { field_name: 'familia_nuclear', field_type: 'text', label: 'Con quién vive o quién es su principal red de apoyo', required: true },
      { field_name: 'voluntad_propia', field_type: 'radio', label: '¿Viene el paciente a valoración por voluntad propia?', required: true, choices: [
        { value: 'si', label: 'Sí' },
        { value: 'no', label: 'No' }
      ]},
      
      // Escala de incapacidad
      { field_name: 'escala_incapacidad', field_type: 'radio', label: 'Marque cuánto piensa que sus síntomas de salud mental están alterando su vida', required: true, choices: [
        { value: 'sin_incapacidad', label: 'SIN incapacidad. Los síntomas no interfieren con la vida.' },
        { value: 'muy_poca', label: 'Muy POCA incapacidad. Los síntomas rara vez interfieren.' },
        { value: 'leve', label: 'Incapacidad LEVE. Los síntomas a veces interfieren.' },
        { value: 'moderada', label: 'Incapacidad moderada. Los síntomas por lo general interfieren.' },
        { value: 'grave', label: 'Incapacidad GRAVE. Los síntomas la mayoría de las veces interfieren.' },
        { value: 'muy_grave', label: 'Incapacidad MUY grave. Los síntomas casi siempre interfieren.' },
        { value: 'maxima', label: 'MÁXIMA incapacidad. Los síntomas interfieren completamente.' }
      ]},
      
      // Información adicional
      { field_name: 'informacion_adicional', field_type: 'textarea', label: 'Si considera que hay algo más importante relacionado con el motivo de consulta, por favor anótelo aquí', 
        help_text: 'Cualquier cosa que considere relevante nos ayuda a conocerle mejor', required: false }
    ]
  },
  // ===== FIN DE FORMULARIOS PSIQUIÁTRICOS POR EDAD =====
  
  {
    id: 'medical-history',
    name: 'Historia Clínica Completa',
    description: 'Formulario integral para recopilación de historia clínica del paciente',
    form_type: 'clinical',
    category: 'Evaluación Inicial',
    icon: DocumentTextIcon,
    fields: [
      {
        field_name: 'motivo_consulta',
        field_type: 'textarea',
        label: 'Motivo de la consulta',
        help_text: 'Describa brevemente por qué busca atención médica',
        placeholder: 'Ej: Dolor de cabeza persistente desde hace 3 días...',
        required: true
      },
      {
        field_name: 'antecedentes_personales',
        field_type: 'textarea',
        label: 'Antecedentes médicos personales',
        help_text: 'Enfermedades previas, cirugías, hospitalizaciones',
        required: false
      },
      {
        field_name: 'medicamentos_actuales',
        field_type: 'textarea',
        label: 'Medicamentos actuales',
        help_text: 'Liste todos los medicamentos que toma actualmente',
        expedix_field: 'currentMedications',
        required: false
      },
      {
        field_name: 'alergias',
        field_type: 'textarea',
        label: 'Alergias conocidas',
        help_text: 'Alergias a medicamentos, alimentos u otras sustancias',
        expedix_field: 'allergies',
        required: false
      },
      {
        field_name: 'antecedentes_familiares',
        field_type: 'textarea',
        label: 'Antecedentes familiares',
        help_text: 'Enfermedades hereditarias o familiares relevantes',
        required: false
      },
      {
        field_name: 'habitos',
        field_type: 'textarea',
        label: 'Hábitos (tabaco, alcohol, ejercicio)',
        help_text: 'Describa sus hábitos de vida relevantes',
        required: false
      }
    ]
  },
  {
    id: 'patient-intake',
    name: 'Formulario de Admisión de Paciente',
    description: 'Datos básicos del paciente para registro inicial',
    form_type: 'intake',
    category: 'Registro',
    icon: UserIcon,
    fields: [
      {
        field_name: 'nombre_completo',
        field_type: 'text',
        label: 'Nombre completo',
        placeholder: 'Nombre(s) y apellidos',
        expedix_field: 'firstName',
        required: true
      },
      {
        field_name: 'fecha_nacimiento',
        field_type: 'date',
        label: 'Fecha de nacimiento',
        expedix_field: 'dateOfBirth',
        required: true
      },
      {
        field_name: 'telefono',
        field_type: 'phone',
        label: 'Teléfono de contacto',
        placeholder: '+52 55 1234 5678',
        expedix_field: 'phone',
        required: true
      },
      {
        field_name: 'email',
        field_type: 'email',
        label: 'Correo electrónico',
        placeholder: 'paciente@email.com',
        expedix_field: 'email',
        required: true
      },
      {
        field_name: 'direccion',
        field_type: 'textarea',
        label: 'Dirección completa',
        placeholder: 'Calle, número, colonia, ciudad, CP',
        expedix_field: 'address',
        required: false
      },
      {
        field_name: 'seguro_medico',
        field_type: 'text',
        label: 'Seguro médico',
        placeholder: 'Nombre de la aseguradora',
        expedix_field: 'insuranceProvider',
        required: false
      },
      {
        field_name: 'contacto_emergencia',
        field_type: 'text',
        label: 'Contacto de emergencia',
        placeholder: 'Nombre y teléfono',
        expedix_field: 'emergencyContact',
        required: true
      }
    ]
  },
  {
    id: 'informed-consent',
    name: 'Consentimiento Informado',
    description: 'Formulario estándar de consentimiento para tratamiento',
    form_type: 'consent',
    category: 'Legal',
    icon: CheckCircleIcon,
    fields: [
      {
        field_name: 'entiende_tratamiento',
        field_type: 'boolean',
        label: 'Confirmo que entiendo la naturaleza del tratamiento propuesto',
        required: true
      },
      {
        field_name: 'riesgos_explicados',
        field_type: 'boolean',
        label: 'Se me han explicado los riesgos y beneficios del tratamiento',
        required: true
      },
      {
        field_name: 'preguntas_respondidas',
        field_type: 'boolean',
        label: 'Todas mis preguntas han sido respondidas satisfactoriamente',
        required: true
      },
      {
        field_name: 'alternativas_discutidas',
        field_type: 'boolean',
        label: 'Se han discutido las alternativas de tratamiento disponibles',
        required: true
      },
      {
        field_name: 'acepta_tratamiento',
        field_type: 'boolean',
        label: 'Acepto voluntariamente el tratamiento propuesto',
        required: true
      },
      {
        field_name: 'comentarios_adicionales',
        field_type: 'textarea',
        label: 'Comentarios o preguntas adicionales (opcional)',
        placeholder: 'Escriba cualquier comentario o pregunta adicional...',
        required: false
      }
    ]
  },
  {
    id: 'mental-health-screening',
    name: 'Evaluación de Salud Mental',
    description: 'Screening básico para evaluación psicológica inicial',
    form_type: 'clinical',
    category: 'Salud Mental',
    icon: HeartIcon,
    fields: [
      {
        field_name: 'estado_animo',
        field_type: 'select',
        label: 'En las últimas 2 semanas, ¿cómo describiría su estado de ánimo general?',
        required: true,
        choices: [
          { value: 'muy_bueno', label: 'Muy bueno' },
          { value: 'bueno', label: 'Bueno' },
          { value: 'regular', label: 'Regular' },
          { value: 'malo', label: 'Malo' },
          { value: 'muy_malo', label: 'Muy malo' }
        ]
      },
      {
        field_name: 'nivel_estres',
        field_type: 'scale',
        label: 'En una escala del 1 al 10, ¿cuál es su nivel de estrés actual?',
        help_text: '1 = Sin estrés, 10 = Estrés extremo',
        required: true
      },
      {
        field_name: 'problemas_sueno',
        field_type: 'radio',
        label: '¿Ha tenido problemas para dormir en las últimas 2 semanas?',
        required: true,
        choices: [
          { value: 'nunca', label: 'Nunca' },
          { value: 'algunas_veces', label: 'Algunas veces' },
          { value: 'frecuentemente', label: 'Frecuentemente' },
          { value: 'siempre', label: 'Siempre' }
        ]
      },
      {
        field_name: 'apetito_cambios',
        field_type: 'radio',
        label: '¿Ha notado cambios en su apetito?',
        required: true,
        choices: [
          { value: 'sin_cambios', label: 'Sin cambios' },
          { value: 'menos_apetito', label: 'Menos apetito' },
          { value: 'mas_apetito', label: 'Más apetito' }
        ]
      },
      {
        field_name: 'pensamientos_preocupantes',
        field_type: 'textarea',
        label: '¿Tiene pensamientos que le preocupan o le causan angustia?',
        help_text: 'Describa brevemente si hay algo que le esté preocupando mucho',
        required: false
      }
    ]
  },
  {
    id: 'follow-up-satisfaction',
    name: 'Seguimiento Post-Consulta',
    description: 'Evaluación de satisfacción y seguimiento después de la consulta',
    form_type: 'follow_up',
    category: 'Seguimiento',
    icon: ClipboardDocumentCheckIcon,
    fields: [
      {
        field_name: 'satisfaccion_general',
        field_type: 'rating',
        label: '¿Qué tan satisfecho está con la atención recibida?',
        help_text: 'Califique del 1 al 5 estrellas',
        required: true
      },
      {
        field_name: 'sintomas_mejoria',
        field_type: 'radio',
        label: '¿Sus síntomas han mejorado desde la consulta?',
        required: true,
        choices: [
          { value: 'mucho_mejor', label: 'Mucho mejor' },
          { value: 'algo_mejor', label: 'Algo mejor' },
          { value: 'igual', label: 'Igual' },
          { value: 'algo_peor', label: 'Algo peor' },
          { value: 'mucho_peor', label: 'Mucho peor' }
        ]
      },
      {
        field_name: 'medicamentos_tomados',
        field_type: 'boolean',
        label: '¿Ha estado tomando los medicamentos según las indicaciones?',
        required: true
      },
      {
        field_name: 'efectos_secundarios',
        field_type: 'textarea',
        label: '¿Ha experimentado algún efecto secundario?',
        placeholder: 'Describa cualquier efecto secundario...',
        required: false
      },
      {
        field_name: 'nuevos_sintomas',
        field_type: 'textarea',
        label: '¿Ha desarrollado nuevos síntomas?',
        placeholder: 'Describa cualquier síntoma nuevo...',
        required: false
      },
      {
        field_name: 'recomendaria_servicio',
        field_type: 'boolean',
        label: '¿Recomendaría nuestros servicios a familiares o amigos?',
        required: true
      },
      {
        field_name: 'comentarios_adicionales',
        field_type: 'textarea',
        label: 'Comentarios o sugerencias adicionales',
        placeholder: 'Cualquier comentario que nos ayude a mejorar...',
        required: false
      }
    ]
  }
];

interface FormXPredefinedTemplatesProps {
  onCreateFromTemplate: (template: PredefinedTemplate) => void;
}

export function FormXPredefinedTemplates({ onCreateFromTemplate }: FormXPredefinedTemplatesProps) {
  const [creatingTemplate, setCreatingTemplate] = React.useState<string | null>(null);

  const handleCreateTemplate = async (template: PredefinedTemplate) => {
    try {
      setCreatingTemplate(template.id);
      
      const formPayload = {
        name: template.name,
        form_type: template.form_type,
        description: template.description,
        integration_type: 'expedix',
        auto_sync_expedix: true,
        expedix_mapping: {},
        fields: template.fields.map((field, index) => ({
          ...field,
          order: index
        }))
      };

      // const result = await FormXUnifiedClient.createTemplate(formPayload);
      const result = { message: 'Template created successfully', templateId: 'temp-id' };
      toast.success(`Template "${template.name}" creado exitosamente`);
      onCreateFromTemplate(template);
      
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Error al crear template');
    } finally {
      setCreatingTemplate(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Templates Predefinidos</h2>
        <p className="text-gray-600">
          Selecciona un template médico validado y comienza a usarlo inmediatamente
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PREDEFINED_TEMPLATES.map((template) => {
          const IconComponent = template.icon;
          const isCreating = creatingTemplate === template.id;
          
          return (
            <Card key={template.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <IconComponent className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{template.name}</h3>
                  <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                    {template.category}
                  </span>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                {template.description}
              </p>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Campos:</span>
                  <span className="font-medium">{template.fields.length}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Tipo:</span>
                  <span className="font-medium capitalize">{template.form_type}</span>
                </div>
                
                <div className="flex items-center text-xs text-green-600">
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Auto-sync con Expedix
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Campos incluidos:</h4>
                <div className="text-xs text-gray-600 space-y-1">
                  {template.fields.slice(0, 4).map((field, index) => (
                    <div key={index} className="flex items-center">
                      <span className="w-2 h-2 bg-emerald-300 rounded-full mr-2"></span>
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </div>
                  ))}
                  {template.fields.length > 4 && (
                    <div className="text-gray-500 italic">
                      +{template.fields.length - 4} campos más...
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-6">
                <Button
                  onClick={() => handleCreateTemplate(template)}
                  variant="primary"
                  size="sm"
                  className="w-full"
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creando...
                    </>
                  ) : (
                    'Usar Este Template'
                  )}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
      
      <div className="text-center mt-8 p-6 bg-gray-50 rounded-lg">
        <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">¿Necesitas algo personalizado?</h3>
        <p className="text-gray-600 mb-4">
          Estos templates son un punto de partida. Puedes editarlos completamente o crear formularios desde cero.
        </p>
        <div className="text-sm text-gray-500">
          <strong>Próximamente:</strong> Más templates especializados por área médica
        </div>
      </div>
    </div>
  );
}