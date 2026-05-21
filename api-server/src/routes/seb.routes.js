import express from 'express';
import { verifyExamLink, generateExamLinks, generateSEBConfig } from '../controllers/sebController.js';
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * POST /api/seb/verify-exam-link
 * Verify exam link from email (no authentication required - token in body)
 * Called by: Primary Frontend, API Server
 */
router.post('/verify-exam-link', verifyExamLink);

/**
 * POST /api/seb/generate-exam-links
 * Generate unique exam links for all assigned students (Teacher only)
 * Called by: Primary Frontend (Teacher Dashboard)
 */
router.post('/generate-exam-links', authenticateToken, authorizeRole(['teacher']), generateExamLinks);

/**
 * POST /api/seb/generate-seb-config
 * Generate SEB configuration file for a student to launch Safe Exam Browser
 * Called by: Primary Frontend (Student clicks "Start Exam")
 */
router.post('/generate-seb-config', generateSEBConfig);

export default router;
