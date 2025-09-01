import { forwardRef } from 'react';
import { clsx } from 'clsx';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'card-theme rounded-2xl overflow-hidden transition-all duration-300 ease-in-out relative',
          'before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:border-gradient',
          hoverable && 'hover-lift hover:shadow-theme-xl',
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';

const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx(
        'px-4 py-3 bg-theme-surface border-b border-theme-primary font-medium text-theme-primary text-sm',
        className
      )}
      {...props}
    />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={clsx('text-lg font-semibold leading-none tracking-tight text-theme-primary', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={clsx('text-sm text-theme-secondary', className)}
      {...props}
    />
  )
);
CardDescription.displayName = 'CardDescription';

const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={clsx('px-4 py-3', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

const CardBody = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div className={clsx('px-4 py-3', className)} {...props} ref={ref} />
  )
);
CardBody.displayName = 'CardBody';

const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx(
        'px-4 py-3 bg-theme-surface border-t border-theme-primary',
        className
      )}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, CardBody };