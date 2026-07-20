// Answer input component for different question types
import React from 'react';
import type { Question } from '../../types/exam.types';
import type { CodingQuestion } from "../../types/exam.types";
import CodeEditor from '../codeEditor';

interface AnswerInputProps {
  question: Question;
  currentAnswer: string;
  onAnswerChange: (answer: string) => void;
}

export const AnswerInput: React.FC<AnswerInputProps> = ({
  question,
  currentAnswer,
  onAnswerChange,
}) => {
  if (question.type === 'mcq' && question.options) {
    return (
      <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-sm font-medium text-gray-700 mb-4">Select your answer:</h3>
        <div className="space-y-3">
          {question.options.map((option: string, index: number) => {
            const optionLabel = String.fromCharCode(65 + index); // A, B, C, D...
            const isSelected = currentAnswer === option;

            return (
              <label
                key={index}
                className={`
                  flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                  ${isSelected
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option}
                  checked={isSelected}
                  onChange={(e) => onAnswerChange(e.target.value)}
                  className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <span className="font-medium text-gray-700 mr-2">
                    {optionLabel}.
                  </span>
                  <span className="text-gray-900">{option}</span>
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
      <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-sm font-medium text-gray-700 mb-4">Your answer:</h3>
        <textarea
          value={currentAnswer}
          onChange={(e) => onAnswerChange(e.target.value)}
          placeholder="Type your answer here..."
          rows={8}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
        />
        <div className="mt-2 text-sm text-gray-500">
          {currentAnswer.length} characters
        </div>
      </div>
    );
  }
  if (question.type === 'coding') {
    return (
      <div className="mt-6">
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
      <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-sm font-medium text-gray-700 mb-4">Upload your answer:</h3>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onAnswerChange(file.name);
              }
            }}
            className="hidden"
            id={`file-upload-${question.id}`}
          />
          <label
            htmlFor={`file-upload-${question.id}`}
            className="cursor-pointer"
          >
            <div className="text-gray-600">
              <p className="text-lg font-medium">Click to upload file</p>
              <p className="text-sm mt-1">or drag and drop</p>
            </div>
          </label>
          {currentAnswer && (
            <div className="mt-4 text-sm text-gray-700">
              Selected file: <span className="font-medium">{currentAnswer}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};