# Glian - Guía de Marca y Estilo

## 🎯 Misión y Visión

### Misión
Empoderar a profesionales de la salud mental con herramientas digitales intuitivas que mejoren la calidad de atención y faciliten la gestión clínica.

### Visión
Ser la plataforma líder en gestión de salud mental en Latinoamérica, transformando la manera en que se brinda atención psicológica y psiquiátrica.

## 🎨 Identidad Visual

### Logo
- **Nombre**: Glian
- **Tipografía**: Hanken Grotesk (sans-serif moderna, profesional)
- **Símbolo**: Diseño característico de Glian (ver archivos en `/docs/Brand-archivos-glian/logos-glian-PNG/`)
- **Variantes**: Logo primario, Isotipo, Logos alternativos

### Paleta de Colores

#### Colores Principales
```css
--primary: #0991b2;           /* Turquesa/Teal - Confianza, profesionalismo, claridad */
--secondary: #a0d8c7;         /* Verde agua - Calma, bienestar, terapéutico */
--secondary-2: #133b44;       /* Azul petróleo oscuro - Estabilidad, profundidad */
--secondary-3: #efefec;       /* Gris claro/Off-white - Limpieza, espacio, neutralidad */
```

#### Colores de UI
```css
--ui-background: #FFFFFF;
--ui-surface: #efefec;        /* Secondary 3 como superficie */
--ui-border: #a0d8c7;         /* Secondary como borders suaves */
--ui-text-primary: #133b44;   /* Secondary 2 para texto principal */
--ui-text-secondary: #0991b2; /* Primary para texto secundario/links */
```

#### Colores de Estado (Sistema)
```css
--success: #10b981;           /* Verde éxito */
--warning: #f59e0b;           /* Naranja advertencia */
--error: #ef4444;             /* Rojo error */
--info: #0991b2;              /* Primary para información */
```

### Aplicación de Colores en Módulos

**IMPORTANTE**: Todos los módulos comparten la misma paleta de colores de Glian. La identificación visual de cada módulo se realiza mediante:
- **Iconos característicos** (sin colores distintivos por módulo)
- **Tipografía consistente** (Hanken Grotesk)
- **Espaciado uniforme** (sistema de 8px)

#### Composición Visual Unificada
```css
/* Todos los módulos usan: */
Headers principales:    background: primary (#0991b2)
Botones primarios:      background: primary (#0991b2)
Botones secundarios:    background: secondary (#a0d8c7)
Cards/Superficie:       background: secondary-3 (#efefec)
Texto principal:        color: secondary-2 (#133b44)
Links/Acciones:         color: primary (#0991b2)
Borders:                border-color: secondary (#a0d8c7)
```

#### Módulos de Glian
1. **Expedix** - Gestión de Pacientes
   - Icono: Carpeta médica/Expediente
   - Uso de paleta: Consistente con marca

2. **ClinimetrixPro** - Evaluaciones Psicométricas
   - Icono: Gráfico/Análisis
   - Uso de paleta: Consistente con marca

3. **Resources** - Recursos y Biblioteca
   - Icono: Libro/Biblioteca
   - Uso de paleta: Consistente con marca

4. **Agenda** - Sistema de Citas
   - Icono: Calendario
   - Uso de paleta: Consistente con marca

5. **Finance** - Gestión Financiera
   - Icono: Moneda/Factura
   - Uso de paleta: Consistente con marca

6. **FrontDesk** - Recepción
   - Icono: Mesa de recepción
   - Uso de paleta: Consistente con marca

### Tipografía

#### Familia Tipográfica Principal
- **Familia**: Hanken Grotesk (sans-serif moderna)
- **Ubicación**: `/docs/Brand-archivos-glian/Fuente-Hanken-Grotesk/`
- **Pesos disponibles**:
  - Regular (400) - Texto general
  - SemiBold (600) - Subtítulos, énfasis
  - Bold (700) - Títulos, headers

#### Jerarquía Tipográfica
```css
h1 {
  font-family: 'Hanken Grotesk', sans-serif;
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--secondary-2); /* #133b44 */
}

h2 {
  font-family: 'Hanken Grotesk', sans-serif;
  font-size: 2rem;
  font-weight: 600;
  color: var(--secondary-2);
}

h3 {
  font-family: 'Hanken Grotesk', sans-serif;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--secondary-2);
}

body {
  font-family: 'Hanken Grotesk', sans-serif;
  font-size: 1rem;
  font-weight: 400;
  color: var(--secondary-2);
}

small {
  font-family: 'Hanken Grotesk', sans-serif;
  font-size: 0.875rem;
  font-weight: 400;
  color: var(--primary); /* #0991b2 para texto secundario */
}
```

### Iconografía

#### Sistema de Iconos
- **Librería**: Lucide Icons (estilo outline consistente)
- **Tamaño base**: 24px
- **Stroke width**: 2px
- **Colores de iconos**:
  - Iconos principales: `color: var(--primary)` (#0991b2)
  - Iconos secundarios: `color: var(--secondary-2)` (#133b44)
  - Iconos en hover: `color: var(--secondary)` (#a0d8c7)

#### Identificación de Módulos por Icono
Cada módulo se identifica visualmente mediante un icono característico, NO por color:
- **Expedix**: FolderOpen, FileText
- **ClinimetrixPro**: BarChart, Activity
- **Resources**: BookOpen, Library
- **Agenda**: Calendar, Clock
- **Finance**: DollarSign, Receipt
- **FrontDesk**: UserCheck, Clipboard

## 💬 Voz y Tono

### Principios de Comunicación
1. **Profesional pero Accesible**: Lenguaje claro sin jerga excesiva
2. **Empático**: Entendemos los desafíos de los profesionales de salud mental
3. **Confiable**: Información precisa y respaldada
4. **Eficiente**: Directo al punto, respetando el tiempo del usuario

### Ejemplos de Mensajes

#### ✅ Correcto
- "Gestiona expedientes clínicos de forma segura y eficiente"
- "Aplica escalas psicométricas validadas con un click"
- "Tu práctica clínica, simplificada"

#### ❌ Evitar
- "La mejor solución del mercado" (muy genérico)
- "Revolucionamos la psicología" (exagerado)
- "Sistema súper fácil" (informal)

## 🎯 Propuesta de Valor

### Para Clínicas
"Unifica tu equipo clínico en una plataforma diseñada para la colaboración y el crecimiento profesional"

### Para Psicólogos
"Herramientas profesionales que te permiten enfocarte en lo que importa: tus pacientes"

### Para Psiquiatras
"Gestión clínica integral con las mejores prácticas en salud mental digital"

## 📱 Aplicación en UI

### Principios de Diseño
1. **Claridad**: Interfaces limpias sin elementos distractores
2. **Consistencia**: Mismos patrones en todos los módulos (sin variaciones de color por módulo)
3. **Accesibilidad**: WCAG 2.1 AA compliant
4. **Responsivo**: Mobile-first approach
5. **Identidad por Iconografía**: Los módulos se distinguen por sus iconos, no por colores

### Componentes Clave
- **Botones**: Redondeados (radius: 8px), con sombra sutil
- **Cards**: Bordes suaves, background: `secondary-3` (#efefec)
- **Iconos**: Lucide Icons (estilo outline, consistente en toda la plataforma)
- **Espaciado**: Sistema de 8px base

### Estados Interactivos
```css
/* Hover */
.button-primary:hover {
  background-color: var(--primary);
  opacity: 0.9;
  box-shadow: 0 4px 6px rgba(9, 145, 178, 0.2);
}

/* Active */
.button-primary:active {
  transform: scale(0.98);
}

/* Disabled */
.button-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Focus (Accesibilidad) */
.button-primary:focus {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
```

### Sistema de Elevación (Sombras)
```css
--shadow-sm: 0 1px 2px rgba(19, 59, 68, 0.05);
--shadow-md: 0 4px 6px rgba(19, 59, 68, 0.1);
--shadow-lg: 0 10px 15px rgba(19, 59, 68, 0.1);
--shadow-xl: 0 20px 25px rgba(19, 59, 68, 0.15);
```

## 🌐 Aplicaciones de Marca

### Website / Landing
- Hero section con gradiente sutil (primary → secondary)
- Testimonios de profesionales
- Demo interactivo
- Pricing transparente

### Aplicación
- Login con branding consistente Glian
- Dashboard personalizado por rol
- Notificaciones contextuales
- Footer mínimo con logo Glian

### Comunicaciones
- Email templates profesionales
- Reportes con marca de agua sutil
- Certificados de capacitación branded

## 📊 Métricas de Marca

### KPIs de Percepción
- Profesionalismo: 9/10
- Confiabilidad: 9/10
- Innovación: 8/10
- Facilidad de uso: 9/10

### Diferenciadores
1. **Especialización**: Solo salud mental
2. **Integración**: Todos los aspectos de la práctica
3. **Compliance**: Normativas latinoamericanas integradas
4. **Soporte**: Acompañamiento continuo

## 🚫 Lo que NO somos

- No somos un EHR genérico
- No somos solo software de citas
- No somos una plataforma de telemedicina
- No somos un marketplace de psicólogos

## ✅ Lo que SÍ somos

- **Somos** la suite completa para profesionales de salud mental
- **Somos** expertos en flujos clínicos psicológicos/psiquiátricos
- **Somos** aliados en el crecimiento de tu práctica
- **Somos** tecnología con propósito humano

## 🎨 Arquitectura Visual

### Gradientes Permitidos
```css
/* Gradiente principal (Hero sections) */
--gradient-primary: linear-gradient(135deg, #0991b2 0%, #a0d8c7 100%);

/* Gradiente oscuro (Headers, footers) */
--gradient-dark: linear-gradient(135deg, #133b44 0%, #0991b2 100%);

/* Gradiente sutil (Backgrounds) */
--gradient-subtle: linear-gradient(180deg, #efefec 0%, #a0d8c7 100%);
```

### Border Radius Sistema
```css
--radius-sm: 4px;   /* Tags, badges */
--radius-md: 8px;   /* Buttons, inputs */
--radius-lg: 12px;  /* Cards */
--radius-xl: 16px;  /* Modals, containers grandes */
```

### Espaciado Sistema (8px base)
```css
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
--spacing-2xl: 48px;
--spacing-3xl: 64px;
```

---

_Guía de marca Glian v2.0 - Actualizada: 2025-12-02_
_Paleta de colores corregida - Sistema unificado sin variaciones por módulo_
