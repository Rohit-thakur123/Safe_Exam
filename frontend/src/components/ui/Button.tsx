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
      'transition-all duration-200',
      'focus-visible:outline-none focus-visible:ring-2',
      'focus-visible:ring-offset-2 focus-visible:ring-[var(--accent-purple)]',
      'disabled:pointer-events-none disabled:opacity-50',
    ].join(' ');

    // All variants use CSS variables — fully theme-aware
    const variantClasses: Record<string, string> = {
      // Primary — purple/indigo gradient (matches design system)
      default: 'text-white rounded-xl',
      primary: 'text-white rounded-xl',
      // Danger / destructive
      destructive: 'text-white rounded-xl',
      danger: 'rounded-xl',
      // Outline — theme-aware border
      outline: 'rounded-xl',
      // Secondary — subtle surface
      secondary: 'rounded-xl',
      // Ghost — transparent
      ghost: 'premium-btn-ghost rounded-xl',
      // Link
      link: 'underline-offset-4 hover:underline p-0 h-auto',
      // Success
      success: 'text-white rounded-xl',
    };

    const variantStyles: Record<string, React.CSSProperties> = {
      default: {
        background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-indigo))',
        boxShadow: '0 2px 16px color-mix(in srgb, var(--accent-purple) 25%, transparent)',
      },
      primary: {
        background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-indigo))',
        boxShadow: '0 2px 16px color-mix(in srgb, var(--accent-purple) 25%, transparent)',
      },
      destructive: {
        background: 'var(--accent-rose)',
      },
      danger: {
        background: 'color-mix(in srgb, var(--accent-rose) 10%, transparent)',
        color: 'var(--tint-rose-text)',
        border: '1px solid color-mix(in srgb, var(--accent-rose) 20%, transparent)',
      },
      outline: {
        background: 'transparent',
        border: '1px solid var(--border-hover)',
        color: 'var(--text-primary)',
      },
      secondary: {
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        color: 'var(--text-secondary)',
      },
      ghost: {},
      link: { color: 'var(--tint-purple-text)' },
      success: { background: 'var(--accent-emerald)' },
    };

    const sizeClasses: Record<string, string> = {
      default: 'h-10 px-4 py-2 text-sm gap-2',
      sm: 'h-8 px-3 text-xs gap-1.5',
      lg: 'h-12 px-6 text-sm gap-2.5',
      icon: 'h-10 w-10',
    };

    const combinedStyle: React.CSSProperties = {
      ...variantStyles[variant],
      ...style,
    };

    return (
      <button
        className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
        ref={ref}
        style={combinedStyle}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button };
