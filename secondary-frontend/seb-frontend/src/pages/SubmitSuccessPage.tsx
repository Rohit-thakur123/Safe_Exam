// Submit Success Page — premium enterprise design
// Handles: manual submit, auto-submit (time-up), tab-violation auto-submit, already-submitted re-entry
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, Award, Clock, TrendingUp, ShieldCheck, AlertTriangle } from 'lucide-react';

export const SubmitSuccessPage = () => {
  const [searchParams] = useSearchParams();

  const autoSubmit = searchParams.get('autoSubmit') === 'true';
  const score = searchParams.get('score');
  const percentage = searchParams.get('percentage');
  const reason = searchParams.get('reason');
  const alreadySubmitted = reason === 'already_submitted';
  const tabViolation = reason === 'tab_switch_violation';

  useEffect(() => {
    // Wipe ALL local exam data and session token.
    // Ensures no re-entry is possible via the browser back button.
    localStorage.removeItem('seb_session_token');
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('seb_exam_')) keysToRemove.push(key);
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  }, []);

  // ── Config per scenario ─────────────────────────────────────────────────────
  const config = alreadySubmitted
    ? {
        icon: <ShieldCheck size={32} className="text-white" />,
        iconBg: 'linear-gradient(135deg, #6366f1, #4f46e5)',
        glow: 'rgba(99,102,241,0.3)',
        heading: 'Already Submitted',
        subheading: 'Your responses are safely recorded',
        badge: null,
        badgeText: '',
        badgeStyle: {} as React.CSSProperties,
      }
    : autoSubmit && tabViolation
    ? {
        icon: <AlertTriangle size={32} className="text-white" />,
        iconBg: 'linear-gradient(135deg, #f59e0b, #d97706)',
        glow: 'rgba(245,158,11,0.3)',
        heading: 'Exam Auto-Submitted',
        subheading: 'Due to repeated security violations',
        badge: 'Violation',
        badgeText: 'Tab switch limit exceeded',
        badgeStyle: { background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#fcd34d' },
      }
    : autoSubmit
    ? {
        icon: <Clock size={32} className="text-white" />,
        iconBg: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
        glow: 'rgba(139,92,246,0.3)',
        heading: "Time's Up!",
        subheading: 'Your answers were automatically submitted',
        badge: 'Auto-submitted',
        badgeText: 'Exam time expired',
        badgeStyle: { background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#c4b5fd' },
      }
    : {
        icon: <CheckCircle size={32} className="text-white" />,
        iconBg: 'linear-gradient(135deg, #10b981, #059669)',
        glow: 'rgba(16,185,129,0.3)',
        heading: 'Submitted Successfully!',
        subheading: 'Your exam has been recorded and is being evaluated',
        badge: 'Complete',
        badgeText: 'All responses saved',
        badgeStyle: { background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7' },
      };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(145deg, #0f0f17 0%, #0d0d1a 50%, #0f0f17 100%)' }}
    >
      {/* Ambient glow */}
      <div
        className="fixed top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ background: config.glow }}
      />

      <div
        className="relative w-full max-w-lg animate-fade-slide-up"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '1.5rem',
          boxShadow: `0 32px 80px rgba(0,0,0,0.6), 0 0 60px ${config.glow}`,
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Top accent line */}
        <div
          className="absolute top-0 inset-x-0 h-px rounded-t-3xl"
          style={{ background: `linear-gradient(90deg, transparent, ${config.glow.replace('0.3', '0.8')}, transparent)` }}
        />

        <div className="p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div
              className="relative h-20 w-20 rounded-2xl flex items-center justify-center"
              style={{ background: config.iconBg, boxShadow: `0 0 40px ${config.glow}` }}
            >
              {config.icon}
              {/* Pulse ring */}
              <div
                className="absolute inset-0 rounded-2xl animate-ping opacity-20"
                style={{ background: config.iconBg, animationDuration: '2s' }}
              />
            </div>
          </div>

          {/* Badge */}
          {config.badge && (
            <div className="flex justify-center mb-4">
              <span className="text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-widest" style={config.badgeStyle}>
                {config.badgeText}
              </span>
            </div>
          )}

          {/* Heading */}
          <h1 className="text-2xl font-black text-center tracking-tight mb-2" style={{ color: '#f0f0f5' }}>
            {config.heading}
          </h1>
          <p className="text-sm text-center mb-6" style={{ color: 'rgba(240,240,245,0.55)' }}>
            {config.subheading}
          </p>

          {/* Already submitted info box */}
          {alreadySubmitted && (
            <div
              className="mb-6 flex items-start gap-3 rounded-xl px-4 py-3"
              style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)' }}
            >
              <ShieldCheck size={16} style={{ color: '#a5b4fc', flexShrink: 0, marginTop: 1 }} />
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(240,240,245,0.75)' }}>
                You have already submitted this exam. Your responses are safely recorded and cannot be changed.
                You can now close this browser window.
              </p>
            </div>
          )}

          {/* Score cards */}
          {score && percentage && (
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div
                className="rounded-xl p-4 text-center"
                style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}
              >
                <Award size={22} className="mx-auto mb-1.5" style={{ color: '#c4b5fd' }} />
                <p className="text-xs mb-1" style={{ color: 'rgba(240,240,245,0.5)' }}>Your Score</p>
                <p className="text-2xl font-black tabular-nums" style={{ color: '#c4b5fd' }}>{score}</p>
              </div>
              <div
                className="rounded-xl p-4 text-center"
                style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}
              >
                <TrendingUp size={22} className="mx-auto mb-1.5" style={{ color: '#6ee7b7' }} />
                <p className="text-xs mb-1" style={{ color: 'rgba(240,240,245,0.5)' }}>Percentage</p>
                <p className="text-2xl font-black tabular-nums" style={{ color: '#6ee7b7' }}>{percentage}%</p>
              </div>
            </div>
          )}

          {/* What happens next */}
          {!alreadySubmitted && (
            <div
              className="mb-6 rounded-xl p-4"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(240,240,245,0.4)' }}>
                What happens next
              </p>
              <ul className="space-y-2">
                {[
                  'Your answers are being evaluated by the system',
                  'You will receive an email with your detailed results',
                  'Check your student portal for the final score',
                  'You can now safely close the Safe Exam Browser',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs" style={{ color: 'rgba(240,240,245,0.65)' }}>
                    <div
                      className="h-4 w-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[9px] font-bold"
                      style={{ background: 'rgba(139,92,246,0.2)', color: '#c4b5fd' }}
                    >
                      {i + 1}
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Close button */}
          <button
            onClick={() => window.close()}
            className="w-full h-11 rounded-xl font-bold text-sm text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
            style={{
              background: config.iconBg,
              boxShadow: `0 4px 20px ${config.glow}`,
            }}
          >
            Close Browser Window
          </button>
          <p className="text-center text-xs mt-3" style={{ color: 'rgba(240,240,245,0.3)' }}>
            You can safely close this window now
          </p>
        </div>
      </div>
    </div>
  );
};