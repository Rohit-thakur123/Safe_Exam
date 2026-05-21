import axios from 'axios';
import { generateSEBSessionToken } from '../utils/tokenUtils.js';
import { generateSEBConfigXML } from '../utils/sebConfigGenerator.js';
import { validateRequiredFields } from '../utils/validators.js';
import logger from '../utils/logger.js';

/**
 * Verify exam link from email
 * This is a placeholder - actual implementation should be in main backend
 */
export const verifyExamLink = async (req, res) => {
  try {
    // This endpoint should be implemented in the main backend
    // For now, return a not implemented message
    res.status(501).json({
      success: false,
      error: 'This endpoint should be implemented in the main backend'
    });
  } catch (error) {
    logger.error('Error in verifyExamLink:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Generate exam links for students
 * This is a placeholder - actual implementation should be in main backend
 */
export const generateExamLinks = async (req, res) => {
  try {
    // This endpoint should be implemented in the main backend
    // For now, return a not implemented message
    res.status(501).json({
      success: false,
      error: 'This endpoint should be implemented in the main backend'
    });
  } catch (error) {
    logger.error('Error in generateExamLinks:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Generate SEB Configuration File
 * POST /api/seb/generate-seb-config
 */
export const generateSEBConfig = async (req, res) => {
  try {
    const { examId, studentId, token, backendUrl, sebFrontendUrl } = req.body;

    // Validate required fields
    const validation = validateRequiredFields(req.body, [
      'examId',
      'studentId',
      'token',
      'backendUrl',
      'sebFrontendUrl'
    ]);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${validation.missingFields.join(', ')}`
      });
    }

    logger.info(`SEB config request received for Exam: ${examId}, Student: ${studentId}`);

    // Step 1: Validate token with main backend
    let validationResponse;
    try {
      validationResponse = await axios.post(
        `${backendUrl}/api/seb/verify-exam-link`,
        { examId, studentId, token },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 seconds timeout
        }
      );
    } catch (axiosError) {
      logger.error('Backend validation failed:', axiosError.message);
      
      if (axiosError.response) {
        // Backend returned an error response
        return res.status(axiosError.response.status).json({
          success: false,
          error: axiosError.response.data.error || 'Backend validation failed'
        });
      } else if (axiosError.code === 'ECONNREFUSED') {
        return res.status(503).json({
          success: false,
          error: 'Unable to connect to backend server'
        });
      } else {
        return res.status(500).json({
          success: false,
          error: 'Failed to validate exam eligibility'
        });
      }
    }

    // Check if validation was successful
    if (!validationResponse.data.success) {
      logger.warn(`Validation failed for Exam: ${examId}, Student: ${studentId}`);
      return res.status(403).json({
        success: false,
        error: validationResponse.data.error || 'Exam validation failed'
      });
    }

    const examData = validationResponse.data.data;

    // Check if student can attempt
    if (!examData.canAttempt) {
      logger.warn(`Student ${studentId} cannot attempt exam ${examId}`);
      return res.status(403).json({
        success: false,
        error: 'You cannot attempt this exam at this time'
      });
    }

    // Step 2: Generate SEB session token
    const sessionToken = generateSEBSessionToken(
      examId,
      studentId,
      examData.exam.duration
    );

    logger.info(`Generated SEB session token for Exam: ${examId}, Student: ${studentId}`);

    // Step 3: Create start URL with session token
    const startUrl = `${sebFrontendUrl}/exam/${examId}/${sessionToken}`;

    // Step 4: Generate SEB configuration
    const sebConfig = generateSEBConfigXML(startUrl, {
      examName: examData.exam.title,
      sebFrontendUrl: sebFrontendUrl,
      allowQuit: process.env.SEB_ALLOW_QUIT === 'true',
      quitPassword: process.env.SEB_QUIT_PASSWORD || ''
    });

    // Step 5: Return .seb file
    const filename = `secure-exam-${examId}-${Date.now()}.seb`;
    
    logger.info(`SEB config generated successfully - File: ${filename}`);

    res.setHeader('Content-Type', 'application/seb');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(sebConfig);

  } catch (error) {
    logger.error('SEB config generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate SEB configuration'
    });
  }
};
