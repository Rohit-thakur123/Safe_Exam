import ExamAttempt from '../models/exam/examAttempt.js';

/**
 * Evaluates a new violation against the exam's security policy.
 * Updates the attempt's violation counters and determines if an enforcement action is needed.
 * 
 * @param {Object} attempt - The ExamAttempt mongoose document
 * @param {Object} exam - The Exam mongoose document
 * @param {String} type - The violation type
 * @returns {Object} { action: 'NONE' | 'WARNING' | 'AUTO_SUBMIT' | 'TERMINATE', reason?: string }
 */
export const processViolation = async (attempt, exam, type) => {
    const policy = exam.securityPolicy;
    if (!policy) {
        return { action: 'NONE' };
    }

    // Initialize summary if missing
    if (!attempt.violationSummary) {
        attempt.violationSummary = {
            tabSwitches: 0,
            windowBlurs: 0,
            copyAttempts: 0,
            pasteAttempts: 0,
            cutAttempts: 0,
            devToolsAttempts: 0,
            fullscreenExits: 0,
            rightClicks: 0,
            offlineCount: 0,
            totalViolations: 0
        };
    }
    
    const s = attempt.violationSummary;

    // Increment specific counters
    switch (type) {
        case 'tab_switch': s.tabSwitches += 1; break;
        case 'window_blur': s.windowBlurs += 1; break;
        case 'copy_attempt': s.copyAttempts += 1; break;
        case 'paste_attempt': s.pasteAttempts += 1; break;
        case 'cut_attempt': s.cutAttempts += 1; break;
        case 'devtools_open': s.devToolsAttempts += 1; break;
        case 'fullscreen_exit': s.fullscreenExits += 1; break;
        case 'right_click': s.rightClicks += 1; break;
        case 'offline': s.offlineCount += 1; break;
    }
    
    s.totalViolations += 1;

    // Check specific limits
    let breachedLimit = null;
    
    if (s.tabSwitches > policy.tabSwitchLimit) breachedLimit = `Tab switch limit exceeded (${s.tabSwitches}/${policy.tabSwitchLimit})`;
    else if (s.windowBlurs > policy.windowBlurLimit) breachedLimit = `Window blur limit exceeded (${s.windowBlurs}/${policy.windowBlurLimit})`;
    else if ((s.copyAttempts + s.pasteAttempts + s.cutAttempts) > policy.copyPasteLimit) breachedLimit = `Copy/Paste/Cut limit exceeded (${s.copyAttempts + s.pasteAttempts + s.cutAttempts}/${policy.copyPasteLimit})`;
    else if (s.devToolsAttempts > policy.devToolsLimit) breachedLimit = `DevTools opening detected`;
    else if (s.fullscreenExits > policy.fullscreenExitLimit) breachedLimit = `Fullscreen exit limit exceeded (${s.fullscreenExits}/${policy.fullscreenExitLimit})`;
    else if (s.rightClicks > policy.rightClickLimit) breachedLimit = `Right-click limit exceeded (${s.rightClicks}/${policy.rightClickLimit})`;
    else if (s.offlineCount > policy.networkDisconnectLimit) breachedLimit = `Network disconnect limit exceeded (${s.offlineCount}/${policy.networkDisconnectLimit})`;
    else if (s.totalViolations > policy.overallViolationLimit) breachedLimit = `Overall violation limit exceeded (${s.totalViolations}/${policy.overallViolationLimit})`;

    if (breachedLimit) {
        return {
            action: policy.action || 'TERMINATE', // 'WARNING', 'AUTO_SUBMIT', 'TERMINATE'
            reason: breachedLimit
        };
    }

    return { action: 'WARNING' }; // Default to warning if no limit breached yet
};
