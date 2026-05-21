import jwt from 'jsonwebtoken';
import logger from './logger.js';

/**
 * Generate SEB Session Token
 * @param {string} examId - The exam ID
 * @param {string} studentId - The student ID
 * @param {number} durationMinutes - Exam duration in minutes
 * @returns {string} JWT token
 */
export const generateSEBSessionToken = (examId, studentId, durationMinutes) => {
  const payload = {
    type: 'seb-session',
    examId: examId.toString(),
    studentId: studentId.toString(),
    purpose: 'seb-exam'
  };

  // Add 30 minutes buffer to exam duration
  const bufferMinutes = 30;
  const totalMinutes = durationMinutes + bufferMinutes;

  const token = jwt.sign(
    payload,
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: `${totalMinutes}m` }
  );

  logger.info(`Generated SEB token with ${totalMinutes} minutes validity`);

  return token;
};

/**
 * Verify SEB Session Token
 * @param {string} token - The JWT token to verify
 * @returns {object} Decoded token payload or null
 */
export const verifySEBSessionToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    if (decoded.type !== 'seb-session') {
      logger.warn('Invalid token type:', decoded.type);
      return null;
    }

    return decoded;
  } catch (error) {
    logger.error('Token verification failed:', error.message);
    return null;
  }
};
