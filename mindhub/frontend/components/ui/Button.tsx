import { forwardRef } from 'react';
import { clsx } from 'clsx';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'purple' | 'emerald' | 'orange' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
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
        bg-theme-card text-primary border-2 border-primary
        hover:bg-theme-tertiary hover:shadow-theme-md
      `,
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
      ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
      link: 'text-primary-600 hover:text-primary-700 underline-offset-4 hover:underline'
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-2.5 text-base'
    };

    return (
      <button
        className={clsx(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
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
  }
);
Button.displayName = 'Button';

export { Button };