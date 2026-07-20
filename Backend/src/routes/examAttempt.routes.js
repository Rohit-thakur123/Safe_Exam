import express from 'express';
import {
    startExamAttempt,
    submitExamAttempt,
    saveAnswers,
    heartbeat,
    getAttemptById,
    getStudentAttempts,
    getExamAttempts,
    getMyAttempts,
    getActiveAttemptForExam,
    reportViolation,
    getViolationLog
} from '../controllers/examAttemptController.js';
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware.js';
import { requireSEB } from '../middlewares/seb.middleware.js';

const router = express.Router();

// Student routes
router.post('/start', requireSEB, authenticateToken, authorizeRole(['student']), startExamAttempt);
router.post('/submit', requireSEB, authenticateToken, authorizeRole(['student']), submitExamAttempt);
router.get('/my-attempts', authenticateToken, authorizeRole(['student']), getMyAttempts);
router.get('/student/:studentId', authenticateToken, authorizeRole(['student']), getStudentAttempts);
router.get('/active/:examId', authenticateToken, authorizeRole(['student']), getActiveAttemptForExam);

// SEB frontend aliases — same controllers, paths matching what examService.ts calls.
router.post('/start-seb', requireSEB, authenticateToken, authorizeRole(['student']), startExamAttempt);
router.post('/submit-seb', requireSEB, authenticateToken, authorizeRole(['student']), submitExamAttempt);
router.patch('/save-answers', requireSEB, authenticateToken, authorizeRole(['student']), saveAnswers);
router.post('/heartbeat', requireSEB, authenticateToken, authorizeRole(['student']), heartbeat);

// Phase 2: Violation reporting (student -> backend)
router.post('/report-violation', requireSEB, authenticateToken, authorizeRole(['student']), reportViolation);

// Teacher routes
router.get('/exam/:examId', authenticateToken, authorizeRole(['teacher']), getExamAttempts);
// Phase 2: Teacher violation log
router.get('/exam/:examId/violations', authenticateToken, authorizeRole(['teacher']), getViolationLog);

// Both roles
router.get('/:id', requireSEB, authenticateToken, getAttemptById);
router.get('/:attemptId/result', requireSEB, authenticateToken, getAttemptById);

export default router;
