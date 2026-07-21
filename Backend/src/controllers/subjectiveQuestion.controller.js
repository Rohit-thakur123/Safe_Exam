import DescriptiveQuestion from "../models/descriptive/descriptiveQuestion.js";
import mongoose from "mongoose";

// ─────────────────────────────────────────────────────────────────────────────
// Create a new subjective question
// POST /subjective-questions
// ─────────────────────────────────────────────────────────────────────────────
export const createSubjectiveQuestion = async (req, res) => {
  try {
    const {
      title,
      description,
      instructions,
      maxMarks,
      wordLimit,
      minWords,
      referenceAnswer,
      rubric,
      teacherNotes,
      tags,
      difficulty,
      category,
      categoryId,
    } = req.body;

    if (!title || !description || !maxMarks) {
      return res.status(400).json({
        success: false,
        error: "Title, description, and maxMarks are required",
      });
    }

    const question = new DescriptiveQuestion({
      title: title.trim(),
      description: description.trim(),
      instructions: instructions?.trim() || "",
      maxMarks: Number(maxMarks),
      wordLimit: Number(wordLimit) || 0,
      minWords: Number(minWords) || 0,
      referenceAnswer: referenceAnswer?.trim() || "",
      rubric: rubric?.trim() || "",
      teacherNotes: teacherNotes?.trim() || "",
      tags: Array.isArray(tags) ? tags : [],
      difficulty: difficulty || "medium",
      category: category || "",
      categoryId: categoryId || null,
      createdBy: req.user._id,
    });

    await question.save();

    return res.status(201).json({
      success: true,
      message: "Subjective question created successfully",
      question,
    });
  } catch (error) {
    console.error("Create subjective question error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Server error creating subjective question",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Get all subjective questions (teacher only)
// GET /subjective-questions
// ─────────────────────────────────────────────────────────────────────────────
export const getAllSubjectiveQuestions = async (req, res) => {
  try {
    const { search, difficulty, isActive, page = 1, limit = 50 } = req.query;

    const filter = { createdBy: req.user._id };

    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    if (difficulty) {
      filter.difficulty = difficulty;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await DescriptiveQuestion.countDocuments(filter);
    const questions = await DescriptiveQuestion.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      count: questions.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      data: questions,
    });
  } catch (error) {
    console.error("Get all subjective questions error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Server error fetching subjective questions",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Get a single subjective question by ID
// GET /subjective-questions/:id
// ─────────────────────────────────────────────────────────────────────────────
export const getSubjectiveQuestionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: "Invalid question ID" });
    }

    const question = await DescriptiveQuestion.findById(id);

    if (!question) {
      return res.status(404).json({ success: false, error: "Question not found" });
    }

    // Students see the question without referenceAnswer, rubric, teacherNotes
    if (req.user.role === "student") {
      const studentView = question.toJSON();
      delete studentView.referenceAnswer;
      delete studentView.rubric;
      delete studentView.teacherNotes;
      return res.status(200).json({ success: true, question: studentView });
    }

    return res.status(200).json({ success: true, question });
  } catch (error) {
    console.error("Get subjective question error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Server error fetching question",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Update a subjective question
// PUT /subjective-questions/:id
// ─────────────────────────────────────────────────────────────────────────────
export const updateSubjectiveQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: "Invalid question ID" });
    }

    const question = await DescriptiveQuestion.findById(id);

    if (!question) {
      return res.status(404).json({ success: false, error: "Question not found" });
    }

    if (question.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: "Not authorized" });
    }

    const allowedFields = [
      "title",
      "description",
      "instructions",
      "maxMarks",
      "wordLimit",
      "minWords",
      "referenceAnswer",
      "rubric",
      "teacherNotes",
      "tags",
      "difficulty",
      "category",
      "categoryId",
      "isActive",
    ];

    const updateData = {};
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updateData[field] = req.body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, error: "No valid fields provided" });
    }

    const updated = await DescriptiveQuestion.findByIdAndUpdate(
      id,
      { ...updateData },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Subjective question updated successfully",
      question: updated,
    });
  } catch (error) {
    console.error("Update subjective question error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Server error updating question",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Delete a subjective question
// DELETE /subjective-questions/:id
// ─────────────────────────────────────────────────────────────────────────────
export const deleteSubjectiveQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: "Invalid question ID" });
    }

    const question = await DescriptiveQuestion.findById(id);

    if (!question) {
      return res.status(404).json({ success: false, error: "Question not found" });
    }

    if (question.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: "Not authorized" });
    }

    await DescriptiveQuestion.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Subjective question deleted successfully",
    });
  } catch (error) {
    console.error("Delete subjective question error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Server error deleting question",
    });
  }
};
