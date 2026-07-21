/**
 * Time and Timezone Utility functions for Exam Scheduling & Time Sync
 */

/**
 * Combines a date string (YYYY-MM-DD) and a time string (HH:MM 24h) in a specific timezone
 * into a valid UTC Date object.
 *
 * @param {string|Date} dateVal - Date string "YYYY-MM-DD" or Date object
 * @param {string} timeStr - Time string "HH:MM" (default "00:00")
 * @param {string} timezone - Timezone name e.g. "Asia/Kolkata", "UTC", "America/New_York"
 * @param {boolean} isEndOfDay - If timeStr not provided, default to 23:59:59
 * @returns {Date|null}
 */
export const combineDateAndTimeToUTC = (dateVal, timeStr, timezone = 'UTC', isEndOfDay = false) => {
    if (!dateVal) return null;

    let dateString = '';
    if (dateVal instanceof Date) {
        dateString = dateVal.toISOString().slice(0, 10);
    } else if (typeof dateVal === 'string') {
        dateString = dateVal.slice(0, 10);
    }

    if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return null;
    }

    let hours = isEndOfDay ? 23 : 0;
    let minutes = isEndOfDay ? 59 : 0;
    let seconds = isEndOfDay ? 59 : 0;

    if (timeStr && typeof timeStr === 'string' && /^\d{1,2}:\d{2}$/.test(timeStr)) {
        const parts = timeStr.split(':');
        hours = parseInt(parts[0], 10);
        minutes = parseInt(parts[1], 10);
        seconds = isEndOfDay ? 59 : 0;
    }

    // Format local ISO string without offset: "YYYY-MM-DDTHH:MM:SS"
    const pad = (num) => String(num).padStart(2, '0');
    const localISO = `${dateString}T${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

    try {
        // Use Intl.DateTimeFormat to parse in specified timezone
        const options = {
            timeZone: timezone,
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false
        };

        // Create a date assuming UTC, then compute offset for target timezone
        const targetDate = new Date(`${localISO}Z`);
        
        // Simple offset calculation via Intl
        const formatter = new Intl.DateTimeFormat('en-US', options);
        const parts = formatter.formatToParts(targetDate);
        const getPart = (type) => parts.find(p => p.type === type)?.value;

        const tzYear = getPart('year');
        const tzMonth = getPart('month');
        const tzDay = getPart('day');
        let tzHour = getPart('hour');
        if (tzHour === '24') tzHour = '00';
        const tzMin = getPart('minute');
        const tzSec = getPart('second');

        const formattedTzStr = `${tzYear}-${tzMonth}-${tzDay}T${tzHour}:${tzMin}:${tzSec}Z`;
        const dateInTz = new Date(formattedTzStr);
        const offsetMs = targetDate.getTime() - dateInTz.getTime();

        return new Date(targetDate.getTime() + offsetMs);
    } catch (err) {
        // Fallback to plain UTC parsing if timezone name is unsupported
        return new Date(`${localISO}Z`);
    }
};

/**
 * Validates whether the current time is within the exam schedule window.
 *
 * @param {Object} exam - Exam document with startDateTimeUTC, endDateTimeUTC, allowLateEntry, lateEntryWindowMinutes
 * @returns {Object} { isValid: boolean, code?: string, error?: string }
 */
export const validateExamScheduleWindow = (exam) => {
    const now = new Date();

    if (!exam.isActive || exam.status === 'draft') {
        return { isValid: false, code: 'EXAM_INACTIVE', error: 'This exam is not active or is in draft mode.' };
    }

    if (exam.startDateTimeUTC && now < exam.startDateTimeUTC) {
        return { isValid: false, code: 'EXAM_NOT_STARTED', error: 'Exam has not started yet.' };
    }

    if (exam.endDateTimeUTC) {
        // If late entry is not allowed, check if late window exceeded
        // Late-entry window only applies when teacher has ENABLED late entry.
        // If allowLateEntry is true, students can enter within the configured window
        // after the exam start, but not beyond it.
        if (exam.allowLateEntry && exam.startDateTimeUTC && exam.lateEntryWindowMinutes > 0) {
            const maxLateEntryTime = new Date(exam.startDateTimeUTC.getTime() + exam.lateEntryWindowMinutes * 60 * 1000);
            if (now > maxLateEntryTime && now < exam.endDateTimeUTC) {
                return { isValid: false, code: 'LATE_ENTRY_EXCEEDED', error: `Late entry window (${exam.lateEntryWindowMinutes} mins) has expired.` };
            }
        }
        // If allowLateEntry is false, students cannot start the exam after the start time window has passed
        // (the exam is only accessible on-time). No separate late-window logic needed here —
        // the endDateTimeUTC check below handles closing the exam correctly.

        if (now > exam.endDateTimeUTC) {
            return { isValid: false, code: 'EXAM_ENDED', error: 'Exam deadline has passed.' };
        }
    }

    return { isValid: true };
};
