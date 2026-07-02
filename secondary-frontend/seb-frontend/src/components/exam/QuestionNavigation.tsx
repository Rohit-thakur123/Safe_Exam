// Question navigation sidebar
import React from 'react';
import type { Question } from '../../types/exam.types';
import { CheckCircle, Circle } from 'lucide-react';

interface QuestionNavigationProps {
  questions: Question[];
  currentIndex: number;
  answeredQuestions: string[];
  onQuestionClick: (index: number) => void;
}

export const QuestionNavigation: React.FC<QuestionNavigationProps> = ({
  questions,
  currentIndex,
  answeredQuestions,
  onQuestionClick,
}) => {
  const isAnswered = (questionId: string) => answeredQuestions.includes(questionId);
  
  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 overflow-y-auto custom-scrollbar">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Questions</h2>
        
        {/* Progress summary */}
        <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">
            <div className="flex justify-between mb-1">
              <span>Answered:</span>
              <span className="font-semibold text-green-600">
                {answeredQuestions.length} / {questions.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(answeredQuestions.length / questions.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
        
        {/* Question grid */}
        <div className="grid grid-cols-5 gap-2">
          {questions.map((question, index) => (
            <button
              key={question.id}
              onClick={() => onQuestionClick(index)}
              className={`
                relative p-2 rounded-lg text-sm font-medium transition-all
                ${
                  currentIndex === index
                    ? 'bg-blue-600 text-white ring-2 ring-blue-600 ring-offset-2'
                    : isAnswered(question.id)
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }
              `}
              aria-label={`Question ${index + 1}`}
            >
              {index + 1}
              {isAnswered(question.id) && currentIndex !== index && (
                <CheckCircle
                  size={12}
                  className="absolute -top-1 -right-1 text-green-600 bg-white rounded-full"
                />
              )}
            </button>
          ))}
        </div>
        
        {/* Legend */}
        <div className="mt-6 space-y-2 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded"></div>
            <span>Current</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-100 rounded"></div>
            <span>Answered</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white border border-gray-300 rounded"></div>
            <span>Not Answered</span>
          </div>
        </div>
      </div>
    </aside>
  );
};