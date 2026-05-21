// Error page for displaying exam errors
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, XCircle, Clock, Lock } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const ErrorPage = () => {
  const [searchParams] = useSearchParams();
  const message = searchParams.get('message') || 'An error occurred';
  const code = searchParams.get('code') || 'UNKNOWN_ERROR';
  
  const getErrorIcon = () => {
    switch (code) {
      case 'SESSION_EXPIRED':
        return <Clock size={48} className="text-yellow-600" />;
      case 'INVALID_TOKEN':
        return <Lock size={48} className="text-red-600" />;
      default:
        return <XCircle size={48} className="text-red-600" />;
    }
  };
  
  const getErrorTitle = () => {
    switch (code) {
      case 'SESSION_EXPIRED':
        return 'Session Expired';
      case 'INVALID_TOKEN':
        return 'Invalid or Expired Link';
      case 'EXAM_NOT_FOUND':
        return 'Exam Not Found';
      default:
        return 'Error';
    }
  };
  
  const getErrorDetails = () => {
    switch (code) {
      case 'SESSION_EXPIRED':
        return 'Your exam session has expired. This may happen if you took too long or left the exam page. Please contact your instructor for assistance.';
      case 'INVALID_TOKEN':
        return 'The exam link you used is invalid or has expired. Please check your email for the correct link or contact your instructor.';
      case 'EXAM_NOT_FOUND':
        return 'The exam you are trying to access could not be found. It may have been removed or the link is incorrect.';
      default:
        return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
        {/* Error icon */}
        <div className="flex justify-center mb-6">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
            code === 'SESSION_EXPIRED' ? 'bg-yellow-100' : 'bg-red-100'
          }`}>
            {getErrorIcon()}
          </div>
        </div>
        
        {/* Title */}
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-4">
          {getErrorTitle()}
        </h1>
        
        {/* Error message */}
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{message}</p>
          </div>
        </div>
        
        {/* Error details */}
        <p className="text-center text-gray-600 mb-8">
          {getErrorDetails()}
        </p>
        
        {/* Error code */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-xs text-gray-500 text-center">
            Error Code: <span className="font-mono font-semibold">{code}</span>
          </p>
        </div>
        
        {/* Next steps */}
        <div className="bg-blue-50 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">What should you do?</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Contact your instructor or exam administrator</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Provide them with the error code above</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Check your email for a new exam link</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Ensure you're using the latest link sent to you</span>
            </li>
          </ul>
        </div>
        
        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <Button
            variant="secondary"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
          <Button
            variant="primary"
            onClick={() => window.close()}
          >
            Close Browser
          </Button>
        </div>
      </div>
    </div>
  );
};