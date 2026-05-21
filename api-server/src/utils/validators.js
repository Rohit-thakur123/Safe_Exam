/**
 * Validate required fields in request body
 * @param {object} body - Request body
 * @param {string[]} requiredFields - Array of required field names
 * @returns {object} Validation result
 */
export const validateRequiredFields = (body, requiredFields) => {
  const missingFields = [];

  for (const field of requiredFields) {
    if (!body[field]) {
      missingFields.push(field);
    }
  }

  return {
    isValid: missingFields.length === 0,
    missingFields
  };
};

/**
 * Validate exam ID format
 * @param {string} examId - Exam ID to validate
 * @returns {boolean} True if valid
 */
export const isValidExamId = (examId) => {
  // MongoDB ObjectId format (24 hex characters)
  return /^[a-f\d]{24}$/i.test(examId);
};

/**
 * Validate student ID format
 * @param {string} studentId - Student ID to validate
 * @returns {boolean} True if valid
 */
export const isValidStudentId = (studentId) => {
  // MongoDB ObjectId format (24 hex characters)
  return /^[a-f\d]{24}$/i.test(studentId);
};

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid
 */
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};
