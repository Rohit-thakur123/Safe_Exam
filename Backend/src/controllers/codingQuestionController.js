import mongoose from 'mongoose';
import CodingQuestion from '../models/exam/codingQuestion.js';
import TestCase from '../models/exam/testCase.js';
import Exam from '../models/exam/exam.js';
import ExamAttempt from '../models/exam/examAttempt.js';

const ALLOWED_LANGUAGES = ['Python', 'Java', 'JavaScript', 'C', 'C++'];

const getAllowedFilters = (req) => {
    const isTeacher = req.user?.role === 'teacher';
    // Teachers see all their own questions; students/public only see active ones
    const filters = isTeacher ? { createdBy: req.user._id } : { isActive: true };

    const { difficulty, search, language, status } = req.query;

    if (difficulty && ['Easy', 'Medium', 'Hard'].includes(difficulty)) filters.difficulty = difficulty;
    if (language && ALLOWED_LANGUAGES.includes(language)) {
        filters.supportedLanguages = language;
    }
    // Status filter for teachers
    if (isTeacher && status === 'active') filters.isActive = true;
    if (isTeacher && status === 'inactive') filters.isActive = false;

    if (search) {
        const safeSearch = String(search).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        filters.$or = [
            { title: { $regex: safeSearch, $options: 'i' } },
            { description: { $regex: safeSearch, $options: 'i' } }
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
        if (error.code === 11000) {
            return res.status(409).json({ success: false, error: 'A coding question with this title already exists' });
        }
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

        // Attach testcase counts
        const questionIds = questions.map(q => q._id);
        const testCaseCounts = await TestCase.aggregate([
            { $match: { codingQuestionId: { $in: questionIds } } },
            { $group: { _id: { qId: '$codingQuestionId', isHidden: '$isHidden' }, count: { $sum: 1 } } }
        ]);

        const countMap = {};
        for (const item of testCaseCounts) {
            const key = item._id.qId.toString();
            if (!countMap[key]) countMap[key] = { visible: 0, hidden: 0 };
            if (item._id.isHidden) countMap[key].hidden = item.count;
            else countMap[key].visible = item.count;
        }

        const data = questions.map(q => {
            const obj = q.toJSON();
            const counts = countMap[q._id.toString()] || { visible: 0, hidden: 0 };
            obj.visibleTestCaseCount = counts.visible;
            obj.hiddenTestCaseCount = counts.hidden;
            return obj;
        });

        res.status(200).json({
            success: true,
            count: data.length,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            data
        });
    } catch (error) {
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

        // Students only see active questions
        if (req.user?.role === 'student' && !question.isActive) {
            return res.status(404).json({ success: false, error: 'Coding question not found' });
        }

        // Attach testcase counts for teacher views
        const [visibleCount, hiddenCount] = await Promise.all([
            TestCase.countDocuments({ codingQuestionId: id, isHidden: false }),
            TestCase.countDocuments({ codingQuestionId: id, isHidden: true })
        ]);

        const obj = question.toJSON();
        obj.visibleTestCaseCount = visibleCount;
        obj.hiddenTestCaseCount = hiddenCount;

        // Also attach visible test cases for student exam view
        if (req.user?.role === 'student') {
            const visibleTestCases = await TestCase.find({ codingQuestionId: id, isHidden: false })
                .sort({ order: 1 })
                .select('input expectedOutput order')
                .lean();
            obj.visibleTestCases = visibleTestCases;
        }

        res.status(200).json({ success: true, question: obj });
    } catch (error) {
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

        if (question.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, error: 'Can only edit your own coding questions' });
        }

        const updated = await CodingQuestion.findByIdAndUpdate(
            id,
            { ...req.body },
            { new: true, runValidators: true }
        );

        res.status(200).json({ success: true, message: 'Coding question updated successfully', question: updated });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ success: false, error: 'A coding question with this title already exists' });
        }
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

        if (question.createdBy.toString() !== req.user._id.toString()) {
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
                message: 'Coding question archived because it is referenced by exam attempts'
            });
        }

        await Exam.updateMany({ codingQuestions: id }, { $pull: { codingQuestions: id } });
        await TestCase.deleteMany({ codingQuestionId: id });
        await CodingQuestion.findByIdAndDelete(id);

        res.status(200).json({ success: true, message: 'Coding question deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message || 'Server error deleting coding question' });
    }
};

export const duplicateCodingQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, error: 'Invalid coding question ID' });
        }

        const source = await CodingQuestion.findById(id);
        if (!source) {
            return res.status(404).json({ success: false, error: 'Coding question not found' });
        }
        if (source.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, error: 'Can only duplicate your own coding questions' });
        }

        const sourceObj = source.toObject();
        delete sourceObj._id;
        delete sourceObj.id;
        delete sourceObj.createdAt;
        delete sourceObj.updatedAt;
        delete sourceObj.__v;

        const duplicate = await CodingQuestion.create({
            ...sourceObj,
            title: `${source.title} (Copy)`,
            isActive: false,
            createdBy: req.user._id
        });

        res.status(201).json({ success: true, message: 'Coding question duplicated successfully', question: duplicate });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message || 'Server error duplicating coding question' });
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

        const isStudent = req.user?.role === 'student';
        const filters = { codingQuestionId: id };
        if (isStudent) filters.isHidden = false;

        const query = TestCase.find(filters).sort({ order: 1, createdAt: 1 });
        if (isStudent) {
            query.select('input expectedOutput order -_id');
        }
        const testCases = await query.lean();
        res.status(200).json({ success: true, data: testCases });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message || 'Server error fetching test cases' });
    }
};
