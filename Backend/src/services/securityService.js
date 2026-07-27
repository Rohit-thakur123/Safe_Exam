import ExamAttempt from '../models/exam/examAttempt.js';

/**
 * Evaluates a new violation against the exam's security policy.
 *
 * IMPORTANT: This function reads the CURRENT violation counts directly from
 * MongoDB (not from a stale in-memory document). It returns the incremented
 * counts and the enforcement action. The caller is responsible for the atomic
 * $inc + optional $set (termination) write — do NOT call attempt.save() after
 * calling this, or the in-memory mutation will be lost.
 *
 * @param {Object} attempt  - The ExamAttempt mongoose document (used for _id only)
 * @param {Object} exam     - The Exam mongoose document (for securityPolicy)
 * @param {String} type     - The violation type (snake_case, matches DB enum)
 * @returns {Object} { action, reason, fieldKey, specificCount, totalCount }
 */
export const processViolation = async (attempt, exam, type) => {
    const policy = exam.securityPolicy;
    if (!policy) {
        return { action: 'NONE' };
    }

    // Map violation type -> violationSummary field key
    const fieldMap = {
        tab_switch: 'violationSummary.tabSwitches',
        window_blur: 'violationSummary.windowBlurs',
        copy_attempt: 'violationSummary.copyAttempts',
        paste_attempt: 'violationSummary.pasteAttempts',
        cut_attempt: 'violationSummary.cutAttempts',
        devtools_open: 'violationSummary.devToolsAttempts',
        fullscreen_exit: 'violationSummary.fullscreenExits',
        right_click: 'violationSummary.rightClicks',
        offline: 'violationSummary.offlineCount',
    };

    const fieldKey = fieldMap[type] || null;

    // Atomically increment the specific counter AND totalViolations in a single
    // findOneAndUpdate, returning the NEW (post-increment) document.
    const incPayload = { 'violationSummary.totalViolations': 1 };
    if (fieldKey) incPayload[fieldKey] = 1;

    const updated = await ExamAttempt.findOneAndUpdate(
        { _id: attempt._id },
        { $inc: incPayload },
        { new: true, select: 'violationSummary' }
    );

    if (!updated) {
        return { action: 'NONE' };
    }

    const s = updated.violationSummary;

    // Evaluate policy limits against the FRESH counters
    let breachedLimit = null;

    if (type === 'tab_switch' && s.tabSwitches > policy.tabSwitchLimit) {
        breachedLimit = `Tab switch limit exceeded (${s.tabSwitches}/${policy.tabSwitchLimit})`;
    } else if (type === 'window_blur' && s.windowBlurs > policy.windowBlurLimit) {
        breachedLimit = `Window blur limit exceeded (${s.windowBlurs}/${policy.windowBlurLimit})`;
    } else if (['copy_attempt', 'paste_attempt', 'cut_attempt'].includes(type) &&
        (s.copyAttempts + s.pasteAttempts + s.cutAttempts) > policy.copyPasteLimit) {
        breachedLimit = `Copy/Paste/Cut limit exceeded (${s.copyAttempts + s.pasteAttempts + s.cutAttempts}/${policy.copyPasteLimit})`;
    } else if (type === 'devtools_open' && s.devToolsAttempts > policy.devToolsLimit) {
        breachedLimit = `DevTools detected (${s.devToolsAttempts}/${policy.devToolsLimit})`;
    } else if (type === 'fullscreen_exit' && s.fullscreenExits > policy.fullscreenExitLimit) {
        breachedLimit = `Fullscreen exit limit exceeded (${s.fullscreenExits}/${policy.fullscreenExitLimit})`;
    } else if (type === 'right_click' && s.rightClicks > policy.rightClickLimit) {
        breachedLimit = `Right-click limit exceeded (${s.rightClicks}/${policy.rightClickLimit})`;
    } else if (type === 'offline' && s.offlineCount > policy.networkDisconnectLimit) {
        breachedLimit = `Network disconnect limit exceeded (${s.offlineCount}/${policy.networkDisconnectLimit})`;
    } else if (s.totalViolations > policy.overallViolationLimit) {
        breachedLimit = `Overall violation limit exceeded (${s.totalViolations}/${policy.overallViolationLimit})`;
    }

    // Compute current count for this specific type (for the warning message)
    const specificCount = fieldKey
        ? (s[fieldKey.replace('violationSummary.', '')] ?? 0)
        : s.totalViolations;

    const limitMap = {
        tab_switch: policy.tabSwitchLimit,
        window_blur: policy.windowBlurLimit,
        copy_attempt: policy.copyPasteLimit,
        paste_attempt: policy.copyPasteLimit,
        cut_attempt: policy.copyPasteLimit,
        devtools_open: policy.devToolsLimit,
        fullscreen_exit: policy.fullscreenExitLimit,
        right_click: policy.rightClickLimit,
        offline: policy.networkDisconnectLimit,
    };
    const limit = limitMap[type] ?? policy.overallViolationLimit;
    const remaining = Math.max(0, limit - specificCount);

    if (breachedLimit) {
        return {
            action: policy.action || 'TERMINATE',
            reason: breachedLimit,
            specificCount,
            totalCount: s.totalViolations,
            remaining: 0,
        };
    }

    return {
        action: 'WARNING',
        message: `Security violation recorded: ${type.replace(/_/g, ' ')}. ${remaining} warning${remaining === 1 ? '' : 's'} remaining before action.`,
        specificCount,
        totalCount: s.totalViolations,
        remaining,
    };
};
