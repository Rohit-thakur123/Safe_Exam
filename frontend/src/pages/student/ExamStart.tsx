import React from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import ExamVerification from './ExamVerification';

/**
 * Wrapper component to handle query parameter format from backend
 * Backend redirects to: /exam/start?examId={id}&token={token}
 * This component extracts the params and renders ExamVerification
 */
const ExamStart: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const examId = searchParams.get('examId');
  const token = searchParams.get('token');
  
  // If we have the parameters, render the verification component
  // The ExamVerification component will extract studentId from the token
  if (examId && token) {
    // Pass these as props to ExamVerification
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Props are intentionally passed to support query param format
    return <ExamVerification examIdOverride={examId} tokenOverride={token} />;
  }

  if (examId) {
    return <Navigate to={`/student/exam/${examId}`} replace />;
  }
  
  // If parameters are missing, show error
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <div className="card-surface rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="text-red-600 text-5xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold" style={{color:"var(--text-heading)" mb-4">Invalid Exam Link</h2>
        <p className="text-gray-700 mb-6">
          The exam link you followed is missing required information. Please check your email for the correct link.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Go to Login
        </button>
      </div>
    </div>
  );
};

export default ExamStart;
