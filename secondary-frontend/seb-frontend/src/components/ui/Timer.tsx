// Timer display component
import React from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface TimerProps {
  timeRemaining: number;
  formattedTime: string;
  isWarning?: boolean;
  className?: string;
}

export const Timer: React.FC<TimerProps> = ({
  timeRemaining,
  formattedTime,
  isWarning = false,
  className = '',
}) => {
  const getTimerColor = () => {
    if (timeRemaining === 0) return 'text-red-600 bg-red-50 border-red-200';
    if (isWarning) return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    return 'text-blue-700 bg-blue-50 border-blue-200';
  };
  
  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-mono text-lg font-bold ${getTimerColor()} ${className}`}>
      {isWarning ? (
        <AlertTriangle size={20} className="animate-pulse" />
      ) : (
        <Clock size={20} />
      )}
      <span>{formattedTime}</span>
    </div>
  );
};