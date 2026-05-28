import Question from '../models/exam/question.js';
import Exam from '../models/exam/exam.js';
import Category from '../models/exam/category.js';
import mongoose from 'mongoose';

const resolveCategory = async ({ categoryId, category }) => {
    if (categoryId) {
        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            throw new Error('Invalid category ID');
        }

        const existingCategory = await Category.findById(categoryId);
        if (!existingCategory) {
            throw new Error('Category not found');
        }

        return existingCategory;
    }

    const categoryName = category?.trim() || 'General';
    const existingCategory = await Category.findOne({
        name: { $regex: `^${categoryName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }
    });

    if (existingCategory) {
        return existingCategory;
    }

    return Category.create({ name: categoryName });
};

// Create new question
export const createQuestion = async (req, res) => {
    try {
        console.log("=== DEBUG ===");
        console.log("req.user:", JSON.stringify(req.user));
        console.log("categoryId:", req.body.categoryId, "| type:", typeof req.body.categoryId);
        console.log("category:", req.body.category);
        console.log("=============");
    
        const { question, options, answer, explanation, difficulty, category, categoryId } = req.body;

        if (!question?.trim() || !Array.isArray(options) || !answer?.trim() || !difficulty) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields"
            });
        }

        const normalizedOptions = options.map(option => option.trim()).filter(Boolean);

        if (normalizedOptions.length !== 4) {
            return res.status(400).json({
                success: false,
                error: "Must provide exactly 4 options"
            });
        }

        if (!normalizedOptions.includes(answer.trim())) {
            return res.status(400).json({
                success: false,
                error: "Answer must be one of the provided options"
            });
        }
        // 🔥 FIX: validate ObjectId
        let validCategoryId = null;



        if (categoryId && categoryId !== "") {
            if (mongoose.Types.ObjectId.isValid(categoryId)) {
                validCategoryId = categoryId;
            }
        }

        const resolvedCategory = await resolveCategory({ 
            categoryId: validCategoryId, 
            category 
        });

        const newQuestion = new Question({
            question: question.trim(),
            options: normalizedOptions,
            answer: answer.trim(),
            explanation: explanation?.trim(),
            difficulty,
            category: resolvedCategory.name,
            categoryId: new mongoose.Types.ObjectId(resolvedCategory._id),
            createdBy: req.user._id
        });
        if (!req.user || !req.user._id) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated"
            });
        }

        const savedQuestion = await newQuestion.save();

       res.status(201).json({
            success: true,
            message: "Question created successfully",
            id: savedQuestion._id.toString(),
            question: {
                _id: savedQuestion._id.toString(),
                question: savedQuestion.question,
                options: savedQuestion.options,
                answer: savedQuestion.answer,
                explanation: savedQuestion.explanation || null,
                difficulty: savedQuestion.difficulty,
                category: savedQuestion.category,
                categoryId: savedQuestion.categoryId?.toString() || null,
                createdBy: savedQuestion.createdBy?.toString() || null,
                isActive: savedQuestion.isActive,
                createdAt: savedQuestion.createdAt,
                updatedAt: savedQuestion.updatedAt,
            }
        });
    } catch (error) {
        console.error("Error creating question:", error);
        const status = ['Invalid category ID', 'Category not found'].includes(error.message) ? 400 : 500;
        res.status(status).json({
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
            .populate('categoryId', 'name')
            .sort({ createdAt: -1 });

        // Transform to JSON (will use model's toJSON transform automatically)
        const questionsData = questions.map(q => {
            const qObj = q.toJSON();
            return {
                ...qObj,
                createdBy: q.createdBy ? q.createdBy._id.toString() : null,
                category: q.categoryId?.name || qObj.category || 'General'
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

        const question = await Question.findById(id)
            .populate('createdBy', 'name email')
            .populate('categoryId', 'name');

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
        .populate('categoryId', 'name')
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

        const allowedFields = ['question', 'options', 'answer', 'explanation', 'difficulty', 'category', 'categoryId'];
        const updateData = {};
        for (const field of allowedFields) {
            if (Object.prototype.hasOwnProperty.call(req.body, field)) {
                updateData[field] = req.body[field];
            }
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No valid question fields provided'
            });
        }

        if (updateData.question !== undefined && !updateData.question?.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Question text is required'
            });
        }

        if (updateData.options) {
            updateData.options = updateData.options.map(option => option.trim()).filter(Boolean);
        }

        const nextOptions = updateData.options || question.options;
        const nextAnswer = updateData.answer?.trim() || question.answer;

        if (nextOptions.length !== 4) {
            return res.status(400).json({
                success: false,
                error: "Must provide exactly 4 options"
            });
        }

        if (!nextOptions.includes(nextAnswer)) {
            return res.status(400).json({
                success: false,
                error: "Answer must be one of the provided options"
            });
        }

        if (updateData.question !== undefined) updateData.question = updateData.question.trim();
        if (updateData.answer !== undefined) updateData.answer = updateData.answer.trim();
        if (updateData.explanation !== undefined) updateData.explanation = updateData.explanation?.trim();

        if (updateData.categoryId || updateData.category) {
            const resolvedCategory = await resolveCategory({
                categoryId: updateData.categoryId,
                category: updateData.category
            });
            updateData.category = resolvedCategory.name;
            updateData.categoryId = resolvedCategory._id;
        }

        const updatedQuestion = await Question.findByIdAndUpdate(
            id,
            { ...updateData, updatedAt: Date.now() },
            { new: true, runValidators: true }
        ).populate('categoryId', 'name');

        res.status(200).json({
            success: true,
            message: 'Question updated successfully',
            question: {
                _id: updatedQuestion._id.toString(),
                question: updatedQuestion.question,
                options: updatedQuestion.options,
                answer: updatedQuestion.answer,
                explanation: updatedQuestion.explanation || null,
                difficulty: updatedQuestion.difficulty,
                category: updatedQuestion.category,
                categoryId: updatedQuestion.categoryId?._id?.toString() 
                            || updatedQuestion.categoryId?.toString() 
                            || null,
                createdBy: updatedQuestion.createdBy?.toString() || null,
                isActive: updatedQuestion.isActive,
                createdAt: updatedQuestion.createdAt,
                updatedAt: updatedQuestion.updatedAt,
            }
        });
    } catch (error) {
        console.error("Error updating question:", error);
        const status = ['Invalid category ID', 'Category not found'].includes(error.message) ? 400 : 500;
        res.status(status).json({
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
