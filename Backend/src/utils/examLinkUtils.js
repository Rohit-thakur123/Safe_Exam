import jwt from 'jsonwebtoken';
import crypto from 'crypto';

/**
 * Generate a unique exam access token for a student
 * This token is sent via email and allows one-time exam access
 */
export const generateExamAccessToken = (examId, studentId, examDuration) => {
    const payload = {
        type: 'exam-access',
        examId: examId.toString(),
        studentId: studentId.toString(),
        purpose: 'exam-verification',
        // Token expires after exam end date + buffer time
        iat: Math.floor(Date.now() / 1000)
    };

    // Token valid for exam duration + 24 hours buffer
    const expiryTime = examDuration ? `${examDuration + 1440}m` : '7d';

    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: expiryTime });
};

/**
 * Verify exam access token
 */
export const verifyExamAccessToken = (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.type !== 'exam-access') {
            throw new Error('Invalid token type');
        }

        return decoded;
    } catch (error) {
        throw new Error('Invalid or expired exam access token');
    }
};

/**
 * Generate SEB session token (short-lived for exam duration only)
 * This is used inside SEB browser after verification
 */
export const generateSEBSessionToken = (examId, studentId, examDuration) => {
    const payload = {
        type: 'seb-session',
        examId: examId.toString(),
        studentId: studentId.toString(),
        purpose: 'seb-exam-attempt',
        iat: Math.floor(Date.now() / 1000)
    };

    // Token valid for exam duration + 30 minutes grace period
    const expiryMinutes = examDuration + 30;

    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: `${expiryMinutes}m` });
};

/**
 * Verify SEB session token
 */
export const verifySEBSessionToken = (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.type !== 'seb-session') {
            throw new Error('Invalid token type');
        }

        return decoded;
    } catch (error) {
        throw new Error('Invalid or expired SEB session token');
    }
};

/**
 * Generate exam link that will be sent to student via email.
 * The launch page (ExamLaunch) needs examId + studentId + an exam-access
 * token to call /seb/verify-exam-link and /seb/get-session-token — all three
 * must be in the link, not just examId.
 */
export const generateExamLink = (examId, studentId, examDuration, frontendBaseUrl) => {
    const token = generateExamAccessToken(examId, studentId, examDuration);
    return `${frontendBaseUrl}/exam/launch?examId=${examId}&studentId=${studentId}&token=${encodeURIComponent(token)}`;
};

/**
 * Generate unique identifier for tracking
 */
export const generateUniqueId = () => {
    return crypto.randomBytes(16).toString('hex');
};

