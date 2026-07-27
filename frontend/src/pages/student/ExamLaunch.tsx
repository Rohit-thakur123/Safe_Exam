import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import api from '../../services/api';

// The SEB frontend (secondary-frontend/seb-frontend) runs on its own dev
// server/port, separate from this app. Configure via VITE_SEB_FRONTEND_URL;
// defaults to the conventional local dev port.
const SEB_FRONTEND_URL = import.meta.env.VITE_SEB_FRONTEND_URL || 'http://localhost:5174';

type LaunchState = 'verifying' | 'ready' | 'error';

const ExamLaunch: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<LaunchState>('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const [sebSessionToken, setSebSessionToken] = useState<string | null>(null);

  const examId = searchParams.get('examId');
  const studentId = searchParams.get('studentId');
  const linkToken = searchParams.get('token');

  useEffect(() => {
    if (!examId || !studentId || !linkToken) {
      setErrorMessage('This exam link is missing required information. Please use the link from your exam assignment email.');
      setState('error');
      return;
    }

    let cancelled = false;

    const mintSession = async () => {
      try {
        // 1. Verify the student is eligible to attempt this exam
        const verifyRes = await api.post('/seb/verify-exam-link', {
          examId,
          studentId,
          token: linkToken
        });

        if (!verifyRes.data.success) {
          throw new Error(verifyRes.data.error || 'Unable to verify exam eligibility.');
        }

        // 2. Mint a short-lived SEB session token for the actual exam attempt
        const sessionRes = await api.post('/seb/get-session-token', {
          examId,
          studentId,
          token: linkToken
        });

        if (!sessionRes.data.success) {
          throw new Error(sessionRes.data.error || 'Unable to start exam session.');
        }

        if (cancelled) return;
        setSebSessionToken(sessionRes.data.data.sebSessionToken);
        setState('ready');
      } catch (err: any) {
        if (cancelled) return;
        const message =
          err?.response?.data?.error ||
          (err instanceof Error ? err.message : 'Something went wrong starting your exam.');
        setErrorMessage(message);
        setState('error');
      }
    };

    mintSession();

    return () => {
      cancelled = true;
    };
  }, [examId, studentId, linkToken]);

  const sebLink = useMemo(() => {
    if (!examId || !sebSessionToken) return '';
    // Production path: SEB's protocol handler fetches a `.seb` config file
    // (not a web page) and reads a startURL out of it — it does not navigate
    // directly to an arbitrary seb://<url>. The backend's /seb/config route
    // returns that file; SEB triggers on Content-Type: application/seb.
    const backendHost = api.defaults.baseURL?.replace(/^https?:\/\//, '') || 'localhost:3000';
    return `seb://${backendHost}/seb/config?examId=${examId}&sessionToken=${sebSessionToken}`;
  }, [examId, sebSessionToken]);

  const browserFallbackLink = useMemo(() => {
    if (!examId || !sebSessionToken) return '';
    // Dev/testing path: opens the exam directly in a regular browser tab.
    // Only works if the backend has BYPASS_SEB_CHECK=true set.
    return `${SEB_FRONTEND_URL}/exam/${examId}/${sebSessionToken}`;
  }, [examId, sebSessionToken]);

  useEffect(() => {
    if (state === 'ready' && sebLink) {
      window.location.href = sebLink;
    }
  }, [state, sebLink]);

  if (state === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background:"var(--bg-primary)" p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <h1 className="text-xl font-semibold text-heading mb-3">Checking your exam access…</h1>
            <p className="text-gray-700">This will only take a moment.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background:"var(--bg-primary)" p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <h1 className="text-xl font-semibold text-red-600 mb-3">Unable to Start Exam</h1>
            <p className="text-gray-700">{errorMessage}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{background:"var(--bg-primary)" p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-6 text-center space-y-4">
          <h1 className="text-xl font-semibold text-heading">Opening Safe Exam Browser</h1>
          <p className="text-gray-700">
            If Safe Exam Browser did not open automatically, click below.
          </p>
          <Button onClick={() => { window.location.href = sebLink; }} className="w-full">
            Open in Safe Exam Browser
          </Button>
          <a
            href={browserFallbackLink}
            className="block text-sm text-blue-600 underline"
          >
            Continue without Safe Exam Browser (for testing only)
          </a>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExamLaunch;
