// Question navigation sidebar — theme-aware + React.memo for perf
import React from 'react';
import type { Question } from '../../types/exam.types';
import { CheckCircle } from 'lucide-react';

interface QuestionNavigationProps {
  questions: Question[];
  currentIndex: number;
  answeredQuestions: string[];
  onQuestionClick: (index: number) => void;
}

const QuestionNavigation: React.FC<QuestionNavigationProps> = React.memo(({
  questions,
  currentIndex,
  answeredQuestions,
  onQuestionClick,
}) => {
  const answeredSet = React.useMemo(() => new Set(answeredQuestions), [answeredQuestions]);
  const pct = questions.length > 0 ? Math.round((answeredQuestions.length / questions.length) * 100) : 0;

  return (
    <aside
      style={{
        width: 240, flexShrink: 0,
        borderRight: '1px solid var(--border)',
        overflowY: 'auto', background: 'var(--bg-card)',
      }}
      className="custom-scrollbar"
    >
      <div style={{ padding: '1rem' }}>
        <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '1rem' }}>
          Questions
        </h2>

        {/* Progress bar */}
        <div style={{
          background: 'var(--bg-secondary)', border: '1px solid var(--border)',
          borderRadius: '0.625rem', padding: '0.625rem 0.875rem', marginBottom: '1rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.75rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Answered</span>
            <span style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>
              {answeredQuestions.length} / {questions.length}
            </span>
          </div>
          <div style={{ height: 6, borderRadius: 9999, background: 'var(--border)', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%', borderRadius: 9999,
                width: `${pct}%`,
                background: 'var(--accent-emerald)',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>

        {/* Question grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6 }}>
          {questions.map((question, index) => {
            const isCurrent = currentIndex === index;
            const isAnswered = answeredSet.has(question.id);
            return (
              <button
                key={question.id}
                onClick={() => onQuestionClick(index)}
                aria-label={`Question ${index + 1}${isAnswered ? ', answered' : ''}${isCurrent ? ', current' : ''}`}
                style={{
                  position: 'relative',
                  padding: '0.375rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  border: isCurrent
                    ? '2px solid var(--accent-purple)'
                    : isAnswered
                    ? '1px solid color-mix(in srgb, var(--accent-emerald) 30%, transparent)'
                    : '1px solid var(--border)',
                  background: isCurrent
                    ? 'var(--accent-purple)'
                    : isAnswered
                    ? 'color-mix(in srgb, var(--accent-emerald) 12%, transparent)'
                    : 'var(--bg-secondary)',
                  color: isCurrent
                    ? '#fff'
                    : isAnswered
                    ? 'var(--tint-emerald-text)'
                    : 'var(--text-secondary)',
                }}
              >
                {index + 1}
                {isAnswered && !isCurrent && (
                  <CheckCircle
                    size={10}
                    style={{
                      position: 'absolute', top: -4, right: -4,
                      color: 'var(--accent-emerald)',
                      background: 'var(--bg-card)',
                      borderRadius: '50%',
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { color: 'var(--accent-purple)', label: 'Current' },
            { color: 'color-mix(in srgb, var(--accent-emerald) 12%, transparent)', label: 'Answered', border: 'color-mix(in srgb, var(--accent-emerald) 30%, transparent)' },
            { color: 'var(--bg-secondary)', label: 'Not Answered', border: 'var(--border)' },
          ].map(({ color, label, border }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 16, height: 16, borderRadius: 4, background: color, border: `1px solid ${border || color}`, flexShrink: 0 }} />
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
});

QuestionNavigation.displayName = 'QuestionNavigation';
export { QuestionNavigation };
export default QuestionNavigation;