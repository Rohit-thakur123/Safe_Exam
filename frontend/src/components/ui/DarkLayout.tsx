import React from 'react';

// Animated mesh background orbs
export const MeshBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Orb 1 - purple */}
      <div
        className="absolute rounded-full blur-3xl animate-pulse"
        style={{
          width: '600px', height: '600px',
          background: 'radial-gradient(circle, var(--accent-purple) 0%, transparent 70%)',
          top: '-200px', left: '-100px',
          opacity: 'var(--mesh-opacity-1)',
          animationDuration: '8s',
        }}
      />
      {/* Orb 2 - indigo */}
      <div
        className="absolute rounded-full blur-3xl"
        style={{
          width: '500px', height: '500px',
          background: 'radial-gradient(circle, var(--accent-indigo) 0%, transparent 70%)',
          bottom: '-100px', right: '-100px',
          opacity: 'var(--mesh-opacity-2)',
          animation: 'pulse 10s ease-in-out infinite alternate',
        }}
      />
      {/* Orb 3 - cyan */}
      <div
        className="absolute rounded-full blur-3xl"
        style={{
          width: '400px', height: '400px',
          background: 'radial-gradient(circle, var(--accent-cyan) 0%, transparent 70%)',
          top: '40%', right: '20%',
          opacity: 'var(--mesh-opacity-3)',
          animation: 'pulse 12s ease-in-out infinite alternate-reverse',
        }}
      />
      {/* Grid overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(color-mix(in srgb, var(--accent-purple) 50%, transparent) 1px, transparent 1px),
            linear-gradient(90deg, color-mix(in srgb, var(--accent-purple) 50%, transparent) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          opacity: 'var(--mesh-grid-opacity)',
        }}
      />
    </div>
  );
};

interface TeacherLayoutProps {
  children: React.ReactNode;
}

export const TeacherLayout: React.FC<TeacherLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen relative bg-[var(--bg-primary)]">
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

// Glass card component
interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: 'purple' | 'indigo' | 'emerald' | 'cyan' | 'none';
  onClick?: () => void;
}

const glowVarMap: Record<string, string> = {
  purple: 'var(--accent-purple)',
  indigo: 'var(--accent-indigo)',
  emerald: 'var(--accent-emerald)',
  cyan: 'var(--accent-cyan)',
};

export const GlassCard: React.FC<GlassCardProps> = ({
  children, className = '', hover = false, glow = 'none', onClick
}) => {
  const glowStyle: React.CSSProperties =
    glow !== 'none'
      ? ({ ['--glow-shadow-color' as string]: glowVarMap[glow] })
      : {};

  return (
    <div
      className={`glass rounded-2xl transition-all duration-300 ${hover ? 'glass-hover cursor-pointer' : ''} ${glow !== 'none' ? 'glass-glow-hover' : ''} ${className}`}
      style={glowStyle}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

// Stat card for dashboard
interface StatCardDarkProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtext?: string;
  badge?: string;
  badgeColor?: string;
  trend?: string;
  accentColor: string;
  glowColor: string;
  onClick?: () => void;
}

export const StatCardDark: React.FC<StatCardDarkProps> = ({
  icon: Icon, label, value, subtext, badge, badgeColor, accentColor, glowColor, onClick
}) => (
  <div
    className="glass glass-hover rounded-2xl p-6 cursor-pointer transition-all duration-300 group relative overflow-hidden"
    style={{ borderColor: 'var(--border)' }}
    onClick={onClick}
  >
    {/* Glow on hover */}
    <div
      className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
      style={{ background: `radial-gradient(ellipse at 50% 0%, ${glowColor} 0%, transparent 70%)` }}
    />

    <div className="relative z-10">
      <div className="flex items-start justify-between mb-4">
        <div
          className="h-11 w-11 rounded-xl flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${accentColor}22, ${accentColor}11)`, border: `1px solid ${accentColor}33` }}
        >
          <Icon size={20} style={{ color: accentColor }} />
        </div>
        {badge && (
          <span
            className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
            style={{ background: `${badgeColor}22`, color: badgeColor, border: `1px solid ${badgeColor}33` }}
          >
            {badge}
          </span>
        )}
      </div>

      <div className="count-up">
        <p className="text-3xl font-black tabular-nums tracking-tight" style={{ color: 'var(--text-primary)' }}>{value}</p>
      </div>
      <p className="text-sm font-semibold mt-1" style={{ color: 'var(--text-secondary)' }}>{label}</p>
      {subtext && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{subtext}</p>}
    </div>
  </div>
);

// Skeleton loader dark
export const SkeletonDark: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`skeleton rounded-2xl ${className}`} />
);

// Section header
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ElementType;
  accentColor?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title, subtitle, action, icon: Icon, accentColor = 'var(--accent-purple)'
}) => (
  <div className="flex items-center justify-between mb-6">
    <div className="flex items-center gap-3">
      {Icon && (
        <div
          className="h-8 w-8 rounded-lg flex items-center justify-center"
          style={{ background: `color-mix(in srgb, ${accentColor} 13%, transparent)`, border: `1px solid color-mix(in srgb, ${accentColor} 20%, transparent)` }}
        >
          <Icon size={15} style={{ color: accentColor }} />
        </div>
      )}
      <div>
        <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
      </div>
    </div>
    {action && <div>{action}</div>}
  </div>
);

// Premium button
interface PremiumButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ElementType;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  to?: string;
}

export const PremiumButton: React.FC<PremiumButtonProps> = ({
  children, onClick, variant = 'primary', size = 'md', icon: Icon, className = '', disabled, type = 'button'
}) => {
  const sizeMap = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-sm gap-2.5',
  };

  const variantMap = {
    primary: 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/20',
    secondary: 'glass glass-hover',
    ghost: 'premium-btn-ghost',
    danger: 'premium-btn-danger',
  };

  const variantStyle: React.CSSProperties =
    variant === 'secondary'
      ? { color: 'var(--text-primary)' }
      : {};

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={variantStyle}
      className={`inline-flex items-center font-semibold rounded-xl transition-all duration-200 ${sizeMap[size]} ${variantMap[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {Icon && <Icon size={size === 'sm' ? 13 : 15} />}
      {children}
    </button>
  );
};

// Badge
interface BadgeProps {
  children: React.ReactNode;
  color?: 'purple' | 'emerald' | 'amber' | 'rose' | 'cyan' | 'indigo';
}
export const Badge: React.FC<BadgeProps> = ({ children, color = 'purple' }) => {
  const colorMap: Record<string, { bgVar: string; textVar: string; borderVar: string }> = {
    purple: { bgVar: 'var(--accent-purple)', textVar: 'var(--tint-purple-text)', borderVar: 'var(--accent-purple)' },
    emerald: { bgVar: 'var(--accent-emerald)', textVar: 'var(--tint-emerald-text)', borderVar: 'var(--accent-emerald)' },
    amber: { bgVar: 'var(--accent-amber)', textVar: 'var(--tint-amber-text)', borderVar: 'var(--accent-amber)' },
    rose: { bgVar: 'var(--accent-rose)', textVar: 'var(--tint-rose-text)', borderVar: 'var(--accent-rose)' },
    cyan: { bgVar: 'var(--accent-cyan)', textVar: 'var(--tint-cyan-text)', borderVar: 'var(--accent-cyan)' },
    indigo: { bgVar: 'var(--accent-indigo)', textVar: 'var(--tint-indigo-text)', borderVar: 'var(--accent-indigo)' },
  };
  const c = colorMap[color];
  return (
    <span
      className="inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
      style={{
        background: `color-mix(in srgb, ${c.bgVar} 12%, transparent)`,
        color: c.textVar,
        border: `1px solid color-mix(in srgb, ${c.borderVar} 25%, transparent)`,
      }}
    >
      {children}
    </span>
  );
};
