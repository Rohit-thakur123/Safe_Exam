// Answer input component — theme-aware + React.memo for perf
import React, { useCallback } from 'react';
import type { Question } from '../../types/exam.types';
import type { CodingQuestion } from '../../types/exam.types';
import CodeEditor from '../codeEditor';

interface AnswerInputProps {
  question: Question;
  currentAnswer: string;
  onAnswerChange: (answer: string) => void;
}

const AnswerInput: React.FC<AnswerInputProps> = React.memo(({ question, currentAnswer, onAnswerChange }) => {
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onAnswerChange(e.target.value);
  }, [onAnswerChange]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onAnswerChange(file.name);
  }, [onAnswerChange]);

  if (question.type === 'mcq' && question.options) {
    return (
      <div className="card-surface rounded-xl" style={{ padding: '1.5rem', marginTop: '1rem' }}>
        <h3 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Select your answer:
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {question.options.map((option: string, index: number) => {
            const optionLabel = String.fromCharCode(65 + index);
            const isSelected = currentAnswer === option;
            return (
              <label
                key={index}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '0.875rem 1rem', borderRadius: '0.625rem',
                  border: isSelected
                    ? '2px solid var(--accent-purple)'
                    : '1px solid var(--border)',
                  background: isSelected
                    ? 'color-mix(in srgb, var(--accent-purple) 8%, transparent)'
                    : 'var(--bg-secondary)',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option}
                  checked={isSelected}
                  onChange={() => onAnswerChange(option)}
                  style={{ marginTop: 2, accentColor: 'var(--accent-purple)', width: 16, height: 16 }}
                  aria-label={`Option ${optionLabel}: ${option}`}
                />
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 700, color: isSelected ? 'var(--accent-purple)' : 'var(--text-muted)', marginRight: 6, fontSize: '0.8125rem' }}>
                    {optionLabel}.
                  </span>
                  <span style={{ color: 'var(--text-primary)', fontSize: '0.9375rem' }}>{option}</span>
                </div>
              </label>
            );
          })}
        </div>
      </div>
    );
  }

  if (question.type === 'text') {
    return (
      <div className="card-surface rounded-xl" style={{ padding: '1.5rem', marginTop: '1rem' }}>
        <h3 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
          Your answer:
        </h3>
        <textarea
          value={currentAnswer}
          onChange={handleTextChange}
          placeholder="Type your answer here…"
          rows={8}
          className="textarea-theme"
          aria-label="Answer input"
        />
        <div style={{ marginTop: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {currentAnswer.length} characters
        </div>
      </div>
    );
  }

  if (question.type === 'coding') {
    return (
      <div style={{ marginTop: '1rem' }}>
        <CodeEditor
          question={question as CodingQuestion}
          answer={currentAnswer}
          onAnswerChange={onAnswerChange}
          attemptId="demo-attempt"
        />
      </div>
    );
  }

  if (question.type === 'file') {
    return (
      <div className="card-surface rounded-xl" style={{ padding: '1.5rem', marginTop: '1rem' }}>
        <h3 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
          Upload your answer:
        </h3>
        <div style={{
          border: '2px dashed var(--border-hover)',
          borderRadius: '0.75rem', padding: '2rem',
          textAlign: 'center', background: 'var(--bg-secondary)',
        }}>
          <input
            type="file"
            onChange={handleFileChange}
            className="hidden"
            id={`file-upload-${question.id}`}
          />
          <label htmlFor={`file-upload-${question.id}`} style={{ cursor: 'pointer' }}>
            <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Click to upload file
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 4 }}>
              or drag and drop
            </p>
          </label>
          {currentAnswer && (
            <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Selected: <strong>{currentAnswer}</strong>
            </p>
          )}
        </div>
      </div>
    );
  }

  return null;
});

AnswerInput.displayName = 'AnswerInput';
export { AnswerInput };
export default AnswerInput;