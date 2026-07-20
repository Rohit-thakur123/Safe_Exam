import DescriptiveAnswer from "../models/descriptive/descriptiveAnswer.js";

/**
 * ----------------------------------------
 * Save Draft
 * POST /api/descriptive/save
 * ----------------------------------------
 */
export const saveDraft = async (req, res) => {
  try {
    const { student, exam, question, answer } = req.body;

    if (!student || !exam || !question) {
      return res.status(400).json({
        success: false,
        message: "Student, Exam and Question are required.",
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

    const draft = await DescriptiveAnswer.findOneAndUpdate(
      {
        student,
        exam,
        question,
      },
      {
        answer,
        wordCount,
        status: "draft",
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
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
    const { student, exam } = req.body;

    if (!student || !exam) {
      return res.status(400).json({
        success: false,
        message: "Student and Exam are required.",
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
      {
        student,
        exam,
      },
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