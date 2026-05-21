import express from 'express';
import { sessionManager } from '../config/sessionStore.js';
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Get current session status
router.get('/status', authenticateToken, async (req, res) => {
    try {
        const userId = req.user._id.toString();
        const session = await sessionManager.getActiveSession(userId);

        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'No active session found'
            });
        }

        res.status(200).json({
            success: true,
            session: {
                loginTime: session.loginTime,
                lastActivity: session.lastActivity,
                ipAddress: session.ipAddress,
                role: session.role
            }
        });
    } catch (error) {
        console.error('Session status error:', error);
        res.status(500).json({
            success: false,
            error: 'Error fetching session status'
        });
    }
});

// Force logout another session (if logged in from different device)
router.post('/force-logout', authenticateToken, async (req, res) => {
    try {
        const userId = req.user._id.toString();
        await sessionManager.removeSession(userId);

        res.status(200).json({
            success: true,
            message: 'Session terminated successfully'
        });
    } catch (error) {
        console.error('Force logout error:', error);
        res.status(500).json({
            success: false,
            error: 'Error terminating session'
        });
    }
});

// Get all active sessions (Admin only - for monitoring)
router.get('/all', authenticateToken, authorizeRole(['teacher']), async (req, res) => {
    try {
        const sessions = await sessionManager.getAllActiveSessions();

        res.status(200).json({
            success: true,
            count: sessions.length,
            sessions: sessions.map(s => ({
                userId: s.userId,
                email: s.email,
                role: s.role,
                loginTime: s.loginTime,
                lastActivity: s.lastActivity,
                ipAddress: s.ipAddress
            }))
        });
    } catch (error) {
        console.error('Get all sessions error:', error);
        res.status(500).json({
            success: false,
            error: 'Error fetching sessions'
        });
    }
});

export default router;
