// Validation utility functions

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate session token format
 */
export const isValidSessionToken = (token: string): boolean => {
  // Token should be a non-empty string
  return typeof token === 'string' && token.trim().length > 0;
};

/**
 * Validate exam ID format
 */
export const isValidExamId = (examId: string): boolean => {
  // MongoDB ObjectId format (24 hex characters)
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  return objectIdRegex.test(examId);
};

/**
 * Check if answer is empty
 */
export const isAnswerEmpty = (answer: string): boolean => {
  return !answer || answer.trim().length === 0;
};

/**
 * Validate file size
 */
export const isValidFileSize = (file: File, maxSizeInBytes: number): boolean => {
  return file.size <= maxSizeInBytes;
};

/**
 * Validate file type
 */
export const isValidFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.type);
};

/**
 * Check if local storage is available
 */
export const isLocalStorageAvailable = (): boolean => {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, 'test');
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate URL format
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Check if browser is SEB (Safe Exam Browser)
 */
export const isSafeExamBrowser = (): boolean => {
  // Check for SEB-specific user agent or headers
  const userAgent = navigator.userAgent.toLowerCase();
  return userAgent.includes('seb') || userAgent.includes('safeexambrowser');
};

/**
 * Sanitize HTML to prevent XSS
 */
export const sanitizeHtml = (html: string): string => {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
};

/**
 * Validate answer based on question type
 */
export const isValidAnswer = (answer: string, questionType: string, options?: string[]): boolean => {
  if (isAnswerEmpty(answer)) return false;
  
  if (questionType === 'mcq' && options) {
    return options.includes(answer);
  }
  
  if (questionType === 'text') {
    return answer.trim().length >= 10; // Minimum 10 characters for text answers
  }
  
  return true;
};