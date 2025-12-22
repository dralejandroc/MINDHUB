/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './contexts/**/*.{js,ts,jsx,tsx,mdx}',
    './hubs/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
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
        // Glian Brand Colors - Dark (Secondary 2)
        dark: {
          50: "var(--dark-50)",
          100: "var(--dark-100)",
          200: "var(--dark-200)",
          300: "var(--dark-300)",
          400: "var(--dark-400)",
          500: "var(--dark-500)", // #133b44
          600: "var(--dark-600)",
          700: "var(--dark-700)",
          800: "var(--dark-800)",
          900: "var(--dark-900)",
        },
        // Glian Brand Colors - Light (Secondary 3)
        light: {
          50: "var(--light-50)",
          100: "var(--light-100)",
          200: "var(--light-200)",
          300: "var(--light-300)",
          400: "var(--light-400)", // #efefec
          500: "var(--light-500)",
          600: "var(--light-600)",
          700: "var(--light-700)",
          800: "var(--light-800)",
          900: "var(--light-900)",
        },
        // Sistema de colores de estado
        success: {
          50: "var(--success-50)",
          100: "var(--success-100)",
          200: "var(--success-200)",
          300: "var(--success-300)",
          400: "var(--success-400)",
          500: "var(--success-500)",
          600: "var(--success-600)",
          700: "var(--success-700)",
          800: "var(--success-800)",
          900: "var(--success-900)",
        },
        warning: {
          50: "var(--warning-50)",
          100: "var(--warning-100)",
          200: "var(--warning-200)",
          300: "var(--warning-300)",
          400: "var(--warning-400)",
          500: "var(--warning-500)",
          600: "var(--warning-600)",
          700: "var(--warning-700)",
          800: "var(--warning-800)",
          900: "var(--warning-900)",
        },
        error: {
          50: "var(--error-50)",
          100: "var(--error-100)",
          200: "var(--error-200)",
          300: "var(--error-300)",
          400: "var(--error-400)",
          500: "var(--error-500)",
          600: "var(--error-600)",
          700: "var(--error-700)",
          800: "var(--error-800)",
          900: "var(--error-900)",
        },
      },
      fontFamily: {
        primary: ["Hanken Grotesk", "sans-serif"],
        heading: ["Hanken Grotesk", "sans-serif"],
        sans: ['Hanken Grotesk', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },
      spacing: {
        18: "4.5rem",
        88: "22rem",
        // Espaciado compacto por defecto
        1.5: "0.375rem",
        2.5: "0.625rem",
        3.5: "0.875rem",
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        primary: "var(--shadow-primary)",
        secondary: "var(--shadow-secondary)",
        "primary-hover": "var(--shadow-primary-hover)",
        "secondary-hover": "var(--shadow-secondary-hover)",
        'soft': '0 2px 15px -3px rgba(19, 59, 68, 0.07), 0 10px 20px -2px rgba(19, 59, 68, 0.04)',
        'clinical': '0 4px 6px -1px rgba(19, 59, 68, 0.1), 0 2px 4px -1px rgba(19, 59, 68, 0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      // Accessibility and healthcare-specific utilities
      screens: {
        'tablet': '640px',
        'laptop': '1024px',
        'desktop': '1280px',
        'widescreen': '1536px',
        // Healthcare device breakpoints
        'medical-tablet': '768px',
        'clinical-desktop': '1440px',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class',
    }),
    require('@tailwindcss/typography'),
    // Custom plugin for healthcare accessibility
    function({ addUtilities, theme }) {
      const newUtilities = {
        '.focus-clinical': {
          '&:focus': {
            outline: '2px solid ' + theme('colors.primary.500'),
            outlineOffset: '2px',
            boxShadow: '0 0 0 3px ' + theme('colors.primary.200'),
          },
        },
        '.btn-clinical': {
          padding: theme('spacing.3') + ' ' + theme('spacing.6'),
          borderRadius: theme('borderRadius.lg'),
          fontWeight: theme('fontWeight.medium'),
          fontSize: theme('fontSize.sm'),
          transition: 'all 0.2s ease-in-out',
          '&:focus': {
            outline: '2px solid ' + theme('colors.primary.500'),
            outlineOffset: '2px',
          },
        },
        '.card-clinical': {
          backgroundColor: theme('colors.white'),
          borderRadius: theme('borderRadius.xl'),
          boxShadow: theme('boxShadow.clinical'),
          border: '1px solid ' + theme('colors.gray.200'),
          padding: theme('spacing.6'),
        },
        '.text-clinical': {
          color: theme('colors.clinical.700'),
          lineHeight: theme('lineHeight.relaxed'),
        },
      };
      
      addUtilities(newUtilities);
    },
  ],
  // Ensure accessibility and healthcare compliance
  corePlugins: {
    // Enable all core plugins for maximum flexibility
  },
};