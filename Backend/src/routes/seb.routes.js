import express from 'express';
import {
    verifyExamLink,
    generateExamLinks,
    getSEBSessionToken
} from '../controllers/sebController.js';
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * PUBLIC ENDPOINT - No auth required
 * Verify exam link and check if student can attempt exam
 * This is called by the primary frontend before showing "Start Exam" button
 */
router.post('/verify-exam-link', verifyExamLink);

/**
 * TEACHER ONLY - Generate exam access links for students
 * Used when teacher assigns exam to students
 */
router.post('/generate-exam-links', authenticateToken, authorizeRole(['teacher']), generateExamLinks);

/**
 * PUBLIC ENDPOINT - Get SEB session token after verification
 * Called by primary frontend after verification succeeds
 */
router.post('/get-session-token', getSEBSessionToken);

export default router;

