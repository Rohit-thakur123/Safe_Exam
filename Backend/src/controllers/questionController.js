import Question from '../models/exam/question.js';
import Exam from '../models/exam/exam.js';
import mongoose from 'mongoose';

// Create new question
export const createQuestion = async (req, res) => {
    try {
        const { question, options, answer, explanation, difficulty, category } = req.body;

        if (!question || !options || !answer || !difficulty || !category) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields"
            });
        }

        if (options.length !== 4) {
            return res.status(400).json({
                success: false,
                error: "Must provide exactly 4 options"
            });
        }

        if (!options.includes(answer)) {
            return res.status(400).json({
                success: false,
                error: "Answer must be one of the provided options"
            });
        }

        const newQuestion = new Question({
            question,
            options,
            answer,
            explanation,
            difficulty,
            category,
            createdBy: req.user._id
        });

        const savedQuestion = await newQuestion.save();

        res.status(201).json({
            success: true,
            message: "Question created successfully",
            id: savedQuestion._id,
            question: savedQuestion,
        });
    } catch (error) {
        console.error("Error creating question:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get all questions
export const getAllQuestions = async (req, res) => {
    try {
        const questions = await Question.find({ isActive: true })
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });

        // Transform to JSON (will use model's toJSON transform automatically)
        const questionsData = questions.map(q => {
            const qObj = q.toJSON();
            return {
                ...qObj,
                createdBy: q.createdBy ? q.createdBy._id.toString() : null
            };
        });

        res.status(200).json({
            success: true,
            count: questionsData.length,
            data: questionsData
        });
    } catch (error) {
        console.error("Error fetching questions:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get question by ID
export const getQuestionById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid question ID'
            });
        }

        const question = await Question.findById(id).populate('createdBy', 'name email');

        if (!question) {
            return res.status(404).json({
                success: false,
                error: "Question not found"
            });
        }

        res.status(200).json({
            success: true,
            question
        });
    } catch (error) {
        console.error("Error fetching question:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get questions by teacher
export const getQuestionsByTeacher = async (req, res) => {
    try {
        const { teacherId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(teacherId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid teacher ID'
            });
        }

        const questions = await Question.find({
            createdBy: teacherId,
            isActive: true
        })
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: questions.length,
            questions
        });
    } catch (error) {
        console.error("Error fetching teacher questions:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Update question
export const updateQuestion = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid question ID'
            });
        }

        const question = await Question.findById(id);

        if (!question) {
            return res.status(404).json({
                success: false,
                error: 'Question not found'
            });
        }

        // Check if user owns the question
        if (question.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                error: 'Can only edit your own questions'
            });
        }

        // Validate options and answer if provided
        if (req.body.options && req.body.options.length !== 4) {
            return res.status(400).json({
                success: false,
                error: "Must provide exactly 4 options"
            });
        }

        if (req.body.answer && req.body.options && !req.body.options.includes(req.body.answer)) {
            return res.status(400).json({
                success: false,
                error: "Answer must be one of the provided options"
            });
        }

        const updatedQuestion = await Question.findByIdAndUpdate(
            id,
            { ...req.body, updatedAt: Date.now() },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Question updated successfully',
            question: updatedQuestion
        });
    } catch (error) {
        console.error("Error updating question:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Delete question
export const deleteQuestion = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid question ID'
            });
        }

        const question = await Question.findById(id);

        if (!question) {
            return res.status(404).json({
                success: false,
                error: 'Question not found'
            });
        }

        // Check if user owns the question
        if (question.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                error: 'Can only delete your own questions'
            });
        }

        // Check if question is used in any active exams
        const examWithQuestion = await Exam.findOne({
            questions: id,
            isActive: true
        });

        if (examWithQuestion) {
            return res.status(409).json({
                success: false,
                error: 'Cannot delete question used in active exams'
            });
        }

        // Soft delete by setting isActive to false
        question.isActive = false;
        await question.save();

        res.status(200).json({
            success: true,
            message: 'Question deleted successfully'
        });
    } catch (error) {
        console.error("Error deleting question:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
