// Exam header with timer and auto-save indicator
import React from 'react';
import { Timer } from '../ui/Timer';
import { Save, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import  { useEffect, useState } from "react";
import { ShieldCheck, Clock } from "lucide-react";

interface ExamHeaderProps {
  title: string;
  timeRemaining: string;
  studentName: string;
  saving: boolean;
  lastSaved: Date | null;
  isWarning?: boolean;
}
interface TopBarProps {
  companyName: string;
  examTitle: string;
  candidateName: string;
  /** Seconds remaining; the component ticks this down locally for display only */
  initialSecondsRemaining: number;
  onTimeExpired: () => void;
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

const formatTime = (totalSeconds: number): string => {
  const clamped = Math.max(0, totalSeconds);
  const hours = Math.floor(clamped / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  const seconds = Math.floor(clamped % 60);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return hours > 0
    ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;
};

const getInitials = (name: string): string =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
 
const TopBar: React.FC<TopBarProps> = ({
  companyName,
  examTitle,
  candidateName,
  initialSecondsRemaining,
  onTimeExpired,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(
    initialSecondsRemaining
  );
 
  useEffect(() => {
    setSecondsRemaining(initialSecondsRemaining);
  }, [initialSecondsRemaining]);
 
  useEffect(() => {
    if (secondsRemaining <= 0) {
      onTimeExpired();
      return;
    }
    const intervalId = window.setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          window.clearInterval(intervalId);
          onTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
 
    return () => window.clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
 
  const isCritical = secondsRemaining <= 300; // last 5 minutes
 
  return (
    <div className="flex items-center justify-between border-b border-white/10 px-8 py-4">
      <div className="flex items-center gap-2.5">
        <ShieldCheck size={18} className="text-violet-400" />
        <span className="text-sm font-medium text-slate-100">{companyName}</span>
        <span className="text-sm text-slate-500">{examTitle}</span>
      </div>
 
      <div className="flex items-center gap-4">
        <div
          className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 ${
            isCritical
              ? "border-rose-400/30 bg-rose-400/10"
              : "border-white/10 bg-white/[0.03]"
          }`}
        >
          <Clock
            size={14}
            className={isCritical ? "text-rose-300" : "text-amber-300"}
          />
          <span
            className={`text-[13px] font-medium tabular-nums ${
              isCritical ? "text-rose-300" : "text-slate-100"
            }`}
          >
            {formatTime(secondsRemaining)} remaining
          </span>
        </div>
 
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.06] text-[11px] font-medium text-slate-300">
            {getInitials(candidateName)}
          </div>
          <span className="text-[13px] text-slate-400">{candidateName}</span>
        </div>
      </div>
    </div>
  );
};
 
export default TopBar;
