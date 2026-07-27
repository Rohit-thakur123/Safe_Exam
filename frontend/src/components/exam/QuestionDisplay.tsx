// Question display component — theme-aware + React.memo
import React from 'react';
import type { Question } from '../../types/exam.types';
import { Award } from 'lucide-react';

interface QuestionDisplayProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
}

const difficultyStyle = (d: string): React.CSSProperties => {
  if (d === 'easy') return { background: 'color-mix(in srgb, var(--accent-emerald) 12%, transparent)', color: 'var(--tint-emerald-text)', border: '1px solid color-mix(in srgb, var(--accent-emerald) 25%, transparent)' };
  if (d === 'hard') return { background: 'color-mix(in srgb, var(--accent-rose) 12%, transparent)', color: 'var(--tint-rose-text)', border: '1px solid color-mix(in srgb, var(--accent-rose) 25%, transparent)' };
  return { background: 'color-mix(in srgb, var(--accent-amber) 12%, transparent)', color: 'var(--tint-amber-text)', border: '1px solid color-mix(in srgb, var(--accent-amber) 25%, transparent)' };
};

const QuestionDisplay: React.FC<QuestionDisplayProps> = React.memo(({ question, questionNumber, totalQuestions }) => (
  <div className="card-surface rounded-xl" style={{ padding: '1.5rem' }}>
    {/* Header */}
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          Question {questionNumber} of {totalQuestions}
        </span>
        {/* Difficulty badge */}
        <span style={{ ...difficultyStyle(question.difficulty), padding: '2px 10px', borderRadius: 9999, fontSize: '0.6875rem', fontWeight: 700 }}>
          {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
        </span>
        {/* Category badge */}
        {question.category && (
          <span style={{
            background: 'color-mix(in srgb, var(--accent-indigo) 12%, transparent)',
            color: 'var(--tint-indigo-text)',
            border: '1px solid color-mix(in srgb, var(--accent-indigo) 25%, transparent)',
            padding: '2px 10px', borderRadius: 9999, fontSize: '0.6875rem', fontWeight: 700,
          }}>
            {question.category}
          </span>
        )}
      </div>
      {/* Marks */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent-indigo)', fontWeight: 700, fontSize: '0.875rem', flexShrink: 0 }}>
        <Award size={16} />
        <span>{question.marks} marks</span>
      </div>
    </div>
    {/* Question text */}
    <p style={{ fontSize: '1rem', color: 'var(--text-primary)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
      {question.question}
    </p>
  </div>
));

QuestionDisplay.displayName = 'QuestionDisplay';
export { QuestionDisplay };
export default QuestionDisplay;