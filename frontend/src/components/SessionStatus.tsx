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

  useEffect(() => { fetchSessionStatus(); }, []);

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
      return new Date(dateString).toLocaleString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      });
    } catch { return dateString; }
  };

  const getSessionDuration = () => {
    if (!session) return '';
    try {
      const diffMins = Math.floor((Date.now() - new Date(session.loginTime).getTime()) / 60000);
      if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''}`;
      const hours = Math.floor(diffMins / 60);
      return `${hours}h ${diffMins % 60}m`;
    } catch { return ''; }
  };

  if (loading || !session) return null;

  const rowStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', fontSize: '0.8125rem',
    color: 'var(--text-secondary)', gap: '0.5rem',
  };
  const valueStyle: React.CSSProperties = {
    marginLeft: 'auto', fontWeight: 600, color: 'var(--text-primary)',
  };

  return (
    <div
      className="card-surface"
      style={{ padding: '1rem' }}
    >
      <h3 style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
        Session Information
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={rowStyle}>
          <Clock size={14} style={{ color: 'var(--accent-indigo)', flexShrink: 0 }} />
          <span>Logged in:</span>
          <span style={valueStyle}>{formatDateTime(session.loginTime)}</span>
        </div>
        <div style={rowStyle}>
          <Clock size={14} style={{ color: 'var(--accent-emerald)', flexShrink: 0 }} />
          <span>Last activity:</span>
          <span style={valueStyle}>{formatDateTime(session.lastActivity)}</span>
        </div>
        <div style={rowStyle}>
          <MapPin size={14} style={{ color: 'var(--accent-purple)', flexShrink: 0 }} />
          <span>IP Address:</span>
          <span style={valueStyle}>{session.ipAddress}</span>
        </div>
      </div>

      <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span>Session duration:</span>
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{getSessionDuration()}</span>
        </div>
      </div>
    </div>
  );
};
