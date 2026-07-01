import User from '../models/User/user.js';
import Admin from '../models/User/admin.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/tokenUtils.js';
import { sessionManager } from '../config/sessionStore.js';

// Register new user
export const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Validate required fields
        if (!name || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        // Validate role
        if (!['teacher', 'student'].includes(role)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid role. Must be teacher or student'
            });
        }

        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 6 characters'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'Email already exists'
            });
        }

        // Create new user
        const user = new User({
            name,
            email: email.toLowerCase(),
            password,
            role
        });

        await user.save();

        // Return user without password
        res.status(201).json({
            user: {
                _id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            error: error.message || 'Server error during registration'
        });
    }
};

// Login user
export const login = async (req, res) => {
    try {
        console.log('Login attempt:', { email: req.body.email, role: req.body.role });

        const { email, password, role } = req.body;

        // Validate required fields
        if (!email || !password || !role) {
            console.log('Missing required fields');
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        // Find user by email
        console.log('Finding user:', email.toLowerCase());
        const user = role === 'admin'
            ? await Admin.findOne({ email: email.toLowerCase() })
            : await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            console.log('User not found:', email);
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        console.log('User found:', user.email, 'Role:', user.role);

        // Check if account is active
        if (!user.isActive) {
            console.log('Account deactivated:', email);
            return res.status(401).json({
                success: false,
                error: 'Account is deactivated'
            });
        }

        // Verify role matches
        if (user.role !== role) {
            console.log('Role mismatch. Expected:', role, 'Got:', user.role);
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        // Check password
        console.log('Checking password...');
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            console.log('Invalid password for:', email);
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        console.log('Password valid, checking for existing sessions...');

        // NEW: Check for existing active session (especially for students)
        const userId = user._id.toString();
        const existingSession = await sessionManager.getActiveSession(userId);

        if (existingSession && user.role === 'student') {
            // For students, terminate the old session and allow new login
            console.log('Existing session found for student, terminating old session...');
            await sessionManager.removeSession(userId);
        }

        console.log('Generating tokens...');

        // Generate tokens
        const token = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // NEW: Store session in Redis
        const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
        const userAgent = req.headers['user-agent'];

        const sessionData = {
            token,
            userId,
            email: user.email,
            role: user.role,
            loginTime: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            ipAddress,
            userAgent
        };

        await sessionManager.setActiveSession(userId, sessionData);

        console.log('Session created successfully');

        // Return success response with session ID
        res.status(200).json({
            user: {
                _id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role
            },
            token,
            refreshToken
        });
    } catch (error) {
        console.error('Login error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        res.status(500).json({
            error: error.message || 'Server error during login'
        });
    }
};

// Refresh token
export const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                error: 'Refresh token is required'
            });
        }

        // Verify refresh token
        const decoded = verifyRefreshToken(refreshToken);

        // Get user
        const user = decoded.role === 'admin'
            ? await Admin.findById(decoded.userId)
            : await User.findById(decoded.userId);

        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                error: 'Invalid refresh token'
            });
        }

        // Generate new tokens
        const newToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);

        res.status(200).json({
            success: true,
            token: newToken,
            refreshToken: newRefreshToken
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(401).json({
            success: false,
            error: 'Invalid refresh token'
        });
    }
};

// Logout user
export const logout = async (req, res) => {
    try {
        // NEW: Remove session from Redis
        if (req.user) {
            const userId = req.user._id.toString();
            await sessionManager.removeSession(userId);
            console.log('Session removed for user:', userId);
        }

        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error during logout'
        });
    }
};

// Get current user profile (with exam attempts for students)
export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('examAttempts.examId', 'title description totalMarks passingMarks')
            .select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const userProfile = {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt,
            examAttempts: user.examAttempts ? user.examAttempts.map(attempt => ({
                examId: attempt.examId._id.toString(),
                examTitle: attempt.examId.title,
                attemptId: attempt.attemptId.toString(),
                status: attempt.status,
                score: attempt.score,
                percentage: attempt.percentage,
                passed: attempt.passed,
                totalMarks: attempt.totalMarks,
                startedAt: attempt.startedAt,
                completedAt: attempt.completedAt
            })) : []
        };

        res.status(200).json({
            success: true,
            user: userProfile
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Server error fetching profile'
        });
    }
};
