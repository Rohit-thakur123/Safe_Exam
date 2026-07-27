// Timer display component — theme-aware via CSS variables
import React from 'react';
import { Clock } from 'lucide-react';

interface TimerProps {
  timeRemaining: number;   // seconds (used for logic)
  formattedTime: string;   // pre-formatted string to display
  isWarning?: boolean;     // turns red when low
}

export const Timer: React.FC<TimerProps> = ({ formattedTime, isWarning = false }) => {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.375rem 0.875rem',
        borderRadius: '9999px',
        border: `1px solid ${isWarning
          ? 'color-mix(in srgb, var(--accent-rose) 40%, transparent)'
          : 'var(--border-hover)'}`,
        background: isWarning
          ? 'color-mix(in srgb, var(--accent-rose) 10%, transparent)'
          : 'var(--bg-card)',
        color: isWarning ? 'var(--tint-rose-text)' : 'var(--text-primary)',
        fontSize: '0.875rem',
        fontWeight: 600,
        fontVariantNumeric: 'tabular-nums',
        transition: 'background 0.2s, border-color 0.2s, color 0.2s',
      }}
    >
      <Clock
        size={15}
        style={{ color: isWarning ? 'var(--tint-rose-text)' : 'var(--text-muted)' }}
      />
      {formattedTime}
    </div>
  );
};

export default Timer;
