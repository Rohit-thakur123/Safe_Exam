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

        if (req.user.role !== 'admin' && question.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, error: 'Can only manage your own coding questions' });
        }

        const errors = validateTestCasePayload(req.body);
        if (errors.length > 0) {
            return res.status(400).json({ success: false, error: errors[0] });
        }

        const visibleCount = await TestCase.countDocuments({ codingQuestionId, isHidden: false });
        const hiddenCount = await TestCase.countDocuments({ codingQuestionId, isHidden: true });
        if (!req.body.isHidden && visibleCount >= 10) {
            return res.status(400).json({ success: false, error: 'Maximum visible test cases reached' });
        }
        if (req.body.isHidden && hiddenCount >= 10) {
            return res.status(400).json({ success: false, error: 'Maximum hidden test cases reached' });
        }

        const order = await TestCase.countDocuments({ codingQuestionId });
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
        if (req.user.role !== 'admin' && question.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, error: 'Can only manage your own coding questions' });
        }

        const testCase = await TestCase.findById(testCaseId);
        if (!testCase) {
            return res.status(404).json({ success: false, error: 'Test case not found' });
        }

        const errors = validateTestCasePayload({ ...testCase.toObject(), ...req.body });
        if (errors.length > 0) {
            return res.status(400).json({ success: false, error: errors[0] });
        }

        const updated = await TestCase.findByIdAndUpdate(testCaseId, { ...req.body, updatedAt: Date.now() }, { new: true, runValidators: true });
        res.status(200).json({ success: true, message: 'Test case updated successfully', testCase: updated });
    } catch (error) {
        console.error('Update test case error:', error);
        res.status(500).json({ success: false, error: error.message || 'Server error updating test case' });
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
        if (req.user.role !== 'admin' && question.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, error: 'Can only manage your own coding questions' });
        }

        await TestCase.findByIdAndDelete(testCaseId);
        res.status(200).json({ success: true, message: 'Test case deleted successfully' });
    } catch (error) {
        console.error('Delete test case error:', error);
        res.status(500).json({ success: false, error: error.message || 'Server error deleting test case' });
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

        const question = await CodingQuestion.findById(codingQuestionId);
        if (!question) {
            return res.status(404).json({ success: false, error: 'Coding question not found' });
        }
        if (req.user.role !== 'admin' && question.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, error: 'Can only manage your own coding questions' });
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
