import express from 'express';
import {
    getExamCodingSubmissions,
    runCodingQuestion,
    submitCodingQuestion
} from '../controllers/codingExecutionController.js';
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware.js';
import { requireSEB } from '../middlewares/seb.middleware.js';

const router = express.Router();

router.post('/:codingQuestionId/run', requireSEB, authenticateToken, authorizeRole(['student']), runCodingQuestion);
router.post('/:codingQuestionId/submit', requireSEB, authenticateToken, authorizeRole(['student']), submitCodingQuestion);
router.get('/submissions/exam/:examId', authenticateToken, authorizeRole(['teacher']), getExamCodingSubmissions);

export default router;
