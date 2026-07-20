import React from "react";

interface QuestionStatus {
  _id: string;
  questionNumber: number;
  answer: string;
}

interface ReviewScreenProps {
  questions: QuestionStatus[];
  onQuestionClick: (index: number) => void;
  onBack: () => void;
  onSubmit: () => void;
}

const ReviewScreen: React.FC<ReviewScreenProps> = ({
  questions,
  onQuestionClick,
  onBack,
  onSubmit,
}) => {
  const getStatus = (answer: string) => {
    return answer.trim().length > 0;
  };

  return (
    <div className="max-w-4xl mx-auto bg-white shadow rounded-xl p-6">

      <h2 className="text-2xl font-bold mb-6">
        Review Your Answers
      </h2>

      <div className="space-y-3">

        {questions.map((q, index) => {

          const answered = getStatus(q.answer);

          return (

            <div
              key={q._id}
              className="flex justify-between items-center border rounded-lg p-4"
            >

              <div>

                <h3 className="font-semibold">
                  Question {q.questionNumber}
                </h3>

                <span
                  className={
                    answered
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {answered ? "✅ Answered" : "❌ Not Answered"}
                </span>

              </div>

              <button
                onClick={() => onQuestionClick(index)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                Edit
              </button>

            </div>

          );
        })}

      </div>

      <div className="flex justify-between mt-8">

        <button
          onClick={onBack}
          className="px-6 py-2 bg-gray-600 text-white rounded-lg"
        >
          Back
        </button>

        <button
          className="btn btn-success"
          data-bs-toggle="modal"
          data-bs-target="#submitModal"
        >
          Final Submit
        </button>

      </div>
      <div
  className="modal fade"
  id="submitModal"
  tabIndex={-1}
  aria-hidden="true"
>
  <div className="modal-dialog modal-dialog-centered">
    <div className="modal-content">

      <div className="modal-header">
        <h5 className="modal-title">Confirm Submission</h5>
      </div>

      <div className="modal-body">
        <p>Are you sure you want to submit your exam?</p>

        <div className="alert alert-warning">
          <strong>Warning:</strong> You cannot edit your answers after submission.
        </div>
      </div>

      <div className="modal-footer">
        <button
          className="btn btn-secondary"
          data-bs-dismiss="modal"
        >
          Cancel
        </button>

        <button
          className="btn btn-success"
          onClick={onSubmit}
        >
          Submit Exam
        </button>
      </div>

    </div>
  </div>
</div>

    </div>
  );
};

export default ReviewScreen;