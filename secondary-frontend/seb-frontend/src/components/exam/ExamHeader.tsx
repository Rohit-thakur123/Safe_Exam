// Exam header with timer and auto-save indicator
import React from 'react';
import { Timer } from '../ui/Timer';
import { Save, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ExamHeaderProps {
  title: string;
  timeRemaining: string;
  studentName: string;
  saving: boolean;
  lastSaved: Date | null;
  isWarning?: boolean;
}

export const ExamHeader: React.FC<ExamHeaderProps> = ({
  title,
  timeRemaining,
  studentName,
  saving,
  lastSaved,
  isWarning = false,
}) => {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left: Exam title and student name */}
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-600">Student: {studentName}</p>
        </div>
        
        {/* Right: Timer and auto-save indicator */}
        <div className="flex items-center gap-6">
          {/* Auto-save indicator */}
          <div className="flex items-center gap-2">
            {saving ? (
              <>
                <Save size={18} className="text-blue-600 animate-pulse" />
                <span className="text-sm text-gray-600">Saving...</span>
              </>
            ) : lastSaved ? (
              <>
                <CheckCircle size={18} className="text-green-600" />
                <span className="text-sm text-gray-600">
                  Saved {formatDistanceToNow(lastSaved, { addSuffix: true })}
                </span>
              </>
            ) : null}
          </div>
          
          {/* Timer */}
          <Timer
            timeRemaining={0}
            formattedTime={timeRemaining}
            isWarning={isWarning}
          />
        </div>
      </div>
    </header>
  );
};