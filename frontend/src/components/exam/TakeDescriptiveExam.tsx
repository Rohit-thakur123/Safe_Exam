import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import DescriptiveAnswer from "./DescriptiveAnswer";

const TakeDescriptiveExam = () => {
  const navigate = useNavigate();

  // Temporary IDs (replace with actual values later)
  const studentId = "student123";
  const examId = "exam123";
  const attemptId = "attempt123";

  const questions = [
    {
      _id: "q1",
      question: "Explain Merge Sort.",
    },
    {
      _id: "q2",
      question: "Explain Binary Search.",
    },
    {
      _id: "q3",
      question: "Difference between Stack and Queue.",
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  const currentQuestion = questions[currentIndex];

  // Save current answer before changing question
  const saveCurrentAnswer = async () => {
    try {
      // TODO: Call your save draft API here

      // Example:
      // await axios.post("/api/descriptive/save", {
      //   student: studentId,
      //   exam: examId,
      //   question: currentQuestion._id,
      //   attempt: attemptId,
      //   answer: "Current Answer"
      // });

    } catch (error) {
      console.error("Error saving draft:", error);
    }
  };

  const handleNext = async () => {
    await saveCurrentAnswer();

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = async () => {
    await saveCurrentAnswer();

    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleFinalSubmit = async () => {
    try {
      await saveCurrentAnswer();

      await axios.post("/api/descriptive/submit", {
        student: studentId,
        exam: examId,
        attempt: attemptId,
      });

      alert("Exam submitted successfully!");

      // Change this route according to your project
      navigate("/exam/submitted");
    } catch (error) {
      console.error(error);
      alert("Submission failed!");
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <DescriptiveAnswer
        questionNumber={currentIndex + 1}
        question={currentQuestion.question}
        questionId={currentQuestion._id}
        attemptId={attemptId}
        studentId={studentId}
        examId={examId}
      />

      <div className="flex justify-between mt-8">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="px-5 py-2 bg-gray-600 text-white rounded disabled:opacity-50"
        >
          Previous
        </button>

        {currentIndex === questions.length - 1 ? (
          <button
            onClick={handleFinalSubmit}
            className="px-5 py-2 bg-green-600 text-white rounded"
          >
            Final Submit
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="px-5 py-2 bg-blue-600 text-white rounded"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
};

export default TakeDescriptiveExam;