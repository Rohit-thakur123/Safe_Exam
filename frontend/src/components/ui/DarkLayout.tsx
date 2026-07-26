import React from 'react';

// Animated mesh background orbs
export const MeshBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Orb 1 - purple */}
      <div
        className="absolute rounded-full blur-3xl opacity-20 animate-pulse"
        style={{
          width: '600px', height: '600px',
          background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)',
          top: '-200px', left: '-100px',
          animationDuration: '8s',
        }}
      />
      {/* Orb 2 - indigo */}
      <div
        className="absolute rounded-full blur-3xl opacity-15"
        style={{
          width: '500px', height: '500px',
          background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)',
          bottom: '-100px', right: '-100px',
          animation: 'pulse 10s ease-in-out infinite alternate',
        }}
      />
      {/* Orb 3 - cyan */}
      <div
        className="absolute rounded-full blur-3xl opacity-10"
        style={{
          width: '400px', height: '400px',
          background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)',
          top: '40%', right: '20%',
          animation: 'pulse 12s ease-in-out infinite alternate-reverse',
        }}
      />
      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(139,92,246,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139,92,246,0.5) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
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
    <div className="min-h-screen mesh-bg relative">
      <MeshBackground />
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

export const GlassCard: React.FC<GlassCardProps> = ({
  children, className = '', hover = false, glow = 'none', onClick
}) => {
  const glowMap = {
    purple: 'hover:shadow-[0_0_30px_rgba(139,92,246,0.15)]',
    indigo: 'hover:shadow-[0_0_30px_rgba(99,102,241,0.15)]',
    emerald: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]',
    cyan: 'hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]',
    none: '',
  };

  return (
    <div
      className={`glass rounded-2xl transition-all duration-300 ${hover ? 'glass-hover cursor-pointer' : ''} ${glowMap[glow]} ${className}`}
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
    style={{ borderColor: 'rgba(255,255,255,0.06)' }}
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
        <p className="text-3xl font-black tabular-nums tracking-tight text-white">{value}</p>
      </div>
      <p className="text-sm font-semibold mt-1" style={{ color: 'rgba(240,240,245,0.7)' }}>{label}</p>
      {subtext && <p className="text-xs mt-1" style={{ color: 'rgba(240,240,245,0.35)' }}>{subtext}</p>}
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
  title, subtitle, action, icon: Icon, accentColor = '#8b5cf6'
}) => (
  <div className="flex items-center justify-between mb-6">
    <div className="flex items-center gap-3">
      {Icon && (
        <div
          className="h-8 w-8 rounded-lg flex items-center justify-center"
          style={{ background: `${accentColor}22`, border: `1px solid ${accentColor}33` }}
        >
          <Icon size={15} style={{ color: accentColor }} />
        </div>
      )}
      <div>
        <h2 className="text-base font-bold text-white">{title}</h2>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: 'rgba(240,240,245,0.4)' }}>{subtitle}</p>}
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
    secondary: 'glass glass-hover text-white border-white/10',
    ghost: 'text-white/60 hover:text-white hover:bg-white/05',
    danger: 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
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
  const colorMap = {
    purple: { bg: 'rgba(139,92,246,0.12)', text: '#a78bfa', border: 'rgba(139,92,246,0.25)' },
    emerald: { bg: 'rgba(16,185,129,0.12)', text: '#34d399', border: 'rgba(16,185,129,0.25)' },
    amber: { bg: 'rgba(245,158,11,0.12)', text: '#fbbf24', border: 'rgba(245,158,11,0.25)' },
    rose: { bg: 'rgba(244,63,94,0.12)', text: '#fb7185', border: 'rgba(244,63,94,0.25)' },
    cyan: { bg: 'rgba(6,182,212,0.12)', text: '#22d3ee', border: 'rgba(6,182,212,0.25)' },
    indigo: { bg: 'rgba(99,102,241,0.12)', text: '#818cf8', border: 'rgba(99,102,241,0.25)' },
  };
  const c = colorMap[color];
  return (
    <span
      className="inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
    >
      {children}
    </span>
  );
};