// Timer display component used by ExamHeader
import React from 'react';
import { Clock } from 'lucide-react';

interface TimerProps {
  timeRemaining: number;       // seconds (used for logic)
  formattedTime: string;       // pre-formatted string to display
  isWarning?: boolean;         // turns red when low
}

export const Timer: React.FC<TimerProps> = ({
  formattedTime,
  isWarning = false,
}) => {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold tabular-nums ${
        isWarning
          ? 'text-red-600 border-red-300 bg-red-50'
          : 'text-gray-700 border-gray-300 bg-white'
      }`}
    >
      <Clock
        size={16}
        className={isWarning ? 'text-red-500' : 'text-gray-500'}
      />
      {formattedTime}
    </div>
  );
};

export default Timer;
