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
    getAllStudents
} from '../controllers/examController.js';
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Teacher only routes
router.post('/new', authenticateToken, authorizeRole(['teacher']), createExam);
router.put('/:id', authenticateToken, authorizeRole(['teacher']), updateExam);
router.delete('/:id', authenticateToken, authorizeRole(['teacher']), deleteExam);
router.patch('/:id/toggle-status', authenticateToken, authorizeRole(['teacher']), toggleExamStatus);
router.get('/teacher/:teacherId', authenticateToken, authorizeRole(['teacher']), getExamsByTeacher);

// Student assignment endpoints (Teacher only) - Fixed to match frontend expectations
router.get('/students/all', authenticateToken, authorizeRole(['teacher']), getAllStudents);
router.post('/:examId/assign-students', authenticateToken, authorizeRole(['teacher']), assignStudentsToExam);
router.get('/:examId/assigned-students', authenticateToken, authorizeRole(['teacher']), getAssignedStudents);

// Both roles (authenticated)
router.get('/all', authenticateToken, getAllExams);
router.get('/:id', authenticateToken, getExamById);

export default router;