// violationService.ts
// Phase 2 — Reports exam integrity violations to the backend.
// Uses an offline queue so events are not lost on brief network failures.

import { apiClient } from './api';

export type ViolationType =
  | 'tab_switch'
  | 'window_blur'
  | 'copy_attempt'
  | 'paste_attempt'
  | 'devtools_open'
  | 'refresh_attempt'
  | 'keyboard_shortcut';

interface ViolationPayload {
  attemptId: string;
  type: ViolationType;
  count?: number;
  metadata?: Record<string, unknown>;
}

// In-memory queue for offline retry
const queue: ViolationPayload[] = [];
let isFlushing = false;

const flushQueue = async () => {
  if (isFlushing || queue.length === 0) return;
  isFlushing = true;
  while (queue.length > 0) {
    const payload = queue[0];
    try {
      await apiClient.post('/api/exam-attempts/report-violation', payload);
      queue.shift();
    } catch {
      // Stop flushing on failure — will retry on next reportViolation call
      break;
    }
  }
  isFlushing = false;
};

/**
 * Report a violation event. Queues the event and attempts delivery immediately.
 * Falls back to the offline queue if the network is unavailable.
 */
export const reportViolation = (
  attemptId: string,
  type: ViolationType,
  metadata?: Record<string, unknown>
): void => {
  if (!attemptId) return;

  const payload: ViolationPayload = {
    attemptId,
    type,
    metadata: {
      timestamp: new Date().toISOString(),
      ...metadata,
    },
  };

  queue.push(payload);
  flushQueue();
};
