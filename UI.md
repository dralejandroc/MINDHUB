# MindHub UI/UX Design Philosophy

## Core User Profile

**Primary Users**: Psychiatrists and Psychologists (Mental Health Professionals)

- High cognitive load during patient sessions
- Need quick access to information
- Require minimal clicks for common actions
- Value clean, distraction-free interfaces
- Focus on patient care, not technology

## Design Principles

### 1. **Patient-Centric Architecture**

Everything revolves around the patient record. The patient's card and timeline are the central hubs of information.

### 2. **One-Click Philosophy**

Common actions should require only one click:

- Mark prescription-only visit
- Flag late arrival
- Send resources
- Start assessment
- View timeline

### 3. **Intelligent Anticipation**

The system should predict needs without being intrusive:

- Auto-suggest assessments based on diagnosis
- Pre-fill common prescriptions
- Highlight irregular patterns
- Smart scheduling based on patient history

### 4. **Visual Hierarchy**

- **Primary**: Patient name, current status, alerts
- **Secondary**: Recent activities, upcoming appointments
- **Tertiary**: Historical data, administrative info

## Patient Experience Flow

### Patient Card Design

```
┌─────────────────────────────────────┐
│ [Photo] Juan García, 34 años        │
│         Depression, Anxiety          │
│ ⚠️ 3 missed appointments            │
│ 💊 Prescription-only last 2 visits  │
│ [Timeline] [Prescribe] [Assess]     │
└─────────────────────────────────────┘
```

### Timeline Intelligence

The timeline should automatically categorize and flag:

1. **Attendance Patterns**
   - ✅ On-time arrival
   - ⏰ Late arrival (>15 min)
   - ❌ No-show
   - 🔄 Rescheduled
   - ❗ Cancelled <24hrs

2. **Visit Types**
   - 🏥 Full consultation
   - 💊 Prescription-only
   - 📞 Phone consultation
   - 💬 Between-visit contact
   - 🚨 Emergency contact

3. **Patient Behavior Alerts**
   - 🔴 High risk: Multiple cancellations
   - 🟡 Medium risk: Prescription-only pattern
   - 🟢 Good adherence: Regular attendance

### Quick Actions Menu

When viewing a patient, these actions should be immediately available:

```
[✏️ Nota rápida] [💊 Receta] [📊 Evaluación Clinimetrix] [📅 Agendar] [📤 Enviar recurso]
```

## Clinimetrix Integration

### Assessment Workflow

1. **One-click start** from patient dashboard
2. **Auto-save** progress every question
3. **Instant scoring** with interpretation
4. **Automatic timeline entry** with results
5. **Smart tagging prompt** for significant scores

### Score Visualization

```
PHQ-9 Progress
│
20├─────────●───── Severe
15├────●────┼─────
10├─●──┼────┼───── Moderate
 5├─┼──┼────┼─────
 0└─┴──┴────┴─────
  Jan Feb  Mar Apr

⚠️ Score increased by 5 points
[🏷️ Tag as "Worsening"] [📝 Add Note] [👁️ View Details]
```

### Intelligent Tagging System

When scores cross thresholds:

- **Automatic prompt**: "PHQ-9 score of 18 indicates severe depression. Tag patient?"
- **Suggested tags**: Based on score interpretation
- **Custom tags**: Professional can add specific notes
- **Timeline integration**: Tags appear as markers

## Prescription Tracking

### Quick Prescription Entry

Single click from patient view:

```
[💊 Prescription Only Visit]
  ├─ Auto-fills current medications
  ├─ Marks as "between visits"
  └─ Flags if pattern detected
```

### Pattern Detection

System alerts when:

- 3+ consecutive prescription-only visits
- Patient hasn't had full consultation in 60+ days
- Controlled substance refills without therapy

## Communication Tracking

### For Psychologists

Track between-session contacts:

```
[📱 Patient Contact]
  ├─ Phone call (duration)
  ├─ Text/WhatsApp
  ├─ Email
  └─ Crisis contact
```

### Boundary Alerts

- 🔴 Excessive contact (customizable threshold)
- 🟡 After-hours communication
- 🟢 Appropriate contact frequency

## Smart Categorization

### Automatic Patient Categories

Based on behavior patterns:

1. **Active** - Regular appointments, good adherence
2. **At Risk** - Missed appointments, irregular patterns
3. **Prescription Only** - Primarily medication visits
4. **Inactive** - No visits >360 days
5. **Crisis** - Frequent emergency contacts

### Visual Indicators

Each category has distinct visual treatment:

- Color coding in patient lists
- Icons on patient cards
- Timeline markers
- Dashboard filters

## Hub Integration

### Seamless Flow Between Hubs

- **Expedix → Clinimetrix**: One click to assess
- **Clinimetrix → Resources**: Auto-suggest resources based on scores
- **Resources → Expedix**: Track what was sent in timeline
- **All → Timeline**: Everything appears chronologically

### Context Preservation

When moving between hubs:

- Patient context maintained
- Return to previous view easily
- Breadcrumb navigation
- Quick patient switcher

## Performance Optimizations

### Speed Requirements

- Patient card load: <100ms
- Timeline render: <200ms
- Assessment start: <500ms
- Search results: <300ms

### Preemptive Loading

- Next likely patient in queue
- Common assessment scales
- Recent prescriptions
- Upcoming appointments

## Accessibility

### Professional-Friendly Features

- Keyboard shortcuts for power users
- Tab navigation through forms
- Quick search with smart filters
- Bulk actions for administrative tasks
- Export options for reports

### Reduced Cognitive Load

- Progressive disclosure of information
- Clear visual hierarchy
- Consistent interaction patterns
- Minimal decision points
- Smart defaults

## Mobile Considerations

### Priority Features for Mobile

1. View patient timeline
2. Quick notes
3. Emergency contact info
4. Assessment scores
5. Prescription history

### Gesture Support

- Swipe between patients
- Pull to refresh timeline
- Long press for quick actions
- Pinch to zoom timeline

## Error Prevention

### Smart Validations

- Warn if assessment incomplete
- Confirm prescription changes
- Alert for scheduling conflicts
- Validate before deleting data

### Undo Capabilities

- Recent actions list
- One-click undo
- Revision history
- Audit trail

## Future Enhancements

### AI-Powered Suggestions

- Treatment plan recommendations
- Risk assessment predictions
- Optimal scheduling suggestions
- Resource recommendations based on diagnosis

### Integration Points

- Telemedicine platforms
- Pharmacy systems
- Insurance providers
- Emergency services

---

## Implementation Notes

This document serves as the north star for all UI/UX decisions in MindHub. Every feature should be evaluated against these principles:

1. Does it reduce clicks?
2. Does it provide value to the professional?
3. Does it help patient care?
4. Is it immediately understandable?
5. Does it integrate seamlessly?

The goal is to make MindHub invisible - professionals should focus on patients, not software.

---

## Principios de Economía de Espacio

### Filosofía de Información Densa

**Objetivo**: Maximizar la información visible en el menor espacio posible, permitiendo ver a simple vista la mayor cantidad de datos relevantes para el cuidado del paciente.

### Implementación de Espaciado Eficiente

#### Elementos Compactos Estandarizados
- **Tags/Filtros**: `text-xs px-2 py-1` con iconos para identificación rápida
- **Inputs de formulario**: `px-2 py-1` para densidad sin sacrificar usabilidad  
- **Cards secundarios**: `p-3` en lugar de `p-6` cuando el contenido lo permite
- **Grids optimizados**: Usar el mínimo de columnas necesarias para información esencial

#### Consolidación de Información
```typescript
// ✅ CORRECTO: Una línea para fecha + tipo
<div className="flex items-center space-x-4">
  <div>Tipo: <select className="px-2 py-1 text-sm">...</select></div>
  <div>📅 Fecha: <input type="date" className="px-2 py-1 text-sm">...</div>
</div>

// ❌ INCORRECTO: Containers separados
<Card><input type="date">...</Card>
<Card><select>tipo</select></Card>
```

#### Signos Vitales para Salud Mental
- **Eliminados**: O2 (irrelevante para psiquiatría/psicología)
- **Compactados**: Grid de 6 columnas máximo
- **Labels cortos**: "F.C." en lugar de "Frecuencia Cardíaca"
- **Tamaño reducido**: `px-2 py-1` vs `px-3 py-2`

#### Anti-Patrones de Espacio
❌ **Títulos redundantes**: No repetir nombre del paciente si ya aparece en header
❌ **Botones duplicados**: Una sola acción "Nueva Consulta" por vista
❌ **Containers innecesarios**: Un Card entero solo para un campo fecha
❌ **Campos irrelevantes**: Datos que no aportan valor clínico específico

### Componentes Optimizados

#### MentalExam Reutilizable
- Sin signos vitales (específico para examen mental)
- Configuración flexible via props
- Tamaños de campo optimizados para tablets

#### Timeline Compacto
- Filtros pequeños con iconos identificativos
- Header sin redundancia del nombre de paciente
- Eventos densos pero legibles

### Métricas de Éxito para Economía de Espacio

1. **Información visible**: Máxima cantidad sin scroll en 1366x768
2. **Tiempo de escaneo**: <3 segundos para localizar información clave
3. **Clics reducidos**: Menos interacciones para acceder a datos frecuentes
4. **Responsividad**: Funcionalidad completa en tablets (768px+)

*Última optimización: Enero 2025 - ConsultationNotes, PatientTimeline, MentalExam*
