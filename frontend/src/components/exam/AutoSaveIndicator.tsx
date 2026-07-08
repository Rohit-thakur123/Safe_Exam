// Auto-save indicator component
import React from 'react';
import { Save, CheckCircle, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AutoSaveIndicatorProps {
  saving: boolean;
  lastSaved: Date | null;
  error: string | null;
}

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  saving,
  lastSaved,
  error,
}) => {
  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-600 text-sm">
        <XCircle size={16} />
        <span>Auto-save failed</span>
      </div>
    );
  }
  
  if (saving) {
    return (
      <div className="flex items-center gap-2 text-blue-600 text-sm">
        <Save size={16} className="animate-pulse" />
        <span>Saving...</span>
      </div>
    );
  }
  
  if (lastSaved) {
    return (
      <div className="flex items-center gap-2 text-green-600 text-sm">
        <CheckCircle size={16} />
        <span>Saved {formatDistanceToNow(lastSaved, { addSuffix: true })}</span>
      </div>
    );
  }
  
  return null;
};