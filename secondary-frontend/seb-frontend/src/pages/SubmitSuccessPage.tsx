// Success page after exam submission
import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Award, Clock, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const SubmitSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const autoSubmit = searchParams.get('autoSubmit') === 'true';
  const score = searchParams.get('score');
  const percentage = searchParams.get('percentage');
  
  useEffect(() => {
    // Clear any remaining session data
    localStorage.removeItem('seb_session_token');
  }, []);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
        {/* Success icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle size={48} className="text-green-600" />
          </div>
        </div>
        
        {/* Title */}
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-4">
          {autoSubmit ? 'Time\'s Up! Exam Submitted' : 'Exam Submitted Successfully!'}
        </h1>
        
        {/* Auto-submit message */}
        {autoSubmit && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Clock size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800">
                Your exam time expired and your answers were automatically submitted.
              </p>
            </div>
          </div>
        )}
        
        {/* Success message */}
        <p className="text-center text-gray-600 mb-8">
          Your exam has been successfully submitted and is being evaluated. 
          You will receive your results shortly.
        </p>
        
        {/* Results preview (if available) */}
        {score && percentage && (
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-blue-50 rounded-lg p-6 text-center">
              <Award size={32} className="text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-1">Your Score</p>
              <p className="text-3xl font-bold text-blue-600">{score}</p>
            </div>
            
            <div className="bg-green-50 rounded-lg p-6 text-center">
              <TrendingUp size={32} className="text-green-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-1">Percentage</p>
              <p className="text-3xl font-bold text-green-600">{percentage}%</p>
            </div>
          </div>
        )}
        
        {/* Information */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">What happens next?</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Your answers are being evaluated</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>You will receive an email with your detailed results</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Check your student portal for the final score</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>You can now safely close the Safe Exam Browser</span>
            </li>
          </ul>
        </div>
        
        {/* Close button */}
        <div className="text-center">
          <Button
            variant="primary"
            onClick={() => window.close()}
            className="px-12"
          >
            Close Browser
          </Button>
          <p className="text-xs text-gray-500 mt-3">
            You can safely close Safe Exam Browser now
          </p>
        </div>
      </div>
    </div>
  );
};