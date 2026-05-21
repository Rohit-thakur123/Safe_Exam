import React, { useState, useEffect } from 'react';
import { sessionAPI } from '../services/api';
import { Clock, MapPin } from 'lucide-react';

interface SessionInfo {
  loginTime: string;
  lastActivity: string;
  ipAddress: string;
  role: string;
}

export const SessionStatus: React.FC = () => {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessionStatus();
  }, []);

  const fetchSessionStatus = async () => {
    try {
      const response = await sessionAPI.getStatus();
      setSession(response.session);
    } catch (error) {
      console.error('Failed to fetch session status:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getSessionDuration = () => {
    if (!session) return '';
    
    try {
      const loginTime = new Date(session.loginTime).getTime();
      const now = Date.now();
      const diffMs = now - loginTime;
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 60) {
        return `${diffMins} min${diffMins !== 1 ? 's' : ''}`;
      } else {
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        return `${hours}h ${mins}m`;
      }
    } catch {
      return '';
    }
  };

  if (loading || !session) return null;

  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Session Information</h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex items-center text-gray-600">
          <Clock className="w-4 h-4 mr-2 text-blue-600" />
          <span className="text-gray-500">Logged in:</span>
          <span className="ml-auto font-medium text-gray-900">
            {formatDateTime(session.loginTime)}
          </span>
        </div>
        
        <div className="flex items-center text-gray-600">
          <Clock className="w-4 h-4 mr-2 text-green-600" />
          <span className="text-gray-500">Last activity:</span>
          <span className="ml-auto font-medium text-gray-900">
            {formatDateTime(session.lastActivity)}
          </span>
        </div>
        
        <div className="flex items-center text-gray-600">
          <MapPin className="w-4 h-4 mr-2 text-purple-600" />
          <span className="text-gray-500">IP Address:</span>
          <span className="ml-auto font-medium text-gray-900">
            {session.ipAddress}
          </span>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Session duration:</span>
          <span className="font-medium text-gray-900">{getSessionDuration()}</span>
        </div>
      </div>
    </div>
  );
};
