import express from 'express';
import { register, login, refreshToken, logout, getProfile } from '../controllers/authController.js';
import { loginLimiter, registrationLimiter } from '../middlewares/rateLimit.middleware.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public routes
router.post('/register', registrationLimiter, register);
router.post('/login', loginLimiter, login);
router.post('/refresh', refreshToken);

// Protected routes
router.post('/logout', authenticateToken, logout);
router.get('/profile', authenticateToken, getProfile);

export default router;
