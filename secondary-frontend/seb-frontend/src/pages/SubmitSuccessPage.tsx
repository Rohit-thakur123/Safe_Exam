// Success page after exam submission
// Phase 9: Also handles the already_submitted redirect so re-entrants see a
// clean informational page instead of a generic error.
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, Award, Clock, TrendingUp, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { StorageService } from '../services/storageService';

export const SubmitSuccessPage = () => {
  const [searchParams] = useSearchParams();

  const autoSubmit = searchParams.get('autoSubmit') === 'true';
  const score = searchParams.get('score');
  const percentage = searchParams.get('percentage');
  const reason = searchParams.get('reason');
  const alreadySubmitted = reason === 'already_submitted';
  const tabViolation = searchParams.get('reason') === 'tab_switch_violation';

  useEffect(() => {
    // Phase 9: Wipe ALL local exam data and session token on landing here.
    // This ensures no re-entry is possible from the browser back button.
    localStorage.removeItem('seb_session_token');
    // Clear any remaining exam-scoped keys (unknown examId — clear by prefix scan)
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('seb_exam_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
        {/* Success icon */}
        <div className="flex justify-center mb-6">
          {alreadySubmitted ? (
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
              <ShieldCheck size={48} className="text-blue-600" />
            </div>
          ) : (
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle size={48} className="text-green-600" />
            </div>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-4">
          {alreadySubmitted
            ? 'Exam Already Submitted'
            : autoSubmit
            ? tabViolation
              ? 'Exam Auto-Submitted'
              : "Time's Up! Exam Submitted"
            : 'Exam Submitted Successfully!'}
        </h1>

        {/* Context message */}
        {alreadySubmitted && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-start gap-3">
              <ShieldCheck size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                You have already submitted this exam. Your responses are safely recorded and cannot be changed.
                You can now close this browser window.
              </p>
            </div>
          </div>
        )}

        {/* Auto-submit / tab violation message */}
        {!alreadySubmitted && autoSubmit && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <div className="flex items-start gap-3">
              <Clock size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800">
                {tabViolation
                  ? 'Your exam was automatically submitted due to repeated tab/window switching violations.'
                  : 'Your exam time expired and your answers were automatically submitted.'}
              </p>
            </div>
          </div>
        )}

        {/* Success message */}
        {!alreadySubmitted && (
          <p className="text-center text-gray-600 mb-8">
            Your exam has been successfully submitted and is being evaluated.
            You will receive your results shortly.
          </p>
        )}

        {/* Results preview (if available) */}
        {score && percentage && (
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-blue-50 rounded-xl p-6 text-center">
              <Award size={32} className="text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-1">Your Score</p>
              <p className="text-3xl font-bold text-blue-600">{score}</p>
            </div>

            <div className="bg-green-50 rounded-xl p-6 text-center">
              <TrendingUp size={32} className="text-green-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-1">Percentage</p>
              <p className="text-3xl font-bold text-green-600">{percentage}%</p>
            </div>
          </div>
        )}

        {/* Information */}
        {!alreadySubmitted && (
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
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
        )}

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
            You can safely close this window now
          </p>
        </div>
      </div>
    </div>
  );
};