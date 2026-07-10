// Entry point for direct /dashboard links. The real exam flow lives at
// /exam/:examId/:sessionToken (ExamPage), so this route's only job is to
// read examId/sessionToken from the query string and redirect there —
// or show a clear error if they're missing, so /dashboard is never a dead end.
import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";

export default function DashboardPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const examId = searchParams.get("examId");
  const sessionToken = searchParams.get("sessionToken");

  useEffect(() => {
    if (examId && sessionToken) {
      navigate(`/exam/${examId}/${sessionToken}`, { replace: true });
    }
  }, [examId, sessionToken, navigate]);

  if (examId && sessionToken) {
    return null; // redirecting
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
        <h2 className="text-xl font-bold text-red-600 mb-4">No Exam Link Provided</h2>
        <p className="text-gray-700 mb-6">
          This page needs an exam link with your exam ID and session token to
          start your exam. Please use the link sent to you, or open the exam
          through Safe Exam Browser.
        </p>
        <Button variant="primary" onClick={() => navigate("/exam/error?message=No%20exam%20link%20provided")}>
          Go to Error Page
        </Button>
      </div>
    </div>
  );
}
