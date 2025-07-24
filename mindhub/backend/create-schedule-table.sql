-- Create schedule_configurations table
CREATE TABLE IF NOT EXISTS `schedule_configurations` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `workingHoursStart` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `workingHoursEnd` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `lunchBreakEnabled` tinyint(1) NOT NULL DEFAULT '0',
  `lunchBreakStart` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lunchBreakEnd` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `workingDays` json NOT NULL,
  `defaultAppointmentDuration` int NOT NULL DEFAULT '60',
  `consultationTypes` json NOT NULL,
  `blockedDates` json NOT NULL DEFAULT (json_array()),
  `maxDailyAppointments` int NOT NULL DEFAULT '20',
  `bufferTime` int NOT NULL DEFAULT '0',
  `reminders` json NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `schedule_configurations_userId_key` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migrate existing file-based configurations to database
INSERT IGNORE INTO schedule_configurations (
  id, userId, workingHoursStart, workingHoursEnd, lunchBreakEnabled, 
  lunchBreakStart, lunchBreakEnd, workingDays, defaultAppointmentDuration,
  consultationTypes, blockedDates, maxDailyAppointments, bufferTime, reminders
) VALUES 
(
  'sched_user_dr_alejandro', 
  'user-dr-alejandro', 
  '08:30', 
  '19:30', 
  true, 
  '14:00', 
  '16:00',
  JSON_ARRAY('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'),
  30,
  JSON_ARRAY(
    JSON_OBJECT('id', '1', 'name', 'psiquiatria 1era V', 'duration', 60, 'price', 1700, 'color', 'bg-blue-500'),
    JSON_OBJECT('id', '2', 'name', 'Subsecuente', 'duration', 60, 'price', 1250, 'color', 'bg-green-500'),
    JSON_OBJECT('id', '3', 'name', 'Videoconsulta', 'duration', 60, 'price', 1250, 'color', 'bg-purple-500'),
    JSON_OBJECT('id', '4', 'name', 'Terapia individual', 'duration', 60, 'price', 1000, 'color', 'bg-orange-500'),
    JSON_OBJECT('id', '5', 'name', 'Control de medicación', 'duration', 30, 'price', 800, 'color', 'bg-red-500')
  ),
  JSON_ARRAY(),
  20,
  0,
  JSON_OBJECT(
    'whatsapp', JSON_OBJECT(
      'enabled', true, 
      'template', 'Hola {PATIENT_NAME}, te recordamos tu cita con {PROFESSIONAL_NAME} el {DATE} a las {TIME} en {CLINIC_NAME}. Ubicado en {CLINIC_ADDRESS}. Si necesitas reprogramar, contacta al {CLINIC_PHONE}.',
      'hoursBeforeAppointment', 24
    ),
    'email', JSON_OBJECT(
      'enabled', true,
      'template', 'Estimado/a {PATIENT_NAME},\\n\\nEste es un recordatorio de su cita médica:\\n\\nFecha: {DATE}\\nHora: {TIME}\\nProfesional: {PROFESSIONAL_NAME}\\nTipo de consulta: {APPOINTMENT_TYPE}\\n\\nDirección: {CLINIC_NAME}\\n{CLINIC_ADDRESS}\\nTeléfono: {CLINIC_PHONE}\\n\\nPor favor llegue 15 minutos antes de su cita.\\n\\nSaludos cordiales,\\nEquipo de {CLINIC_NAME}',
      'hoursBeforeAppointment', 24
    )
  )
),
(
  'sched_user_admin_system', 
  'user-admin-system', 
  '09:00', 
  '18:00', 
  true, 
  '13:00', 
  '14:00',
  JSON_ARRAY('monday', 'tuesday', 'wednesday', 'thursday', 'friday'),
  45,
  JSON_ARRAY(
    JSON_OBJECT('id', '1', 'name', 'Consulta administrativa', 'duration', 60, 'price', 800, 'color', 'bg-blue-500'),
    JSON_OBJECT('id', '2', 'name', 'Revisión', 'duration', 30, 'price', 500, 'color', 'bg-green-500')
  ),
  JSON_ARRAY(),
  15,
  10,
  JSON_OBJECT(
    'whatsapp', JSON_OBJECT(
      'enabled', false, 
      'template', 'Recordatorio: {PATIENT_NAME}, tienes cita el {DATE} a las {TIME} con {PROFESSIONAL_NAME}.',
      'hoursBeforeAppointment', 2
    ),
    'email', JSON_OBJECT(
      'enabled', true,
      'template', 'Estimado/a {PATIENT_NAME},\\n\\nRecordatorio de cita:\\nFecha: {DATE}\\nHora: {TIME}\\nProfesional: {PROFESSIONAL_NAME}\\n\\nSaludos.',
      'hoursBeforeAppointment', 6
    )
  )
);