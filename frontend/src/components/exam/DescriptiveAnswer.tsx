import { useEffect, useMemo, useState } from "react";
import axios from "axios";

interface DescriptiveAnswerProps {
  questionNumber: number;
  question: string;
  attemptId: string;
  questionId: string;
  studentId: string;
  examId: string;
  maxWords?: number;
}

const DescriptiveAnswer = ({
  questionNumber,
  question,
  attemptId,
  questionId,
  studentId,
  examId,
  maxWords = 500,
}: DescriptiveAnswerProps) => {
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);

  // idle | saving | saved
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved"
  >("idle");

  // -------------------------------
  // Load Existing Answer
  // -------------------------------
  useEffect(() => {
    loadSavedAnswer();
  }, [attemptId, questionId]);

  const loadSavedAnswer = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `/api/descriptive/${attemptId}/${questionId}`
      );

      if (res.data.success && res.data.data) {
        setAnswer(res.data.data.answer || "");
      }
    } catch (err) {
      console.log("No saved answer found.");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------
  // Auto Save
  // -------------------------------
  useEffect(() => {
    if (loading) return;

    const timer = setTimeout(() => {
      saveDraft();
    }, 10000); // 10 seconds

    return () => clearTimeout(timer);
  }, [answer]);

  const saveDraft = async () => {
    try {
      setSaveStatus("saving");

      const wordCount = answer.trim()
        ? answer.trim().split(/\s+/).length
        : 0;

      await axios.post("/api/descriptive/save", {
        student: studentId,
        exam: examId,
        question: questionId,
        answer,
        wordCount,
      });

      setSaveStatus("saved");
    } catch (err) {
      console.error("Draft save failed.");
    }
  };

  // -------------------------------
  // Word Count
  // -------------------------------
  const wordCount = useMemo(() => {
    if (!answer.trim()) return 0;

    return answer.trim().split(/\s+/).length;
  }, [answer]);

  if (loading) {
    return (
      <div className="text-center py-10">
        Loading answer...
      </div>
    );
  }

  return (
    <div className="card-surface rounded-xl shadow border p-6">

      <h2 className="text-2xl font-bold mb-2">
        Question {questionNumber}
      </h2>

      <p className="mb-5">
        {question}
      </p>

      <textarea
        rows={12}
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Write your answer..."
        className="w-full border rounded-lg p-4 resize-none"
      />

      <div className="flex justify-between mt-4 text-sm">

        <span>
          Words : {wordCount}/{maxWords}
        </span>

        <span>
          Characters : {answer.length}
        </span>

        <span
          className={
            saveStatus === "saving"
              ? "text-yellow-600"
              : "text-green-600"
          }
        >
          {saveStatus === "saving"
            ? "Saving..."
            : saveStatus === "saved"
            ? "Draft Saved ✔"
            : ""}
        </span>

      </div>

    </div>
  );
};

export default DescriptiveAnswer;