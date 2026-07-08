// Submit button with confirmation modal
import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface SubmitButtonProps {
  onSubmit: () => Promise<void>;
  answeredCount: number;
  totalQuestions: number;
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({
  onSubmit,
  answeredCount,
  totalQuestions,
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const unansweredCount = totalQuestions - answeredCount;
  const hasUnanswered = unansweredCount > 0;
  
  const handleSubmitClick = () => {
    setShowConfirmModal(true);
  };
  
  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit();
    } catch (error) {
      console.error('Failed to submit exam:', error);
      alert('Failed to submit exam. Please try again.');
    } finally {
      setIsSubmitting(false);
      setShowConfirmModal(false);
    }
  };
  
  return (
    <>
      <Button
        variant="success"
        onClick={handleSubmitClick}
        disabled={isSubmitting}
        className="min-w-[150px]"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Exam'}
      </Button>
      
      <Modal
        isOpen={showConfirmModal}
        onClose={() => !isSubmitting && setShowConfirmModal(false)}
        title="Submit Exam"
        size="md"
        closeOnOverlayClick={!isSubmitting}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowConfirmModal(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="success"
              onClick={handleConfirmSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Yes, Submit'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Warning if unanswered questions */}
          {hasUnanswered && (
            <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle size={24} className="text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">
                  You have {unansweredCount} unanswered question{unansweredCount !== 1 ? 's' : ''}
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  Unanswered questions will be marked as incorrect.
                </p>
              </div>
            </div>
          )}
          
          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Submission Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Questions:</span>
                <span className="font-medium text-gray-900">{totalQuestions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Answered:</span>
                <span className="font-medium text-green-600">{answeredCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Unanswered:</span>
                <span className="font-medium text-red-600">{unansweredCount}</span>
              </div>
            </div>
          </div>
          
          {/* Confirmation message */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <CheckCircle size={24} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">
                Are you sure you want to submit?
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Once submitted, you cannot make any changes to your answers.
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};