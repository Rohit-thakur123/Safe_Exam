import express from 'express';
import {
    createQuestion,
    getAllQuestions,
    getQuestionById,
    getQuestionsByTeacher,
    updateQuestion,
    deleteQuestion
} from '../controllers/questionController.js';
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Teacher only routes
router.post('/new', authenticateToken, authorizeRole(['teacher']), createQuestion);
router.post('/', authenticateToken, authorizeRole(['teacher']), createQuestion);
router.put('/:id', authenticateToken, authorizeRole(['teacher']), updateQuestion);
router.delete('/:id', authenticateToken, authorizeRole(['teacher']), deleteQuestion);
router.get('/teacher/:teacherId', authenticateToken, authorizeRole(['teacher']), getQuestionsByTeacher);

// Both roles (authenticated)
router.get('/', authenticateToken, getAllQuestions);
router.get('/all', authenticateToken, getAllQuestions);
router.get('/:id', authenticateToken, getQuestionById);

export default router;
