import mongoose from 'mongoose';
import CodingQuestion from '../models/exam/codingQuestion.js';
import TestCase from '../models/exam/testCase.js';
import Exam from '../models/exam/exam.js';
import ExamAttempt from '../models/exam/examAttempt.js';

const getAllowedFilters = (req) => {
    const filters = { isActive: true };
    const { difficulty, createdBy, search, language } = req.query;

    if (difficulty && ['Easy', 'Medium', 'Hard'].includes(difficulty)) filters.difficulty = difficulty;
    if (createdBy && mongoose.Types.ObjectId.isValid(createdBy)) filters.createdBy = createdBy;
    if (language && ['Python', 'Java', 'JavaScript', 'C', 'C++'].includes(language)) {
        filters.supportedLanguages = language;
    }
    if (search) {
        const safeSearch = String(search).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        filters.$or = [
            { title: { $regex: safeSearch, $options: 'i' } },
            { description: { $regex: safeSearch, $options: 'i' } },
            { explanation: { $regex: safeSearch, $options: 'i' } }
        ];
    }

    return filters;
};

export const createCodingQuestion = async (req, res) => {
    try {
        const question = new CodingQuestion({
            ...req.body,
            createdBy: req.user._id
        });

        const saved = await question.save();

        res.status(201).json({
            success: true,
            message: 'Coding question created successfully',
            question: saved
        });
    } catch (error) {
        console.error('Create coding question error:', error);
        res.status(500).json({ success: false, error: error.message || 'Server error creating coding question' });
    }
};

export const getCodingQuestions = async (req, res) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
        const skip = (page - 1) * limit;
        const filters = getAllowedFilters(req);

        const [questions, total] = await Promise.all([
            CodingQuestion.find(filters)
                .populate('createdBy', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            CodingQuestion.countDocuments(filters)
        ]);

        res.status(200).json({
            success: true,
            count: questions.length,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            data: questions
        });
    } catch (error) {
        console.error('Get coding questions error:', error);
        res.status(500).json({ success: false, error: error.message || 'Server error fetching coding questions' });
    }
};

export const getCodingQuestionById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, error: 'Invalid coding question ID' });
        }

        const question = await CodingQuestion.findById(id).populate('createdBy', 'name email');
        if (!question) {
            return res.status(404).json({ success: false, error: 'Coding question not found' });
        }

        res.status(200).json({ success: true, question });
    } catch (error) {
        console.error('Get coding question error:', error);
        res.status(500).json({ success: false, error: error.message || 'Server error fetching coding question' });
    }
};

export const updateCodingQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, error: 'Invalid coding question ID' });
        }

        const question = await CodingQuestion.findById(id);
        if (!question) {
            return res.status(404).json({ success: false, error: 'Coding question not found' });
        }

        if (req.user.role !== 'admin' && question.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, error: 'Can only edit your own coding questions' });
        }

        const updateData = {
            ...req.body,
            updatedAt: Date.now()
        };

        const updated = await CodingQuestion.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

        res.status(200).json({ success: true, message: 'Coding question updated successfully', question: updated });
    } catch (error) {
        console.error('Update coding question error:', error);
        res.status(500).json({ success: false, error: error.message || 'Server error updating coding question' });
    }
};

export const deleteCodingQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, error: 'Invalid coding question ID' });
        }

        const question = await CodingQuestion.findById(id);
        if (!question) {
            return res.status(404).json({ success: false, error: 'Coding question not found' });
        }

        if (req.user.role !== 'admin' && question.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, error: 'Can only delete your own coding questions' });
        }

        const referencedExams = await Exam.find({ codingQuestions: id }).select('_id');
        const referencedExamIds = referencedExams.map(exam => exam._id);
        const hasAttempts = referencedExamIds.length > 0 &&
            await ExamAttempt.exists({ examId: { $in: referencedExamIds } });

        if (hasAttempts) {
            question.isActive = false;
            await question.save();
            return res.status(200).json({
                success: true,
                message: 'Coding question archived because it is referenced by an exam attempt'
            });
        }

        await Exam.updateMany({ codingQuestions: id }, { $pull: { codingQuestions: id } });
        await Exam.updateMany(
            { _id: { $in: referencedExamIds }, questions: { $size: 0 }, codingQuestions: { $size: 0 } },
            { $set: { isActive: false } }
        );
        await TestCase.deleteMany({ codingQuestionId: id });
        await CodingQuestion.findByIdAndDelete(id);

        res.status(200).json({ success: true, message: 'Coding question deleted successfully' });
    } catch (error) {
        console.error('Delete coding question error:', error);
        res.status(500).json({ success: false, error: error.message || 'Server error deleting coding question' });
    }
};

export const getCodingQuestionTestCases = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, error: 'Invalid coding question ID' });
        }

        const question = await CodingQuestion.findById(id);
        if (!question) {
            return res.status(404).json({ success: false, error: 'Coding question not found' });
        }

        const isStudent = req.user.role === 'student';
        const filters = { codingQuestionId: id };
        if (isStudent) filters.isHidden = false;

        const query = TestCase.find(filters).sort({ order: 1, createdAt: 1 });
        if (isStudent) {
            query.select('input expectedOutput order -_id');
        }
        const testCases = await query.lean();
        res.status(200).json({ success: true, data: testCases });
    } catch (error) {
        console.error('Get coding question test cases error:', error);
        res.status(500).json({ success: false, error: error.message || 'Server error fetching test cases' });
    }
};
