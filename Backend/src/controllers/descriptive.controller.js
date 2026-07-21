import DescriptiveAnswer from "../models/descriptive/descriptiveAnswer.js";
import ExamAttempt from "../models/exam/examAttempt.js";
import Exam from "../models/exam/exam.js";
import mongoose from "mongoose";

/**
 * ----------------------------------------
 * Save Draft
 * POST /api/descriptive/save
 * Body: { student, exam, question, answer, attemptId? }
 * ----------------------------------------
 */
export const saveDraft = async (req, res) => {
  try {
    let { student, exam, question, questionId, answer, attemptId } = req.body;
    question = question || questionId;
    student = student || req.user?._id;

    if (attemptId && (!exam || !student)) {
      const att = await ExamAttempt.findById(attemptId);
      if (att) {
        exam = exam || att.examId;
        student = student || att.studentId;
      }
    }

    if (!student || !exam || !question) {
      return res.status(400).json({
        success: false,
        message: "Student, Exam and Question are required.",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(student) ||
      !mongoose.Types.ObjectId.isValid(exam) ||
      !mongoose.Types.ObjectId.isValid(question) ||
      (attemptId && !mongoose.Types.ObjectId.isValid(attemptId))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid student, exam, question, or attemptId format.",
      });
    }

    // Check if exam is already submitted
    const submitted = await DescriptiveAnswer.findOne({
      student,
      exam,
      isSubmitted: true,
    });

    if (submitted) {
      return res.status(400).json({
        success: false,
        message: "Exam already submitted.",
      });
    }

    const wordCount = answer
      ? answer.trim().split(/\s+/).filter(Boolean).length
      : 0;

    const updateFields = {
      answer,
      wordCount,
      status: "draft",
    };
    if (attemptId) updateFields.attemptId = attemptId;

    const draft = await DescriptiveAnswer.findOneAndUpdate(
      { student, exam, question },
      updateFields,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      success: true,
      message: "Draft saved successfully.",
      data: draft,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Unable to save draft.",
    });
  }
};

/**
 * ----------------------------------------
 * Get Saved Answer
 * GET /api/descriptive/:attemptId/:questionId
 * ----------------------------------------
 */
export const getAnswer = async (req, res) => {
  try {
    const { attemptId, questionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(attemptId) || !mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({ success: false, error: "Invalid attemptId or questionId format" });
    }

    const answer = await DescriptiveAnswer.findOne({
      exam: attemptId,
      question: questionId,
    });

    if (!answer) {
      return res.status(404).json({
        success: false,
        message: "Answer not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: answer,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch answer.",
    });
  }
};

/**
 * ----------------------------------------
 * Final Submit
 * POST /api/descriptive/submit
 * ----------------------------------------
 */
export const submitAnswer = async (req, res) => {
  try {
    let { student, exam, attemptId } = req.body;
    student = student || req.user?._id;

    if (attemptId && (!exam || !student)) {
      const att = await ExamAttempt.findById(attemptId);
      if (att) {
        exam = exam || att.examId;
        student = student || att.studentId;
      }
    }

    if (!student || !exam) {
      return res.status(400).json({
        success: false,
        message: "Student and Exam are required.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(student) || !mongoose.Types.ObjectId.isValid(exam)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student or exam ID format.",
      });
    }

    // Prevent duplicate submission
    const alreadySubmitted = await DescriptiveAnswer.findOne({
      student,
      exam,
      isSubmitted: true,
    });

    if (alreadySubmitted) {
      return res.status(400).json({
        success: false,
        message: "Exam already submitted.",
      });
    }

    // Submit all descriptive answers of this exam
    await DescriptiveAnswer.updateMany(
      { student, exam },
      {
        $set: {
          status: "submitted",
          isSubmitted: true,
          submittedAt: new Date(),
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "Exam submitted successfully.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Unable to submit exam.",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// TEACHER-ONLY: Get all descriptive answers for an exam
// GET /api/descriptive/exam/:examId
// ─────────────────────────────────────────────────────────────────────────────
export const getExamAnswers = async (req, res) => {
  try {
    const { examId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({ success: false, error: "Invalid exam ID" });
    }

    // Verify teacher owns this exam
    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ success: false, error: "Exam not found" });
    if (exam.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: "Not authorized" });
    }

    // Get all submitted answers for this exam, grouped by student
    const answers = await DescriptiveAnswer.find({ exam: examId })
      .populate("student", "name email")
      .populate("question", "title description maxMarks rubric referenceAnswer")
      .sort({ student: 1, question: 1 });

    return res.status(200).json({
      success: true,
      count: answers.length,
      data: answers,
    });
  } catch (error) {
    console.error("getExamAnswers error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// TEACHER-ONLY: Get one student's answers for an exam
// GET /api/descriptive/exam/:examId/student/:studentId
// ─────────────────────────────────────────────────────────────────────────────
export const getStudentAnswers = async (req, res) => {
  try {
    const { examId, studentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(examId) || !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ success: false, error: "Invalid ID" });
    }

    // Verify teacher owns this exam
    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ success: false, error: "Exam not found" });
    if (exam.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: "Not authorized" });
    }

    const answers = await DescriptiveAnswer.find({ exam: examId, student: studentId })
      .populate("student", "name email")
      .populate("question", "title description maxMarks rubric referenceAnswer")
      .sort({ question: 1 });

    return res.status(200).json({
      success: true,
      count: answers.length,
      data: answers,
    });
  } catch (error) {
    console.error("getStudentAnswers error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// TEACHER-ONLY: Evaluate (grade) a descriptive answer
// POST /api/descriptive/evaluate
// Body: { answerId, marksAwarded, feedback }
// ─────────────────────────────────────────────────────────────────────────────
export const evaluateAnswer = async (req, res) => {
  try {
    const { answerId, marksAwarded, feedback } = req.body;

    if (!answerId || marksAwarded === undefined) {
      return res.status(400).json({ success: false, error: "answerId and marksAwarded are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(answerId)) {
      return res.status(400).json({ success: false, error: "Invalid answer ID" });
    }

    const answer = await DescriptiveAnswer.findById(answerId)
      .populate("question", "maxMarks");

    if (!answer) return res.status(404).json({ success: false, error: "Answer not found" });

    const maxMarks = answer.question?.maxMarks || 0;
    if (Number(marksAwarded) < 0 || Number(marksAwarded) > maxMarks) {
      return res.status(400).json({
        success: false,
        error: `Marks must be between 0 and ${maxMarks}`,
      });
    }

    answer.marksAwarded = Number(marksAwarded);
    answer.feedback = feedback || "";
    answer.evaluatedBy = req.user._id;
    answer.evaluatedAt = new Date();
    answer.status = "evaluated";
    await answer.save();

    // Check if ALL answers for this attempt/exam are now evaluated
    const examId = answer.exam;
    const studentId = answer.student;

    const allAnswers = await DescriptiveAnswer.find({ exam: examId, student: studentId });
    const allEvaluated = allAnswers.every(a => a.status === "evaluated");

    if (allEvaluated) {
      const totalSubjectiveScore = allAnswers.reduce((sum, a) => sum + (a.marksAwarded || 0), 0);

      // Find the ExamAttempt for this student/exam
      const attempt = await ExamAttempt.findOne({ examId, studentId });
      if (attempt) {
        const examDoc = await Exam.findById(examId).select("passingMarks");
        attempt.subjectiveStatus = "evaluated";
        attempt.subjectiveScore = totalSubjectiveScore;
        // Add subjective marks to running score
        attempt.score = (attempt.score || 0) + totalSubjectiveScore;
        attempt.percentage = attempt.totalMarks > 0
          ? Math.round((attempt.score / attempt.totalMarks) * 100 * 100) / 100
          : 0;
        attempt.passed = attempt.score >= (examDoc?.passingMarks || 0);
        await attempt.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: "Answer evaluated successfully",
      data: answer,
      allEvaluated,
    });
  } catch (error) {
    console.error("evaluateAnswer error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};