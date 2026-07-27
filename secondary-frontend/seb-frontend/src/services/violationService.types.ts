// violationService.types.ts — Shared types for violation reporting

export type ViolationType =
  | 'tab_switch'
  | 'window_blur'
  | 'copy_attempt'
  | 'paste_attempt'
  | 'cut_attempt'
  | 'devtools_open'
  | 'refresh_attempt'
  | 'keyboard_shortcut'
  | 'fullscreen_exit'
  | 'right_click'
  | 'offline';

/** Backend response from POST /api/exam-attempts/report-violation */
export interface ViolationResponse {
  success: boolean;
  /** WARNING = stay; AUTO_SUBMIT = submit silently; TERMINATE = freeze+submit */
  action: 'WARNING' | 'AUTO_SUBMIT' | 'TERMINATE' | 'NONE';
  reason?: string;
  message?: string;
  remaining?: number;
  specificCount?: number;
  totalCount?: number;
}
