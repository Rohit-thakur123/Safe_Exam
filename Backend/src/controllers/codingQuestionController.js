import mongoose from 'mongoose';
import CodingQuestion from '../models/exam/codingQuestion.js';
import TestCase from '../models/exam/testCase.js';

const normalizeSupportedLanguages = (value) => {
    if (!Array.isArray(value)) return [];
    return value
        .map(item => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean);
};

const validateCodingQuestionPayload = (body) => {
    const errors = [];

    if (!body.title || !String(body.title).trim()) errors.push('Title is required');
    if (!body.description || !String(body.description).trim()) errors.push('Description is required');
    if (!body.constraints || !String(body.constraints).trim()) errors.push('Constraints are required');
    if (!body.inputFormat || !String(body.inputFormat).trim()) errors.push('Input format is required');
    if (!body.outputFormat || !String(body.outputFormat).trim()) errors.push('Output format is required');
    if (!body.explanation || !String(body.explanation).trim()) errors.push('Explanation is required');
    if (!body.difficulty) errors.push('Difficulty is required');
    if (!body.marks || Number(body.marks) < 1) errors.push('Marks must be at least 1');
    if (!body.timeLimit || Number(body.timeLimit) < 1) errors.push('Time limit must be at least 1');
    if (!body.memoryLimit || Number(body.memoryLimit) < 1) errors.push('Memory limit must be at least 1');
    if (!body.starterCode || !String(body.starterCode).trim()) errors.push('Starter code is required');

    const supportedLanguages = normalizeSupportedLanguages(body.supportedLanguages);
    if (supportedLanguages.length === 0) errors.push('At least one supported language is required');

    const validDifficulties = ['Easy', 'Medium', 'Hard'];
    if (body.difficulty && !validDifficulties.includes(body.difficulty)) {
        errors.push('Difficulty must be Easy, Medium, or Hard');
    }

    return { errors, supportedLanguages };
};

const getAllowedFilters = (req) => {
    const filters = { isActive: true };
    const { difficulty, createdBy, search, language } = req.query;

    if (difficulty) filters.difficulty = difficulty;
    if (createdBy) filters.createdBy = createdBy;
    if (language) filters.supportedLanguages = { $in: [language] };
    if (search) {
        filters.$or = [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { explanation: { $regex: search, $options: 'i' } }
        ];
    }

    return filters;
};

export const createCodingQuestion = async (req, res) => {
    try {
        const { errors, supportedLanguages } = validateCodingQuestionPayload(req.body);
        if (errors.length > 0) {
            return res.status(400).json({ success: false, error: errors[0] });
        }

        const question = new CodingQuestion({
            ...req.body,
            supportedLanguages,
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

        const { errors, supportedLanguages } = validateCodingQuestionPayload({ ...question.toObject(), ...req.body });
        if (errors.length > 0) {
            return res.status(400).json({ success: false, error: errors[0] });
        }

        const updateData = {
            ...req.body,
            supportedLanguages,
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

        const testCases = await TestCase.find({ codingQuestionId: id }).sort({ order: 1, createdAt: 1 });
        res.status(200).json({ success: true, data: testCases });
    } catch (error) {
        console.error('Get coding question test cases error:', error);
        res.status(500).json({ success: false, error: error.message || 'Server error fetching test cases' });
    }
};
