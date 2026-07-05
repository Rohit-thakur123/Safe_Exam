import ExamDashboard from "../components/exam/ExamDashboard";

export default function DashboardPage() {
  return (
    <ExamDashboard
      companyName="SafeExam"
      examTitle="Software Engineer Assessment"
      totalMarks={100}
      candidateName="Anant Goyal"
      candidateId="22BCS0001"
      timeRemainingSeconds={7200}

      mcqStatus="not_started"
      mcqMeta={{
        itemCountLabel: "20 Questions",
        marks: 60,
      }}

      codingStatus="locked"
      codingMeta={{
        itemCountLabel: "3 Problems",
        marks: 40,
      }}

      onStartMcq={() => console.log("MCQ")}
      onContinueMcq={() => console.log("Continue")}
      onReviewMcq={() => console.log("Review")}

      onStartCoding={() => console.log("Coding")}
      onContinueCoding={() => console.log("Continue Coding")}
      onReviewCoding={() => console.log("Review Coding")}

      onSubmitExam={() => console.log("Submit")}
    />
  );
}