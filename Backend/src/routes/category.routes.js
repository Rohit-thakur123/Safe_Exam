import express from 'express';
import { getCategories, createCategory } from '../controllers/categoryController.js';
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', authenticateToken, getCategories);
router.post('/', authenticateToken, authorizeRole(['teacher']), createCategory);

export default router;
