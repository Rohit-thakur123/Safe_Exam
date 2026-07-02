// Question display component
import React from 'react';
import type { Question } from '../../types/exam.types';
import { Award, TrendingUp } from 'lucide-react';

interface QuestionDisplayProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
}

export const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  question,
  questionNumber,
  totalQuestions,
}) => {
  const difficultyColors = {
    easy: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    hard: 'bg-red-100 text-red-700',
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Question header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-medium text-gray-500">
              Question {questionNumber} of {totalQuestions}
            </span>
            
            {/* Difficulty badge */}
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                difficultyColors[question.difficulty]
              }`}
            >
              {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
            </span>
            
            {/* Category badge */}
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
              {question.category}
            </span>
          </div>
        </div>
        
        {/* Marks */}
        <div className="flex items-center gap-1 text-blue-600 font-semibold">
          <Award size={18} />
          <span>{question.marks} marks</span>
        </div>
      </div>
      
      {/* Question text */}
      <div className="prose max-w-none">
        <p className="text-lg text-gray-900 leading-relaxed whitespace-pre-wrap">
          {question.question}
        </p>
      </div>
    </div>
  );
};