// Local storage service for persisting exam data
export class StorageService {
  private static getKey(examId: string, suffix: string): string {
    return `seb_exam_${examId}_${suffix}`;
  }

  /**
   * Save answers to localStorage
   */
  static saveAnswers(examId: string, answers: Record<string, string>): void {
    try {
      const key = this.getKey(examId, 'answers');
      localStorage.setItem(key, JSON.stringify(answers));
    } catch (error) {
      console.error('Failed to save answers to localStorage:', error);
    }
  }

  /**
   * Load answers from localStorage
   */
  static loadAnswers(examId: string): Record<string, string> {
    try {
      const key = this.getKey(examId, 'answers');
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to load answers from localStorage:', error);
      return {};
    }
  }

  /**
   * Save current question index
   */
  static saveCurrentQuestion(examId: string, questionIndex: number): void {
    try {
      const key = this.getKey(examId, 'current_question');
      localStorage.setItem(key, questionIndex.toString());
    } catch (error) {
      console.error('Failed to save current question to localStorage:', error);
    }
  }

  /**
   * Load current question index
   */
  static loadCurrentQuestion(examId: string): number {
    try {
      const key = this.getKey(examId, 'current_question');
      const stored = localStorage.getItem(key);
      return stored ? parseInt(stored, 10) : 0;
    } catch (error) {
      console.error('Failed to load current question from localStorage:', error);
      return 0;
    }
  }

  /**
   * Save session token
   */
  static saveSessionToken(token: string): void {
    try {
      localStorage.setItem('seb_session_token', token);
    } catch (error) {
      console.error('Failed to save session token:', error);
    }
  }

  /**
   * Get session token
   */
  static getSessionToken(): string | null {
    try {
      return localStorage.getItem('seb_session_token');
    } catch (error) {
      console.error('Failed to get session token:', error);
      return null;
    }
  }

  /**
   * Clear all exam-related data
   */
  static clearExamData(examId: string): void {
    try {
      const answersKey = this.getKey(examId, 'answers');
      const questionKey = this.getKey(examId, 'current_question');
      
      localStorage.removeItem(answersKey);
      localStorage.removeItem(questionKey);
      localStorage.removeItem('seb_session_token');
    } catch (error) {
      console.error('Failed to clear exam data:', error);
    }
  }

  /**
   * Check if localStorage is available
   */
  static isAvailable(): boolean {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, 'test');
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }
}