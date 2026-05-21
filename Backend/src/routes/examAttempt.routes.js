import express from 'express';
import {
    startExamAttempt,
    submitExamAttempt,
    getAttemptById,
    getStudentAttempts,
    getExamAttempts,
    getMyAttempts,
    getActiveAttemptForExam
} from '../controllers/examAttemptController.js';
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Student routes
router.post('/start', authenticateToken, authorizeRole(['student']), startExamAttempt);
router.post('/submit', authenticateToken, authorizeRole(['student']), submitExamAttempt);
router.get('/my-attempts', authenticateToken, authorizeRole(['student']), getMyAttempts);
router.get('/student/:studentId', authenticateToken, authorizeRole(['student']), getStudentAttempts);
router.get('/active/:examId', authenticateToken, authorizeRole(['student']), getActiveAttemptForExam);

// Teacher routes
router.get('/exam/:examId', authenticateToken, authorizeRole(['teacher']), getExamAttempts);

// Both roles
router.get('/:id', authenticateToken, getAttemptById);
router.get('/:attemptId/result', authenticateToken, getAttemptById);

export default router;
