import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';

const ExamLaunch: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [showFallback, setShowFallback] = useState(false);
  const examId = searchParams.get('examId');

  const sebLink = useMemo(() => {
    if (!examId) return '';
    return `seb://localhost:5173/exam/start?examId=${encodeURIComponent(examId)}`;
  }, [examId]);

  const sebConfigUrl = useMemo(() => {
    if (!examId) return '';
    return `http://localhost:4000/seb/config?examId=${encodeURIComponent(examId)}`;
  }, [examId]);

  useEffect(() => {
    if (!sebLink) return;

    window.location.href = sebLink;

    const fallbackTimer = window.setTimeout(() => {
      setShowFallback(true);
    }, 2000);

    return () => window.clearTimeout(fallbackTimer);
  }, [sebLink]);

  if (!examId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <h1 className="text-xl font-semibold text-gray-900 mb-3">Invalid Exam Link</h1>
            <p className="text-gray-700">Missing examId.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-6 text-center space-y-4">
          <h1 className="text-xl font-semibold text-gray-900">Opening Safe Exam Browser</h1>
          {showFallback && (
            <p className="text-gray-700">
              If SEB did not open, please open using Safe Exam Browser
            </p>
          )}
          <Button onClick={() => { window.location.href = sebLink; }} className="w-full">
            Open in Safe Exam Browser
          </Button>
          {showFallback && (
            <a
              href={sebConfigUrl}
              className="block text-sm text-blue-600 underline"
            >
              Download SEB configuration
            </a>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExamLaunch;
