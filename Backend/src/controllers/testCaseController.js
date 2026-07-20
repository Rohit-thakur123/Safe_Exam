import mongoose from 'mongoose';
import TestCase from '../models/exam/testCase.js';
import CodingQuestion from '../models/exam/codingQuestion.js';

const validateTestCasePayload = (body) => {
    const errors = [];
    if (!body.input || !String(body.input).trim()) errors.push('Input is required');
    if (!body.expectedOutput || !String(body.expectedOutput).trim()) errors.push('Expected output is required');
    if (typeof body.isHidden !== 'boolean') errors.push('Visibility flag is required');
    return errors;
};

const ensureMinimumTestCases = async (codingQuestionId, testCase, nextIsHidden = null) => {
    const [visibleCount, hiddenCount] = await Promise.all([
        TestCase.countDocuments({ codingQuestionId, isHidden: false }),
        TestCase.countDocuments({ codingQuestionId, isHidden: true })
    ]);
    const removingVisible = !testCase.isHidden && (nextIsHidden === true || nextIsHidden === null);
    const removingHidden = testCase.isHidden && (nextIsHidden === false || nextIsHidden === null);
    if (removingVisible && visibleCount <= 1) {
        const error = new Error('Each coding question must retain at least 1 visible test case');
        error.status = 400;
        throw error;
    }
    if (removingHidden && hiddenCount <= 1) {
        const error = new Error('Each coding question must retain at least 1 hidden test case');
        error.status = 400;
        throw error;
    }
};

export const createTestCase = async (req, res) => {
    try {
        const { codingQuestionId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(codingQuestionId)) {
            return res.status(400).json({ success: false, error: 'Invalid coding question ID' });
        }

        const question = await CodingQuestion.findById(codingQuestionId);
        if (!question) {
            return res.status(404).json({ success: false, error: 'Coding question not found' });
        }

        if (question.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, error: 'Can only manage your own coding questions' });
        }

        const errors = validateTestCasePayload(req.body);
        if (errors.length > 0) {
            return res.status(400).json({ success: false, error: errors[0] });
        }

        const lastTestCase = await TestCase.findOne({ codingQuestionId }).sort({ order: -1 }).select('order');
        const order = lastTestCase ? lastTestCase.order + 1 : 0;
        const created = await TestCase.create({
            ...req.body,
            codingQuestionId,
            order,
            createdBy: req.user._id
        });

        res.status(201).json({ success: true, message: 'Test case created successfully', testCase: created });
    } catch (error) {
        console.error('Create test case error:', error);
        res.status(500).json({ success: false, error: error.message || 'Server error creating test case' });
    }
};

export const updateTestCase = async (req, res) => {
    try {
        const { codingQuestionId, testCaseId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(codingQuestionId) || !mongoose.Types.ObjectId.isValid(testCaseId)) {
            return res.status(400).json({ success: false, error: 'Invalid IDs' });
        }

        const question = await CodingQuestion.findById(codingQuestionId);
        if (!question) {
            return res.status(404).json({ success: false, error: 'Coding question not found' });
        }
        if (question.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, error: 'Can only manage your own coding questions' });
        }

        const testCase = await TestCase.findOne({ _id: testCaseId, codingQuestionId });
        if (!testCase) {
            return res.status(404).json({ success: false, error: 'Test case not found for this coding question' });
        }

        const errors = validateTestCasePayload({ ...testCase.toObject(), ...req.body });
        if (errors.length > 0) {
            return res.status(400).json({ success: false, error: errors[0] });
        }

        if (testCase.isHidden !== req.body.isHidden) {
            await ensureMinimumTestCases(codingQuestionId, testCase, req.body.isHidden);
        }
        const updated = await TestCase.findOneAndUpdate(
            { _id: testCaseId, codingQuestionId },
            { ...req.body, updatedAt: Date.now() },
            { new: true, runValidators: true }
        );
        res.status(200).json({ success: true, message: 'Test case updated successfully', testCase: updated });
    } catch (error) {
        console.error('Update test case error:', error);
        res.status(error.status || 500).json({ success: false, error: error.message || 'Server error updating test case' });
    }
};

export const deleteTestCase = async (req, res) => {
    try {
        const { codingQuestionId, testCaseId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(codingQuestionId) || !mongoose.Types.ObjectId.isValid(testCaseId)) {
            return res.status(400).json({ success: false, error: 'Invalid IDs' });
        }

        const question = await CodingQuestion.findById(codingQuestionId);
        if (!question) {
            return res.status(404).json({ success: false, error: 'Coding question not found' });
        }
        if (question.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, error: 'Can only manage your own coding questions' });
        }

        const testCase = await TestCase.findOne({ _id: testCaseId, codingQuestionId });
        if (!testCase) {
            return res.status(404).json({ success: false, error: 'Test case not found for this coding question' });
        }
        await ensureMinimumTestCases(codingQuestionId, testCase);
        await testCase.deleteOne();
        await TestCase.updateMany(
            { codingQuestionId, order: { $gt: testCase.order } },
            { $inc: { order: -1 } }
        );
        res.status(200).json({ success: true, message: 'Test case deleted successfully' });
    } catch (error) {
        console.error('Delete test case error:', error);
        res.status(error.status || 500).json({ success: false, error: error.message || 'Server error deleting test case' });
    }
};

export const reorderTestCases = async (req, res) => {
    try {
        const { codingQuestionId } = req.params;
        const { orderedIds } = req.body;
        if (!mongoose.Types.ObjectId.isValid(codingQuestionId)) {
            return res.status(400).json({ success: false, error: 'Invalid coding question ID' });
        }
        if (!Array.isArray(orderedIds)) {
            return res.status(400).json({ success: false, error: 'orderedIds array is required' });
        }

        if (orderedIds.some(id => !mongoose.Types.ObjectId.isValid(id))) {
            return res.status(400).json({ success: false, error: 'orderedIds contains an invalid test case ID' });
        }

        const question = await CodingQuestion.findById(codingQuestionId);
        if (!question) {
            return res.status(404).json({ success: false, error: 'Coding question not found' });
        }
        if (question.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, error: 'Can only manage your own coding questions' });
        }

        const existingIds = (await TestCase.find({ codingQuestionId }).select('_id'))
            .map(item => item._id.toString())
            .sort();
        const requestedIds = [...new Set(orderedIds.map(String))].sort();
        if (existingIds.length !== requestedIds.length || existingIds.some((id, index) => id !== requestedIds[index])) {
            return res.status(400).json({ success: false, error: 'orderedIds must contain every test case exactly once' });
        }

        const updates = orderedIds.map((id, index) => ({
            updateOne: {
                filter: { _id: id, codingQuestionId },
                update: { order: index }
            }
        }));

        await TestCase.bulkWrite(updates);
        res.status(200).json({ success: true, message: 'Test cases reordered successfully' });
    } catch (error) {
        console.error('Reorder test cases error:', error);
        res.status(500).json({ success: false, error: error.message || 'Server error reordering test cases' });
    }
};

export const duplicateTestCase = async (req, res) => {
    try {
        const { codingQuestionId, testCaseId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(codingQuestionId) || !mongoose.Types.ObjectId.isValid(testCaseId)) {
            return res.status(400).json({ success: false, error: 'Invalid IDs' });
        }
        const question = await CodingQuestion.findById(codingQuestionId);
        if (!question) {
            return res.status(404).json({ success: false, error: 'Coding question not found' });
        }
        if (question.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, error: 'Can only manage your own coding questions' });
        }
        const source = await TestCase.findOne({ _id: testCaseId, codingQuestionId });
        if (!source) {
            return res.status(404).json({ success: false, error: 'Test case not found for this coding question' });
        }
        await TestCase.updateMany(
            { codingQuestionId, order: { $gt: source.order } },
            { $inc: { order: 1 } }
        );
        const duplicate = await TestCase.create({
            codingQuestionId,
            input: source.input,
            expectedOutput: source.expectedOutput,
            isHidden: source.isHidden,
            order: source.order + 1,
            createdBy: req.user._id
        });
        res.status(201).json({ success: true, message: 'Test case duplicated successfully', testCase: duplicate });
    } catch (error) {
        console.error('Duplicate test case error:', error);
        res.status(error.status || 500).json({ success: false, error: error.message || 'Server error duplicating test case' });
    }
};
