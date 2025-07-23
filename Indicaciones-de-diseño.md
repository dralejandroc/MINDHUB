# MindHub - Especificaciones React/TypeScript + Tailwind CSS

## 1. Configuración de Variables CSS y Tailwind

### globals.css (Variables CSS Base)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  /* Azul Teal Vibrante - Color principal */
  --primary-50: #f0fdfa;
  --primary-100: #ccfbf1;
  --primary-200: #99f6e4;
  --primary-300: #5eead4;
  --primary-400: #2dd4bf;
  --primary-500: #0891b2;
  --primary-600: #0e7490;
  --primary-700: #155e75;
  --primary-800: #164e63;
  --primary-900: #134e4a;

  /* Verde Turquesa - Color secundario */
  --secondary-50: #f0fdfa;
  --secondary-100: #ccfbf1;
  --secondary-200: #99f6e4;
  --secondary-300: #5eead4;
  --secondary-400: #2dd4bf;
  --secondary-500: #29a98c;
  --secondary-600: #0d9488;
  --secondary-700: #0f766e;
  --secondary-800: #115e59;
  --secondary-900: #134e4a;

  /* Coral Vibrante - Color de acento */
  --accent-50: #fef2f2;
  --accent-100: #fee2e2;
  --accent-200: #fecaca;
  --accent-300: #fca5a5;
  --accent-400: #f87171;
  --accent-500: #ec7367;
  --accent-600: #dc2626;
  --accent-700: #b91c1c;
  --accent-800: #991b1b;
  --accent-900: #7f1d1d;

  /* Verde Oscuro para contraste */
  --dark-green: #112f33;
  --dark-green-light: #1a4a50;

  /* Beige Cálido */
  --warm-50: #fff8ee;
  --warm-100: #fef7ee;
  --warm-200: #fed7aa;
  --warm-300: #fdba74;

  /* Colores de Hub - Elementos complementarios */
  /* Morado Vibrante - Para Hub Clinimetrix */
  --purple-50: #faf5ff;
  --purple-100: #f3e8ff;
  --purple-200: #e9d5ff;
  --purple-300: #d8b4fe;
  --purple-400: #c084fc;
  --purple-500: #a855f7;
  --purple-600: #9333ea;
  --purple-700: #7c3aed;
  --purple-800: #6b21a8;
  --purple-900: #581c87;

  /* Verde Esmeralda - Para Hub Resources */
  --emerald-50: #ecfdf5;
  --emerald-100: #d1fae5;
  --emerald-200: #a7f3d0;
  --emerald-300: #6ee7b7;
  --emerald-400: #34d399;
  --emerald-500: #10b981;
  --emerald-600: #059669;
  --emerald-700: #047857;
  --emerald-800: #065f46;
  --emerald-900: #064e3b;

  /* Naranja Vibrante - Para Hub Agenda */
  --orange-50: #fff7ed;
  --orange-100: #ffedd5;
  --orange-200: #fed7aa;
  --orange-300: #fdba74;
  --orange-400: #fb923c;
  --orange-500: #f97316;
  --orange-600: #ea580c;
  --orange-700: #c2410c;
  --orange-800: #9a3412;
  --orange-900: #7c2d12;

  /* Sombras coloridas */
  --shadow-primary: 0 10px 25px -5px rgba(8, 145, 178, 0.2);
  --shadow-secondary: 0 10px 25px -5px rgba(41, 169, 140, 0.2);
  --shadow-accent: 0 10px 25px -5px rgba(236, 115, 103, 0.2);
  --shadow-primary-hover: 0 15px 30px -5px rgba(8, 145, 178, 0.3);
  --shadow-secondary-hover: 0 15px 30px -5px rgba(41, 169, 140, 0.3);
  --shadow-accent-hover: 0 15px 30px -5px rgba(236, 115, 103, 0.3);

  /* Sombras coloridas para Hubs */
  --shadow-purple: 0 10px 25px -5px rgba(168, 85, 247, 0.2);
  --shadow-emerald: 0 10px 25px -5px rgba(16, 185, 129, 0.2);
  --shadow-orange: 0 10px 25px -5px rgba(249, 115, 22, 0.2);
  --shadow-purple-hover: 0 15px 30px -5px rgba(168, 85, 247, 0.3);
  --shadow-emerald-hover: 0 15px 30px -5px rgba(16, 185, 129, 0.3);
  --shadow-orange-hover: 0 15px 30px -5px rgba(249, 115, 22, 0.3);
}

/* Clases de utilidad personalizadas */
@layer utilities {
  .gradient-primary {
    background: linear-gradient(135deg, var(--primary-600), var(--primary-700));
  }

  .gradient-secondary {
    background: linear-gradient(
      135deg,
      var(--secondary-500),
      var(--secondary-600)
    );
  }

  .gradient-accent {
    background: linear-gradient(135deg, var(--accent-500), var(--accent-600));
  }

  .gradient-background {
    background: linear-gradient(135deg, var(--warm-50), var(--primary-50));
  }

  .border-gradient {
    background: linear-gradient(
      90deg,
      var(--primary-500),
      var(--secondary-500),
      var(--accent-500)
    );
  }

  /* Gradientes para Hubs */
  .gradient-purple {
    background: linear-gradient(135deg, var(--purple-500), var(--purple-600));
  }

  .gradient-emerald {
    background: linear-gradient(135deg, var(--emerald-500), var(--emerald-600));
  }

  .gradient-orange {
    background: linear-gradient(135deg, var(--orange-500), var(--orange-600));
  }

  /* Border gradients para Hubs */
  .border-gradient-purple {
    background: linear-gradient(90deg, var(--purple-500), var(--primary-500));
  }

  .border-gradient-emerald {
    background: linear-gradient(
      90deg,
      var(--emerald-500),
      var(--secondary-500)
    );
  }

  .border-gradient-orange {
    background: linear-gradient(90deg, var(--orange-500), var(--accent-500));
  }

  .shadow-primary {
    box-shadow: var(--shadow-primary);
  }

  .shadow-secondary {
    box-shadow: var(--shadow-secondary);
  }

  .shadow-accent {
    box-shadow: var(--shadow-accent);
  }

  /* Sombras para Hubs */
  .shadow-purple {
    box-shadow: var(--shadow-purple);
  }

  .shadow-emerald {
    box-shadow: var(--shadow-emerald);
  }

  .shadow-orange {
    box-shadow: var(--shadow-orange);
  }

  .hover-lift {
    transition:
      transform 0.3s ease,
      box-shadow 0.3s ease;
  }

  .hover-lift:hover {
    transform: translateY(-2px);
  }
}

/* Animaciones */
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse-custom {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}

.animate-fade-in {
  animation: fadeIn 0.6s ease-out;
}

.animate-pulse-custom {
  animation: pulse-custom 2s ease-in-out infinite;
}
```

### tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "var(--primary-50)",
          100: "var(--primary-100)",
          200: "var(--primary-200)",
          300: "var(--primary-300)",
          400: "var(--primary-400)",
          500: "var(--primary-500)",
          600: "var(--primary-600)",
          700: "var(--primary-700)",
          800: "var(--primary-800)",
          900: "var(--primary-900)",
        },
        secondary: {
          50: "var(--secondary-50)",
          100: "var(--secondary-100)",
          200: "var(--secondary-200)",
          300: "var(--secondary-300)",
          400: "var(--secondary-400)",
          500: "var(--secondary-500)",
          600: "var(--secondary-600)",
          700: "var(--secondary-700)",
          800: "var(--secondary-800)",
          900: "var(--secondary-900)",
        },
        accent: {
          50: "var(--accent-50)",
          100: "var(--accent-100)",
          200: "var(--accent-200)",
          300: "var(--accent-300)",
          400: "var(--accent-400)",
          500: "var(--accent-500)",
          600: "var(--accent-600)",
          700: "var(--accent-700)",
          800: "var(--accent-800)",
          900: "var(--accent-900)",
        },
        "dark-green": "var(--dark-green)",
        "dark-green-light": "var(--dark-green-light)",
        warm: {
          50: "var(--warm-50)",
          100: "var(--warm-100)",
          200: "var(--warm-200)",
          300: "var(--warm-300)",
        },
        // Colores para Hubs
        purple: {
          50: "var(--purple-50)",
          100: "var(--purple-100)",
          200: "var(--purple-200)",
          300: "var(--purple-300)",
          400: "var(--purple-400)",
          500: "var(--purple-500)",
          600: "var(--purple-600)",
          700: "var(--purple-700)",
          800: "var(--purple-800)",
          900: "var(--purple-900)",
        },
        emerald: {
          50: "var(--emerald-50)",
          100: "var(--emerald-100)",
          200: "var(--emerald-200)",
          300: "var(--emerald-300)",
          400: "var(--emerald-400)",
          500: "var(--emerald-500)",
          600: "var(--emerald-600)",
          700: "var(--emerald-700)",
          800: "var(--emerald-800)",
          900: "var(--emerald-900)",
        },
        orange: {
          50: "var(--orange-50)",
          100: "var(--orange-100)",
          200: "var(--orange-200)",
          300: "var(--orange-300)",
          400: "var(--orange-400)",
          500: "var(--orange-500)",
          600: "var(--orange-600)",
          700: "var(--orange-700)",
          800: "var(--orange-800)",
          900: "var(--orange-900)",
        },
      },
      fontFamily: {
        primary: ["Inter", "sans-serif"],
        heading: ["Poppins", "Inter", "sans-serif"],
      },
      spacing: {
        18: "4.5rem",
        88: "22rem",
        // Espaciado compacto por defecto
        1.5: "0.375rem",
        2.5: "0.625rem",
        3.5: "0.875rem",
      },
      boxShadow: {
        primary: "var(--shadow-primary)",
        secondary: "var(--shadow-secondary)",
        accent: "var(--shadow-accent)",
        "primary-hover": "var(--shadow-primary-hover)",
        "secondary-hover": "var(--shadow-secondary-hover)",
        "accent-hover": "var(--shadow-accent-hover)",
        // Sombras para Hubs
        purple: "var(--shadow-purple)",
        emerald: "var(--shadow-emerald)",
        orange: "var(--shadow-orange)",
        "purple-hover": "var(--shadow-purple-hover)",
        "emerald-hover": "var(--shadow-emerald-hover)",
        "orange-hover": "var(--shadow-orange-hover)",
      },
    },
  },
  plugins: [],
};
```

## 2. Componentes React/TypeScript Base

### Button Component

```typescript
// components/ui/Button.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'purple' | 'emerald' | 'orange';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  loading = false,
  className,
  disabled,
  ...props
}) => {
  const baseClasses = `
    relative inline-flex items-center justify-center font-semibold
    transition-all duration-300 ease-in-out rounded-xl
    focus:outline-none focus:ring-4 focus:ring-primary-200
    overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed
    hover-lift
  `;

  const variants = {
    primary: `
      gradient-primary text-white shadow-primary
      hover:shadow-primary-hover
      before:absolute before:inset-0 before:bg-gradient-to-r
      before:from-transparent before:via-white/20 before:to-transparent
      before:translate-x-[-100%] before:transition-transform before:duration-500
      hover:before:translate-x-[100%]
    `,
    secondary: `
      gradient-secondary text-white shadow-secondary
      hover:shadow-secondary-hover
      before:absolute before:inset-0 before:bg-gradient-to-r
      before:from-transparent before:via-white/20 before:to-transparent
      before:translate-x-[-100%] before:transition-transform before:duration-500
      hover:before:translate-x-[100%]
    `,
    accent: `
      gradient-accent text-white shadow-accent
      hover:shadow-accent-hover
      before:absolute before:inset-0 before:bg-gradient-to-r
      before:from-transparent before:via-white/20 before:to-transparent
      before:translate-x-[-100%] before:transition-transform before:duration-500
      hover:before:translate-x-[100%]
    `,
    outline: `
      bg-white text-primary-600 border-2 border-primary-600
      hover:bg-primary-50 hover:shadow-md
    `,
    // Variantes para Hubs
    purple: `
      gradient-purple text-white shadow-purple
      hover:shadow-purple-hover
      before:absolute before:inset-0 before:bg-gradient-to-r
      before:from-transparent before:via-white/20 before:to-transparent
      before:translate-x-[-100%] before:transition-transform before:duration-500
      hover:before:translate-x-[100%]
    `,
    emerald: `
      gradient-emerald text-white shadow-emerald
      hover:shadow-emerald-hover
      before:absolute before:inset-0 before:bg-gradient-to-r
      before:from-transparent before:via-white/20 before:to-transparent
      before:translate-x-[-100%] before:transition-transform before:duration-500
      hover:before:translate-x-[100%]
    `,
    orange: `
      gradient-orange text-white shadow-orange
      hover:shadow-orange-hover
      before:absolute before:inset-0 before:bg-gradient-to-r
      before:from-transparent before:via-white/20 before:to-transparent
      before:translate-x-[-100%] before:transition-transform before:duration-500
      hover:before:translate-x-[100%]
    `,
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-2.5 text-base',
  };

  return (
    <button
      className={cn(
        baseClasses,
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      <span className="relative z-10 flex items-center gap-2">
        {loading && (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        )}
        {children}
      </span>
    </button>
  );
};
```

### Card Component

```typescript
// components/ui/Card.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverable = true,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        `
        bg-white rounded-2xl shadow-lg border border-primary-100
        overflow-hidden transition-all duration-300 ease-in-out
        relative
        before:absolute before:top-0 before:left-0 before:right-0 before:h-1
        before:border-gradient
        `,
        hoverable && 'hover-lift hover:shadow-xl hover:shadow-primary-200/50',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => (
  <div
    className={cn(
      'px-4 py-3 gradient-background border-b border-primary-100 font-medium text-dark-green text-sm',
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export const CardBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => (
  <div className={cn('px-4 py-3', className)} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => (
  <div
    className={cn(
      'px-4 py-3 gradient-background border-t border-primary-100',
      className
    )}
    {...props}
  >
    {children}
  </div>
);
```

### Input Component

```typescript
// components/ui/Input.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  success,
  className,
  ...props
}) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-medium text-dark-green">
          {label}
        </label>
      )}
      <input
        className={cn(
          `
          w-full px-3 py-2 border border-gray-300 rounded-lg
          text-sm transition-all duration-200 ease-in-out
          bg-white
          focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100
          hover:border-primary-300
          `,
          error && 'border-accent-500 focus:border-accent-500 focus:ring-accent-100',
          success && 'border-secondary-500 focus:border-secondary-500 focus:ring-secondary-100',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-xs text-accent-700 flex items-center gap-1">
          <span>⚠️</span> {error}
        </p>
      )}
      {success && (
        <p className="text-xs text-secondary-700 flex items-center gap-1">
          <span>✅</span> {success}
        </p>
      )}
    </div>
  );
};
```

### Alert Component

```typescript
// components/ui/Alert.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'warning' | 'error' | 'info';
  children: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  children,
  className,
  ...props
}) => {
  const variants = {
    success: `
      bg-secondary-50 border-l-4 border-secondary-500 text-secondary-800
      before:bg-secondary-500/5
    `,
    warning: `
      bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800
      before:bg-yellow-500/5
    `,
    error: `
      bg-accent-50 border-l-4 border-accent-500 text-accent-800
      before:bg-accent-500/5
    `,
    info: `
      bg-primary-50 border-l-4 border-primary-500 text-primary-800
      before:bg-primary-500/5
    `,
  };

  return (
    <div
      className={cn(
        `
        px-3 py-2 rounded-lg relative overflow-hidden text-sm
        before:absolute before:inset-0 before:opacity-5
        `,
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
```

## 3. Layout Components

### Header Component

```typescript
// components/layout/Header.tsx
import React from 'react';
import { Button } from '@/components/ui/Button';

export const Header: React.FC = () => {
  return (
    <header className="h-14 gradient-primary text-white relative overflow-hidden">
      {/* Patrón de fondo */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      />

      <div className="container mx-auto h-full flex items-center justify-between px-4 relative z-10">
        <div className="flex items-center space-x-6">
          <h1 className="text-lg font-heading font-bold">✨ MindHub</h1>

          <nav className="hidden md:flex space-x-4">
            {['Dashboard', 'Clinimetrix', 'Expedix', 'Agenda', 'Pacientes'].map((item) => (
              <a
                key={item}
                href="#"
                className="
                  px-3 py-1.5 rounded-md transition-all duration-200 text-sm
                  relative overflow-hidden group
                  before:absolute before:inset-0 before:bg-white/10 before:rounded-md
                  before:scale-x-0 before:transition-transform before:duration-200
                  hover:before:scale-x-100
                  text-white/90 hover:text-white
                "
              >
                <span className="relative z-10">{item}</span>
              </a>
            ))}
          </nav>
        </div>

        <Button variant="accent" size="sm">
          👤 Dr. García
        </Button>
      </div>
    </header>
  );
};
```

### Dashboard Stats Component

```typescript
// components/dashboard/StatsGrid.tsx
import React from 'react';
import { Card } from '@/components/ui/Card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  variant?: 'primary' | 'secondary' | 'accent';
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  variant = 'primary'
}) => {
  const variants = {
    primary: 'gradient-primary',
    secondary: 'gradient-secondary',
    accent: 'gradient-accent',
  };

  return (
    <Card className={`${variants[variant]} text-white relative overflow-hidden`}>
      {/* Efecto de pulso animado */}
      <div className="absolute inset-0 animate-pulse-custom opacity-10">
        <div className="w-full h-full bg-gradient-radial from-white/20 to-transparent" />
      </div>

      <div className="p-4 text-center relative z-10">
        <div className="text-2xl mb-2">{icon}</div>
        <div className="text-xl font-bold mb-1">{value}</div>
        <div className="text-white/90 font-medium text-xs">{title}</div>
      </div>
    </Card>
  );
};

export const StatsGrid: React.FC = () => {
  const stats = [
    { title: 'Pacientes Activos', value: 248, icon: '👥', variant: 'primary' as const },
    { title: 'Citas Hoy', value: 15, icon: '📅', variant: 'secondary' as const },
    { title: 'Evaluaciones Pendientes', value: 3, icon: '📊', variant: 'accent' as const },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};
```

## 10. Utilidades y Hooks

### cn Utility (Class Names)

```typescript
// lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Custom Hooks

```typescript
// hooks/useAnimation.ts
import { useEffect, useState } from "react";

export const useStaggeredAnimation = (delay: number = 100) => {
  const [animatedItems, setAnimatedItems] = useState<number[]>([]);

  const triggerAnimation = (itemCount: number) => {
    setAnimatedItems([]);
    for (let i = 0; i < itemCount; i++) {
      setTimeout(() => {
        setAnimatedItems((prev) => [...prev, i]);
      }, i * delay);
    }
  };

  return { animatedItems, triggerAnimation };
};

// hooks/useHover.ts
import { useState } from "react";

export const useHover = () => {
  const [isHovered, setIsHovered] = useState(false);

  const hoverProps = {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  };

  return { isHovered, hoverProps };
};
```

## 11. Implementación de Páginas

### Ejemplo de Página de Pacientes

```typescript
// pages/patients/index.tsx
import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Patient {
  id: string;
  name: string;
  age: number;
  diagnosis: string;
  lastVisit: string;
  status: 'active' | 'inactive' | 'follow-up';
}

export default function PatientsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const patients: Patient[] = [
    {
      id: '1',
      name: 'María González',
      age: 32,
      diagnosis: 'Depresión Mayor',
      lastVisit: '2025-07-18',
      status: 'active',
    },
    // ... más pacientes
  ];

  return (
    <div className="min-h-screen gradient-background">
      <Header />

      <main className="container mx-auto px-4 py-4">
        {/* Header de página */}
        <div className="mb-6 animate-fade-in">
          <h1 className="text-2xl font-heading font-bold text-dark-green mb-3">
            Gestión de Pacientes
          </h1>

          <div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center">
            <div className="flex gap-2">
              <Button variant="secondary" size="sm">
                👤 Nuevo Paciente
              </Button>
              <Button variant="primary" size="sm">
                📅 Nueva Consulta
              </Button>
              <Button variant="accent" size="sm">
                📊 Nueva Evaluación
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <Input
                placeholder="Buscar paciente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />

              <div className="flex bg-white border border-primary-200 rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 rounded-md transition-all text-xs ${
                    viewMode === 'grid'
                      ? 'gradient-primary text-white shadow-primary'
                      : 'text-primary-600 hover:bg-primary-50'
                  }`}
                >
                  🔳 Tarjetas
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 rounded-md transition-all text-xs ${
                    viewMode === 'list'
                      ? 'gradient-primary text-white shadow-primary'
                      : 'text-primary-600 hover:bg-primary-50'
                  }`}
                >
                  📋 Lista
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Grid de pacientes */}
        <div className={`grid gap-4 ${
          viewMode === 'grid'
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
            : 'grid-cols-1'
        }`}>
          {patients.map((patient, index) => (
            <Card key={patient.id} className="animate-fade-in">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center text-white font-bold text-xs">
                    {patient.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-dark-green">
                      {patient.name}
                    </h3>
                    <p className="text-gray-600 text-xs">
                      {patient.age} años • {patient.diagnosis}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardBody>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Última visita:</span>
                    <span className="font-medium">{patient.lastVisit}</span>
                  </div>

                  <div className="flex gap-1">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        patient.status === 'active'
                          ? 'bg-secondary-100 text-secondary-700'
                          : patient.status === 'follow-up'
                          ? 'bg-accent-100 text-accent-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {patient.status === 'active' ? 'Activo' :
                       patient.status === 'follow-up' ? 'Seguimiento' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              </CardBody>

              <CardFooter>
                <div className="flex gap-1 w-full">
                  <Button variant="primary" size="sm" className="flex-1 text-xs">
                    Ver Expediente
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs">
                    📞
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs">
                    💬
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
```

## 12. TypeScript Types

### types/index.ts

```typescript
// Tipos base para MindHub
export interface Patient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  age: number;
  birthDate: string;
  diagnosis: string;
  medications: string[];
  lastVisit: string;
  nextAppointment?: string;
  status: "active" | "inactive" | "follow-up";
  guardian?: {
    name: string;
    relationship: string;
    phone: string;
  };
  tags: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  date: string;
  time: string;
  type: "consultation" | "evaluation" | "follow-up";
  status: "scheduled" | "completed" | "cancelled" | "no-show";
  notes?: string;
  duration: number;
}

export interface Evaluation {
  id: string;
  patientId: string;
  scale: string;
  scores: Record<string, number>;
  totalScore: number;
  date: string;
  notes?: string;
  interpretation: string;
}

// Tipos de componentes
export interface ComponentVariant {
  variant?: "primary" | "secondary" | "accent" | "outline";
  size?: "sm" | "md" | "lg";
}

export interface BaseProps {
  className?: string;
  children?: React.ReactNode;
}
```

## 13. Estructura de Proyecto Recomendada

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Homepage
│   └── globals.css        # Variables CSS globales
├── components/
│   ├── ui/                # Componentes base reutilizables
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Alert.tsx
│   │   └── index.ts
│   ├── layout/            # Componentes de layout
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   └── modules/           # Componentes específicos por módulo
│       ├── patients/
│       ├── clinimetrix/
│       ├── scheduling/
│       └── prescriptions/
├── hooks/                 # Custom hooks
│   ├── useAnimation.ts
│   ├── useHover.ts
│   └── usePatients.ts
├── lib/                   # Utilidades y configuración
│   ├── utils.ts
│   ├── api.ts
│   └── validations.ts
├── types/                 # Definiciones TypeScript
│   └── index.ts
└── styles/               # Estilos adicionales
    └── components.css
```

## 14. Scripts de Desarrollo

### package.json

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next": "^13.4.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^1.14.0",
    "lucide-react": "^0.263.1",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0"
  },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  }
}
```

Esta especificación proporciona una base completa y escalable para desarrollar MindHub usando React/TypeScript + Tailwind CSS, manteniendo la identidad visual vibrante y profesional que establecimos, con componentes reutilizables, tipado fuerte y una arquitectura moderna.
