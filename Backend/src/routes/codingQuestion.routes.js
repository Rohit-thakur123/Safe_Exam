import express from 'express';
import {
    createCodingQuestion,
    getCodingQuestions,
    getCodingQuestionById,
    updateCodingQuestion,
    deleteCodingQuestion,
    duplicateCodingQuestion,
    getCodingQuestionTestCases
} from '../controllers/codingQuestionController.js';
import {
    createTestCase,
    updateTestCase,
    deleteTestCase,
    duplicateTestCase,
    reorderTestCases
} from '../controllers/testCaseController.js';
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware.js';
import { validateCodingQuestion, validateTestCase } from '../middlewares/codingQuestion.validation.js';

const router = express.Router();

// Coding question CRUD
router.post('/', authenticateToken, authorizeRole(['teacher', 'admin']), validateCodingQuestion, createCodingQuestion);
router.get('/', authenticateToken, getCodingQuestions);
router.get('/all', authenticateToken, getCodingQuestions);
router.get('/:id', authenticateToken, getCodingQuestionById);
router.put('/:id', authenticateToken, authorizeRole(['teacher', 'admin']), validateCodingQuestion, updateCodingQuestion);
router.delete('/:id', authenticateToken, authorizeRole(['teacher', 'admin']), deleteCodingQuestion);
router.post('/:id/duplicate', authenticateToken, authorizeRole(['teacher', 'admin']), duplicateCodingQuestion);

// Test cases
router.get('/:id/testcases', authenticateToken, getCodingQuestionTestCases);
router.post('/:codingQuestionId/testcases', authenticateToken, authorizeRole(['teacher', 'admin']), validateTestCase, createTestCase);
router.put('/:codingQuestionId/testcases/reorder', authenticateToken, authorizeRole(['teacher', 'admin']), reorderTestCases);
router.put('/:codingQuestionId/testcases/:testCaseId', authenticateToken, authorizeRole(['teacher', 'admin']), validateTestCase, updateTestCase);
router.delete('/:codingQuestionId/testcases/:testCaseId', authenticateToken, authorizeRole(['teacher', 'admin']), deleteTestCase);
router.post('/:codingQuestionId/testcases/:testCaseId/duplicate', authenticateToken, authorizeRole(['teacher', 'admin']), duplicateTestCase);

export default router;
