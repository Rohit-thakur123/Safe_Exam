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
   * Save current exam stage (dashboard, mcq, coding)
   */
  static saveExamStage(examId: string, stage: string): void {
    try {
      const key = this.getKey(examId, 'stage');
      localStorage.setItem(key, stage);
    } catch (error) {
      console.error('Failed to save exam stage to localStorage:', error);
    }
  }

  /**
   * Load current exam stage
   */
  static loadExamStage(examId: string): string | null {
    try {
      const key = this.getKey(examId, 'stage');
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Failed to load exam stage from localStorage:', error);
      return null;
    }
  }

  /**
   * Save section statuses
   */
  static saveSectionStatuses(
    examId: string,
    statuses: { mcqStatus: string; codingStatus: string }
  ): void {
    try {
      const key = this.getKey(examId, 'section_statuses');
      localStorage.setItem(key, JSON.stringify(statuses));
    } catch (error) {
      console.error('Failed to save section statuses to localStorage:', error);
    }
  }

  /**
   * Load section statuses
   */
  static loadSectionStatuses(
    examId: string
  ): { mcqStatus: string; codingStatus: string } | null {
    try {
      const key = this.getKey(examId, 'section_statuses');
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to load section statuses from localStorage:', error);
      return null;
    }
  }

  /**
   * Save coding answers (source code per problem)
   */
  static saveCodingAnswers(examId: string, answers: Record<string, string>): void {
    try {
      const key = this.getKey(examId, 'coding_answers');
      localStorage.setItem(key, JSON.stringify(answers));
    } catch (error) {
      console.error('Failed to save coding answers to localStorage:', error);
    }
  }

  /**
   * Load coding answers
   */
  static loadCodingAnswers(examId: string): Record<string, string> {
    try {
      const key = this.getKey(examId, 'coding_answers');
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to load coding answers from localStorage:', error);
      return {};
    }
  }

  /**
   * Save coding languages selection
   */
  static saveCodingLanguages(examId: string, languages: Record<string, string>): void {
    try {
      const key = this.getKey(examId, 'coding_languages');
      localStorage.setItem(key, JSON.stringify(languages));
    } catch (error) {
      console.error('Failed to save coding languages to localStorage:', error);
    }
  }

  /**
   * Load coding languages selection
   */
  static loadCodingLanguages(examId: string): Record<string, string> {
    try {
      const key = this.getKey(examId, 'coding_languages');
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to load coding languages from localStorage:', error);
      return {};
    }
  }

  /**
   * Save active coding problem index
   */
  static saveCodingProblemIndex(examId: string, index: number): void {
    try {
      const key = this.getKey(examId, 'coding_problem_index');
      localStorage.setItem(key, index.toString());
    } catch (error) {
      console.error('Failed to save coding problem index to localStorage:', error);
    }
  }

  /**
   * Load active coding problem index
   */
  static loadCodingProblemIndex(examId: string): number {
    try {
      const key = this.getKey(examId, 'coding_problem_index');
      const stored = localStorage.getItem(key);
      return stored ? parseInt(stored, 10) : 0;
    } catch (error) {
      console.error('Failed to load coding problem index from localStorage:', error);
      return 0;
    }
  }

  /**
   * Save custom input per coding question
   */
  static saveCustomInputs(examId: string, inputs: Record<string, string>): void {
    try {
      const key = this.getKey(examId, 'custom_inputs');
      localStorage.setItem(key, JSON.stringify(inputs));
    } catch (error) {
      console.error('Failed to save custom inputs to localStorage:', error);
    }
  }

  /**
   * Load custom input per coding question
   */
  static loadCustomInputs(examId: string): Record<string, string> {
    try {
      const key = this.getKey(examId, 'custom_inputs');
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to load custom inputs from localStorage:', error);
      return {};
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
      const prefixes = [
        'answers',
        'current_question',
        'stage',
        'section_statuses',
        'coding_answers',
        'coding_languages',
        'coding_problem_index',
        'custom_inputs'
      ];
      for (const prefix of prefixes) {
        localStorage.removeItem(this.getKey(examId, prefix));
      }
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