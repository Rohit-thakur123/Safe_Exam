import React, { useState, useMemo } from 'react';
import { Button } from '../ui/Button';
import { ArrowLeft, BookOpen, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';
import type { SubjectiveQuestion } from '../../types/exam.types';

interface SubjectiveTestProps {
  questions: SubjectiveQuestion[];
  answers: Record<string, string>;
  onAnswerChange: (questionId: string, answer: string) => void;
  onFinish: () => void;
}

export const SubjectiveTest: React.FC<SubjectiveTestProps> = ({
  questions,
  answers,
  onAnswerChange,
  onFinish,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentQuestion = questions[currentIndex];

  const currentAnswer = useMemo(() => {
    if (!currentQuestion) return '';
    return answers[currentQuestion.id] || '';
  }, [currentQuestion, answers]);

  const wordCount = useMemo(() => {
    if (!currentAnswer.trim()) return 0;
    return currentAnswer.trim().split(/\s+/).filter(Boolean).length;
  }, [currentAnswer]);

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md">
          <BookOpen className="h-12 w-12 text-violet-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-900">No Subjective Questions</h2>
          <p className="text-sm text-gray-500 mt-1 mb-6">This section has no questions.</p>
          <Button onClick={onFinish}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  const minWords = currentQuestion?.minWords || 0;
  const wordLimit = currentQuestion?.wordLimit || 0;
  const isMinWordsValid = minWords === 0 || wordCount >= minWords;
  const isWordLimitExceeded = wordLimit > 0 && wordCount > wordLimit;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header Bar */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-xs sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={onFinish} className="flex items-center gap-1.5 text-xs">
            <ArrowLeft size={14} /> Back to Dashboard
          </Button>
          <div className="h-4 w-px bg-gray-200" />
          <h1 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <BookOpen size={16} className="text-violet-600" />
            Subjective Section
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-500 font-medium">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <Button size="sm" onClick={onFinish} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
            <CheckCircle2 size={14} className="mr-1" /> Finish Subjective Section
          </Button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-8 flex flex-col md:flex-row gap-6">
        {/* Sidebar Question Selector */}
        <div className="w-full md:w-64 flex-shrink-0 space-y-2">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">Questions List</h2>
          <div className="space-y-1.5 max-h-[70vh] overflow-y-auto pr-1">
            {questions.map((q, idx) => {
              const isSelected = idx === currentIndex;
              const hasAnswer = Boolean((answers[q.id] || '').trim());
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-violet-600 text-white border-violet-600 shadow-xs font-semibold'
                      : hasAnswer
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-violet-300'
                  }`}
                >
                  <span className="truncate pr-2">
                    {idx + 1}. {q.title}
                  </span>
                  {hasAnswer && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-white text-violet-700' : 'bg-emerald-200 text-emerald-900'}`}>
                      Answered
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Question & Editor Area */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-xs flex flex-col justify-between">
          <div className="space-y-6">
            {/* Question Heading */}
            <div className="border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-md">
                  Question {currentIndex + 1}
                </span>
                <span className="text-xs font-semibold text-gray-500">
                  {currentQuestion.maxMarks} Marks
                </span>
              </div>
              <h2 className="text-lg font-bold text-gray-900">{currentQuestion.title}</h2>
            </div>

            {/* Question Description */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                {currentQuestion.description}
              </p>
              {currentQuestion.instructions && (
                <div className="mt-3 pt-3 border-t border-gray-200/60">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Instructions</p>
                  <p className="text-xs text-gray-600 mt-0.5 italic">{currentQuestion.instructions}</p>
                </div>
              )}
            </div>

            {/* Response Area */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-gray-700">Your Answer</label>
                <div className="flex items-center gap-3 text-xs">
                  <span className={`font-semibold ${isWordLimitExceeded ? 'text-rose-600' : 'text-gray-500'}`}>
                    Word Count: {wordCount}
                    {wordLimit > 0 ? ` / ${wordLimit} max` : ''}
                  </span>
                  {minWords > 0 && (
                    <span className={`font-medium ${isMinWordsValid ? 'text-emerald-600' : 'text-amber-600'}`}>
                      (min {minWords} words)
                    </span>
                  )}
                </div>
              </div>

              <textarea
                rows={12}
                value={currentAnswer}
                onChange={e => onAnswerChange(currentQuestion.id, e.target.value)}
                placeholder="Type your answer here in detail..."
                className="w-full border border-gray-200 rounded-xl p-4 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition resize-none leading-relaxed"
              />

              {isWordLimitExceeded && (
                <p className="text-xs text-rose-600 font-semibold mt-1">
                  ⚠ Word limit exceeded. Please shorten your response.
                </p>
              )}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-100 mt-6">
            <Button
              variant="outline"
              size="sm"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex(prev => prev - 1)}
              className="flex items-center gap-1 text-xs"
            >
              <ChevronLeft size={14} /> Previous Question
            </Button>

            {currentIndex < questions.length - 1 ? (
              <Button
                size="sm"
                onClick={() => setCurrentIndex(prev => prev + 1)}
                className="flex items-center gap-1 text-xs bg-violet-600 hover:bg-violet-700 text-white"
              >
                Next Question <ChevronRight size={14} />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={onFinish}
                className="flex items-center gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CheckCircle2 size={14} /> Complete Section
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubjectiveTest;
