import React from 'react';
import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'success' | 'danger';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild = false, style, ...props }, ref) => {
    const baseClasses = [
      'inline-flex items-center justify-center font-semibold',
      'transition-all duration-200 select-none',
      'focus-visible:outline-none',
      'disabled:pointer-events-none disabled:opacity-50',
    ].join(' ');

    // Purple/violet palette — matches Teacher Portal and updated theme.css
    const variantClasses: Record<string, string> = {
      default:     'text-white rounded-xl',
      primary:     'text-white rounded-xl',
      destructive: 'text-white rounded-xl',
      danger:      'rounded-xl',
      outline:     'rounded-xl',
      secondary:   'rounded-xl',
      ghost:       'rounded-xl',
      link:        'underline-offset-4 hover:underline p-0 h-auto',
      success:     'text-white rounded-xl',
    };

    const variantStyles: Record<string, React.CSSProperties> = {
      default: {
        background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
        boxShadow: '0 2px 16px rgba(139,92,246,0.3)',
      },
      primary: {
        background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
        boxShadow: '0 2px 16px rgba(139,92,246,0.3)',
      },
      destructive: {
        background: '#ef4444',
      },
      danger: {
        background: 'rgba(239,68,68,0.1)',
        color: '#fca5a5',
        border: '1px solid rgba(239,68,68,0.25)',
      },
      outline: {
        background: 'transparent',
        border: '1px solid rgba(255,255,255,0.12)',
        color: '#f0f0f5',
      },
      secondary: {
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.08)',
        color: 'rgba(240,240,245,0.8)',
      },
      ghost: {
        background: 'transparent',
        color: 'rgba(240,240,245,0.6)',
      },
      link: {
        color: '#8b5cf6',
      },
      success: {
        background: '#10b981',
      },
    };

    const sizeClasses: Record<string, string> = {
      default: 'h-10 px-4 py-2 text-sm gap-2',
      sm:      'h-8 px-3 text-xs gap-1.5',
      lg:      'h-12 px-6 text-sm gap-2.5',
      icon:    'h-10 w-10',
    };

    return (
      <button
        className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
        ref={ref}
        style={{ ...variantStyles[variant], ...style }}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
export { Button };
