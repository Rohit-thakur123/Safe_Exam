import express from 'express';
import {
    createCodingQuestion,
    getCodingQuestions,
    getCodingQuestionById,
    updateCodingQuestion,
    deleteCodingQuestion,
    getCodingQuestionTestCases
} from '../controllers/codingQuestionController.js';
import {
    createTestCase,
    updateTestCase,
    deleteTestCase,
    reorderTestCases
} from '../controllers/testCaseController.js';
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/', authenticateToken, authorizeRole(['teacher', 'admin']), createCodingQuestion);
router.get('/', authenticateToken, getCodingQuestions);
router.get('/all', authenticateToken, getCodingQuestions);
router.get('/:id', authenticateToken, getCodingQuestionById);
router.put('/:id', authenticateToken, authorizeRole(['teacher', 'admin']), updateCodingQuestion);
router.delete('/:id', authenticateToken, authorizeRole(['teacher', 'admin']), deleteCodingQuestion);

router.get('/:id/testcases', authenticateToken, getCodingQuestionTestCases);
router.post('/:codingQuestionId/testcases', authenticateToken, authorizeRole(['teacher', 'admin']), createTestCase);
router.put('/:codingQuestionId/testcases/:testCaseId', authenticateToken, authorizeRole(['teacher', 'admin']), updateTestCase);
router.delete('/:codingQuestionId/testcases/:testCaseId', authenticateToken, authorizeRole(['teacher', 'admin']), deleteTestCase);
router.put('/:codingQuestionId/testcases/reorder', authenticateToken, authorizeRole(['teacher', 'admin']), reorderTestCases);

export default router;
