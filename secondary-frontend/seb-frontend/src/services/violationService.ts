// violationService.ts
// Reports exam integrity violations to the backend.
// Uses an offline queue so events are not lost on brief network failures.
// Returns the backend's enforcement decision (action, remaining) to the caller.

import { apiClient } from './api';
import type { ViolationType, ViolationResponse } from './violationService.types';

export type { ViolationType, ViolationResponse };

interface ViolationPayload {
  attemptId: string;
  type: ViolationType;
  metadata?: Record<string, unknown>;
}

// In-memory queue for offline retry
const queue: Array<{ payload: ViolationPayload; resolve: (r: ViolationResponse) => void; reject: (e: unknown) => void }> = [];
let isFlushing = false;

const flushQueue = async () => {
  if (isFlushing || queue.length === 0) return;
  isFlushing = true;
  while (queue.length > 0) {
    const item = queue[0];
    try {
      const res = await apiClient.post<ViolationResponse>('/api/exam-attempts/report-violation', item.payload);
      item.resolve(res.data);
      queue.shift();
    } catch (err) {
      item.reject(err);
      // Stop flushing on failure — will retry on next reportViolation call
      break;
    }
  }
  isFlushing = false;
};

/**
 * Report a violation event to the backend.
 * Returns a promise that resolves with the backend's enforcement decision.
 * Falls back to the offline queue if the network is unavailable.
 */
export const reportViolation = (
  attemptId: string,
  type: ViolationType,
  metadata?: Record<string, unknown>
): Promise<ViolationResponse> => {
  if (!attemptId) {
    return Promise.resolve({ success: false, action: 'WARNING' });
  }

  const payload: ViolationPayload = {
    attemptId,
    type,
    metadata: {
      timestamp: new Date().toISOString(),
      ...metadata,
    },
  };

  return new Promise<ViolationResponse>((resolve, reject) => {
    queue.push({ payload, resolve, reject });
    flushQueue();
  });
};
