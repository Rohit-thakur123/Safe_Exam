import express from 'express';
import {
    createExam,
    getAllExams,
    getExamById,
    getExamsByTeacher,
    updateExam,
    deleteExam,
    toggleExamStatus,
    assignStudentsToExam,
    getAssignedStudents,
    getAllStudents,
    duplicateExam,
    getAnalytics
} from '../controllers/examController.js';
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

// ─── Static routes MUST come before parameterised routes ───────────────────
// These would be swallowed by /:id or /:examId if registered after them.

// Teacher-only static routes
router.get('/analytics', authenticateToken, authorizeRole(['teacher']), getAnalytics);
router.get('/students/all', authenticateToken, authorizeRole(['teacher']), getAllStudents);
router.get('/teacher/:teacherId', authenticateToken, authorizeRole(['teacher']), getExamsByTeacher);

// Both-roles static routes
router.get('/all', authenticateToken, getAllExams);

// ─── Write routes (no ordering conflict with GET /:id) ─────────────────────
router.post('/new', authenticateToken, authorizeRole(['teacher']), createExam);

// ─── Parameterised routes ──────────────────────────────────────────────────
router.post('/:id/duplicate', authenticateToken, authorizeRole(['teacher']), duplicateExam);
router.put('/:id', authenticateToken, authorizeRole(['teacher']), updateExam);
router.delete('/:id', authenticateToken, authorizeRole(['teacher']), deleteExam);
router.patch('/:id/toggle-status', authenticateToken, authorizeRole(['teacher']), toggleExamStatus);
router.post('/:examId/assign-students', authenticateToken, authorizeRole(['teacher']), assignStudentsToExam);
router.get('/:examId/assigned-students', authenticateToken, authorizeRole(['teacher']), getAssignedStudents);

// ─── Catch-all param route — always last ──────────────────────────────────
router.get('/:id', authenticateToken, getExamById);

export default router;