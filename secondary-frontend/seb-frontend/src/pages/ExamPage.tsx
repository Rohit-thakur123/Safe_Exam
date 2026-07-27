// ExamPage.tsx — Security orchestrator for the Safe Exam Browser
//
// Security architecture:
//   Phase 1: Persistent stage/section/question across page refreshes via StorageService
//   Phase 2: Violation reporting → useTabVisibility, useDevToolsDetection, keyboard blocker
//   Phase 3: Navigation confirmation dialogs before leaving active sections
//   Phase 4: Fullscreen enforcement with teacher-configured policy from backend
//   Phase 5: All security limits read from examSession.exam.securityPolicy (teacher-configured)
//
// Browser Security Limitations (documented):
//   - Cannot block OS-level shortcuts (Alt+Tab, Win key, Task Manager)
//   - Cannot auto-re-enter fullscreen without a user gesture (browser spec)
//   - DevTools detection uses window size heuristic (not 100% reliable for detached DevTools)
//   These limitations are enforced via policy: we log, count, and terminate per teacher's config.

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useExamSession, AlreadySubmittedError } from '../hooks/useExamSession';
import { useAutoSave } from '../hooks/useAutoSave';
import { useTimer } from '../hooks/useTimer';
import { useHeartbeat } from '../hooks/useHeartbeat';
import { useTabVisibility } from '../hooks/useTabVisibility';
import { useDevToolsDetection } from '../hooks/useDevToolsDetection';
import { StorageService } from '../services/storageService';
import { apiClient } from '../services/api';
import { reportViolation } from '../services/violationService';
import type { ViolationResponse } from '../services/violationService.types';
import { DEFAULT_SECURITY_POLICY } from '../types/exam.types';

import ExamDashboard from '../components/exam/ExamDashboard';
import { ExamHeader } from '../components/exam/ExamHeader';
import { QuestionNavigation } from '../components/exam/QuestionNavigation';
import { QuestionDisplay } from '../components/exam/QuestionDisplay';
import { AnswerInput } from '../components/exam/AnswerInput';
import { SubmitButton } from '../components/exam/SubmitButton';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Button } from '../components/ui/Button';
import CodingTest from './CodingTest';
import SubjectiveTest from '../components/exam/SubjectiveTest';
import type { CodingQuestion, SubjectiveQuestion, McqStatus, CodingStatus, SubjectiveStatus } from '../types/exam.types';

type Stage = 'dashboard' | 'mcq' | 'coding' | 'subjective';

// ---- Shared dark-theme overlay styles -------------------------------------------
const OVERLAY_BG: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 200,
  background: 'rgba(10, 10, 15, 0.97)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
};

const OVERLAY_CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '1.25rem',
  padding: '2.5rem',
  maxWidth: '28rem',
  width: '100%',
  boxShadow: '0 32px 64px rgba(0,0,0,0.5)',
  textAlign: 'center',
  color: '#f0f0f5',
};

const ICON_BOX = (color: string): React.CSSProperties => ({
  width: 80, height: 80, borderRadius: '50%',
  background: `color-mix(in srgb, ${color} 15%, transparent)`,
  border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  margin: '0 auto 1.5rem',
});
// ---------------------------------------------------------------------------------

export const ExamPage = () => {
  const { examId, sessionToken } = useParams<{ examId: string; sessionToken: string }>();
  const navigate = useNavigate();

  const enterFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.error('[FS] Unable to enter fullscreen:', err);
    }
  };

  // ---- Section FSM state (persisted) -------------------------------------------
  const [stage, setStageRaw] = useState<Stage>('dashboard');
  const [currentQuestionIndex, setCurrentQuestionIndexRaw] = useState(0);
  const [mcqStatus, setMcqStatusRaw] = useState<McqStatus>('not_started');
  const [codingStatus, setCodingStatusRaw] = useState<CodingStatus>('locked');
  const [subjectiveStatus, setSubjectiveStatusRaw] = useState<SubjectiveStatus>('locked');
  const [sectionsInitialized, setSectionsInitialized] = useState(false);

  // ---- Confirmation dialogs ----------------------------------------------------
  const [leaveSectionPending, setLeaveSectionPending] = useState<Stage | null>(null);

  // ---- Security violation state ------------------------------------------------
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [windowBlurCount, setWindowBlurCount] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const [tabWarningMsg, setTabWarningMsg] = useState('');

  // Fullscreen security state
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
  const [showFullscreenOverlay, setShowFullscreenOverlay] = useState(false);
  const [fullscreenViolationCount, setFullscreenViolationCount] = useState(0);

  // Termination state
  const [isTerminated, setIsTerminated] = useState(false);
  const [terminationReason, setTerminationReason] = useState('');

  const {
    examSession,
    loading,
    error,
    initializeExam,
    updateAnswer,
    submitExam,
  } = useExamSession();

  // Derived: security policy from exam (always falls back to defaults if missing)
  const policy = useMemo(
    () => examSession?.exam.securityPolicy ?? DEFAULT_SECURITY_POLICY,
    [examSession]
  );

  // ---- Persisted state setters -------------------------------------------------
  const setStage = useCallback((s: Stage) => {
    setStageRaw(s);
    if (examId) StorageService.saveExamStage(examId, s);
  }, [examId]);

  const setCurrentQuestionIndex = useCallback((idx: number | ((prev: number) => number)) => {
    setCurrentQuestionIndexRaw((prev) => {
      const next = typeof idx === 'function' ? idx(prev) : idx;
      if (examId) StorageService.saveCurrentQuestion(examId, next);
      return next;
    });
  }, [examId]);

  const setMcqStatus = useCallback((s: McqStatus) => {
    setMcqStatusRaw(s);
    if (examId) StorageService.saveSectionStatuses(examId, { mcqStatus: s, codingStatus, subjectiveStatus });
  }, [examId, codingStatus, subjectiveStatus]);

  const setCodingStatus = useCallback((s: CodingStatus) => {
    setCodingStatusRaw(s);
    if (examId) StorageService.saveSectionStatuses(examId, { mcqStatus, codingStatus: s, subjectiveStatus });
  }, [examId, mcqStatus, subjectiveStatus]);

  const setSubjectiveStatus = useCallback((s: SubjectiveStatus) => {
    setSubjectiveStatusRaw(s);
    if (examId) StorageService.saveSectionStatuses(examId, { mcqStatus, codingStatus, subjectiveStatus: s });
  }, [examId, mcqStatus, codingStatus]);

  // ---- Initialize exam ---------------------------------------------------------
  useEffect(() => {
    if (examId && sessionToken) {
      const startExam = async () => {
        const ok = window.confirm(
          'The exam will now start in Full Screen mode.\n\nLeaving Full Screen will automatically submit your exam.'
        );
        if (!ok) { navigate('/dashboard'); return; }

        await enterFullscreen();

        initializeExam(examId, sessionToken).catch((err) => {
          if (err instanceof AlreadySubmittedError) {
            StorageService.clearExamData(examId);
            navigate('/exam/submit-success?reason=already_submitted');
            return;
          }
          navigate(`/exam/error?message=${encodeURIComponent(err.message)}&code=LOAD_FAILED`);
        });
      };
      startExam();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId, sessionToken]);

  // ---- Restore stage from storage after session loads --------------------------
  useEffect(() => {
    if (!examSession || !examId || sectionsInitialized) return;

    const savedStage = StorageService.loadExamStage(examId) as Stage | null;
    const savedIndex = StorageService.loadCurrentQuestion(examId);
    const savedStatuses = StorageService.loadSectionStatuses(examId);

    const hasMcq = examSession.exam.questions.filter(q => q.type !== 'coding' && q.type !== 'descriptive').length > 0;
    const hasCoding = examSession.exam.questions.filter(q => q.type === 'coding').length > 0;
    const hasSubjective = (examSession.exam.descriptiveQuestions || []).length > 0;

    if (savedStatuses) {
      setMcqStatusRaw(savedStatuses.mcqStatus as McqStatus);
      setCodingStatusRaw(savedStatuses.codingStatus as CodingStatus);
      setSubjectiveStatusRaw((savedStatuses.subjectiveStatus as SubjectiveStatus) || 'locked');
      if (savedStage) {
        const stageValid =
          savedStage === 'dashboard' ||
          (savedStage === 'mcq' && hasMcq) ||
          (savedStage === 'coding' && hasCoding) ||
          (savedStage === 'subjective' && hasSubjective);
        setStageRaw(stageValid ? savedStage : 'dashboard');
      }
      if (savedIndex) setCurrentQuestionIndexRaw(savedIndex);
    } else {
      const initMcq: McqStatus = hasMcq ? 'not_started' : 'completed';
      const initCoding: CodingStatus = hasCoding ? (hasMcq ? 'locked' : 'not_started') : 'completed';
      const initSubjective: SubjectiveStatus = hasSubjective ? (hasMcq || hasCoding ? 'locked' : 'not_started') : 'completed';
      setMcqStatusRaw(initMcq);
      setCodingStatusRaw(initCoding);
      setSubjectiveStatusRaw(initSubjective);
      StorageService.saveSectionStatuses(examId, { mcqStatus: initMcq, codingStatus: initCoding, subjectiveStatus: initSubjective });
    }

    setSectionsInitialized(true);
  }, [examSession, examId, sectionsInitialized]);

  const mcqQuestions = useMemo(
    () => (examSession ? examSession.exam.questions.filter(q => q.type !== 'coding' && q.type !== 'descriptive') : []),
    [examSession]
  );
  const codingQuestions = useMemo(
    () => (examSession ? (examSession.exam.questions.filter(q => q.type === 'coding') as CodingQuestion[]) : []),
    [examSession]
  );
  const subjectiveQuestions = useMemo(
    () => (examSession ? ((examSession.exam.descriptiveQuestions || []) as SubjectiveQuestion[]) : []),
    [examSession]
  );

  // ---- Auto-save ---------------------------------------------------------------
  const { saving, lastSaved, error: autoSaveError } = useAutoSave({
    attemptId: examSession?.attempt.id || null,
    answers: examSession?.currentAnswers || {},
    enabled: !!examSession,
  });

  const submittingRef = useRef(false);

  // ---- Timer with auto-submit --------------------------------------------------
  const { timeRemaining, formatTime, isWarning } = useTimer({
    endTime: examSession?.attempt.endTime || null,
    serverTime: examSession?.serverTime,
    onTimeUp: async () => {
      if (examSession && !submittingRef.current) {
        submittingRef.current = true;
        try {
          const result = await submitExam();
          if (examId) StorageService.clearExamData(examId);
          navigate(`/exam/submit-success?autoSubmit=true&score=${result.score}&percentage=${result.percentage}`);
        } catch {
          submittingRef.current = false;
          navigate('/exam/error?message=Failed%20to%20submit%20exam');
        }
      }
    },
  });

  useHeartbeat(examSession?.attempt.id || null);

  // ---- Central enforcement handler for ANY violation response ------------------
  // Caller passes the backend ViolationResponse; this function handles the action.
  const examSessionRef = useRef(examSession);
  useEffect(() => { examSessionRef.current = examSession; }, [examSession]);

  const handleEnforcement = useCallback(async (response: ViolationResponse, violationType: string) => {
    if (!response) return;

    if (response.action === 'TERMINATE' || response.action === 'AUTO_SUBMIT') {
      setIsTerminated(true);
      setTerminationReason(response.reason || `${violationType} limit exceeded`);
      setShowFullscreenOverlay(false);
      setShowTabWarning(false);
      if (!submittingRef.current) {
        submittingRef.current = true;
        setTimeout(async () => {
          try {
            const result = await submitExam();
            if (examId) StorageService.clearExamData(examId);
            navigate(`/exam/submit-success?autoSubmit=true&reason=${violationType}&score=${result.score}&percentage=${result.percentage}`);
          } catch { /* already logging */ }
        }, 1500);
      }
    }
    // On WARNING: show warning overlay/banner; exam continues
  }, [submitExam, examId, navigate]);

  // ---- Fullscreen enforcement --------------------------------------------------
  useEffect(() => {
    const handleFullscreenChange = async () => {
      const nowFullscreen = !!document.fullscreenElement;
      setIsFullscreen(nowFullscreen);

      if (nowFullscreen) {
        setShowFullscreenOverlay(false);
        return;
      }

      const session = examSessionRef.current;
      if (!session || submittingRef.current || isTerminated) return;

      setShowFullscreenOverlay(true);
      setFullscreenViolationCount(prev => prev + 1);

      try {
        const res = await apiClient.post('/api/exam-attempts/report-violation', {
          attemptId: session.attempt.id,
          type: 'fullscreen_exit',
          metadata: { timestamp: new Date().toISOString() },
        });
        await handleEnforcement(res.data, 'fullscreen_exit');
      } catch (err) {
        console.error('[FS] Failed to report fullscreen violation:', err);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTerminated, handleEnforcement]);

  // ---- Tab switch violation ----------------------------------------------------
  useTabVisibility({
    attemptId: examSession?.attempt.id || null,
    onTabSwitch: async (response) => {
      if (isTerminated || submittingRef.current) return;
      setTabSwitchCount(prev => {
        const next = prev + 1;
        const remaining = Math.max(0, policy.tabSwitchLimit - next);
        setTabWarningMsg(`Tab switch recorded (${next}/${policy.tabSwitchLimit}). ${remaining} warning${remaining === 1 ? '' : 's'} remaining.`);
        setShowTabWarning(true);
        return next;
      });
      await handleEnforcement(response, 'tab_switch');
    },
    onWindowBlur: async (response) => {
      if (isTerminated || submittingRef.current) return;
      setWindowBlurCount(prev => {
        const next = prev + 1;
        const remaining = Math.max(0, policy.windowBlurLimit - next);
        setTabWarningMsg(`Window focus lost (${next}/${policy.windowBlurLimit}). ${remaining} remaining.`);
        setShowTabWarning(true);
        return next;
      });
      await handleEnforcement(response, 'window_blur');
    },
  });

  // Auto-hide tab warning banner
  useEffect(() => {
    if (!showTabWarning) return;
    const id = setTimeout(() => setShowTabWarning(false), 5000);
    return () => clearTimeout(id);
  }, [showTabWarning]);

  // ---- DevTools detection ------------------------------------------------------
  useDevToolsDetection({
    attemptId: examSession?.attempt.id || null,
    enabled: !isTerminated && !!examSession,
    onDetected: async (response) => {
      await handleEnforcement(response, 'devtools_open');
    },
  });

  // ---- Keyboard shortcut blocking ----------------------------------------------
  // Blocks copy/paste/cut/select-all/print/save/view-source/devtools/refresh
  // RIGHT-CLICK is blocked via contextmenu event below.
  // BROWSER LIMITATION: F12, Ctrl+Shift+I/J may not be blockable in all browsers
  // (Firefox ignores preventDefault for F12). We still report the violation.
  useEffect(() => {
    if (!examSession || isTerminated) return;

    const BLOCKED_COMBOS: Array<{ ctrl?: boolean; shift?: boolean; key: string; violation?: string }> = [
      // Copy/Paste/Cut — mapped to copy_attempt/paste_attempt/cut_attempt
      { ctrl: true, key: 'c', violation: 'copy_attempt' },
      { ctrl: true, key: 'v', violation: 'paste_attempt' },
      { ctrl: true, key: 'x', violation: 'cut_attempt' },
      // Select all
      { ctrl: true, key: 'a', violation: 'keyboard_shortcut' },
      // Print
      { ctrl: true, key: 'p', violation: 'keyboard_shortcut' },
      // Save page source
      { ctrl: true, key: 's', violation: 'keyboard_shortcut' },
      // View source
      { ctrl: true, key: 'u', violation: 'keyboard_shortcut' },
      // Find
      { ctrl: true, key: 'f', violation: 'keyboard_shortcut' },
      // DevTools — Ctrl+Shift+I / Ctrl+Shift+J
      { ctrl: true, shift: true, key: 'i', violation: 'devtools_open' },
      { ctrl: true, shift: true, key: 'j', violation: 'devtools_open' },
      // F12 (DevTools)
      { key: 'F12', violation: 'devtools_open' },
      // Reload shortcuts
      { key: 'F5', violation: 'keyboard_shortcut' },
      { ctrl: true, key: 'r', violation: 'keyboard_shortcut' },
    ];

    const handleKeyDown = async (e: KeyboardEvent) => {
      for (const combo of BLOCKED_COMBOS) {
        const ctrlMatch = combo.ctrl ? (e.ctrlKey || e.metaKey) : true;
        const shiftMatch = combo.shift ? e.shiftKey : !e.shiftKey || !combo.ctrl; // only enforce shift when specified
        const keyMatch = e.key === combo.key || e.key.toLowerCase() === combo.key.toLowerCase();

        // For F-key combos, don't require ctrl/shift
        const isFKey = combo.key.startsWith('F');

        if (isFKey && keyMatch) {
          e.preventDefault();
          e.stopPropagation();
          if (combo.violation && examSession?.attempt.id) {
            try {
              const res = await reportViolation(examSession.attempt.id, combo.violation as any, { key: e.key });
              await handleEnforcement(res, combo.violation!);
            } catch { /* queued */ }
          }
          return;
        }

        if (combo.ctrl && ctrlMatch && keyMatch && shiftMatch) {
          e.preventDefault();
          e.stopPropagation();
          if (combo.violation && examSession?.attempt.id) {
            try {
              const res = await reportViolation(examSession.attempt.id, combo.violation as any, { key: e.key, ctrl: e.ctrlKey, shift: e.shiftKey });
              await handleEnforcement(res, combo.violation!);
            } catch { /* queued */ }
          }
          return;
        }
      }
    };

    // Block context menu (right-click)
    const handleContextMenu = async (e: MouseEvent) => {
      e.preventDefault();
      if (examSession?.attempt.id) {
        try {
          const res = await reportViolation(examSession.attempt.id, 'right_click', {});
          await handleEnforcement(res, 'right_click');
        } catch { /* queued */ }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('contextmenu', handleContextMenu, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('contextmenu', handleContextMenu, true);
    };
  }, [examSession, isTerminated, handleEnforcement]);

  // ---- Navigation guard --------------------------------------------------------
  const requestStageChange = useCallback((target: Stage) => {
    if (stage === 'mcq' || stage === 'coding') {
      setLeaveSectionPending(target);
    } else {
      setStage(target);
    }
  }, [stage, setStage]);

  const confirmLeaveSection = useCallback(() => {
    if (leaveSectionPending) setStage(leaveSectionPending);
    setLeaveSectionPending(null);
  }, [leaveSectionPending, setStage]);

  const cancelLeaveSection = useCallback(() => setLeaveSectionPending(null), []);

  // ---- Final submit handler ----------------------------------------------------
  const handleFinalSubmit = async () => {
    try {
      const result = await submitExam();
      if (examId) StorageService.clearExamData(examId);
      navigate(`/exam/submit-success?score=${result.score}&percentage=${result.percentage}`);
    } catch (err) {
      console.error('Final submit failed:', err);
      navigate('/exam/error?message=Failed%20to%20submit%20exam');
    }
  };

  // =============================================================================
  // OVERLAY RENDERS
  // =============================================================================

  // ---- Terminated screen -------------------------------------------------------
  if (isTerminated) {
    return (
      <div style={{ ...OVERLAY_BG, zIndex: 300 }}>
        <div style={OVERLAY_CARD}>
          <div style={ICON_BOX('#f43f5e')}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem', color: '#f0f0f5' }}>Exam Terminated</h2>
          <p style={{ color: '#8b8ba0', marginBottom: '1.5rem', fontSize: '0.9375rem' }}>
            Your exam has been automatically terminated due to a security policy violation.
          </p>
          <div style={{
            background: 'rgba(244,63,94,0.1)',
            border: '1px solid rgba(244,63,94,0.25)',
            borderRadius: '0.75rem',
            padding: '1rem',
            marginBottom: '1.5rem',
            textAlign: 'left',
          }}>
            <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#fb7185', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>
              Termination Reason
            </p>
            <p style={{ fontSize: '0.875rem', color: '#fda4af' }}>
              {terminationReason || 'Security policy violation limit exceeded.'}
            </p>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#4a4a60' }}>
            Your answers have been auto-submitted. Contact your invigilator for further assistance.
          </p>
        </div>
      </div>
    );
  }

  // ---- Fullscreen required overlay ---------------------------------------------
  const fullscreenOverlay = showFullscreenOverlay ? (
    <div style={{ ...OVERLAY_BG, zIndex: 150 }}>
      <div style={OVERLAY_CARD}>
        <div style={ICON_BOX('#f59e0b')}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem', color: '#f0f0f5' }}>Fullscreen Required</h2>
        <p style={{ color: '#8b8ba0', marginBottom: '0.75rem', fontSize: '0.9375rem' }}>
          You exited fullscreen mode. This exam must be taken in fullscreen.
        </p>
        <p style={{ fontSize: '0.875rem', color: '#fbbf24', fontWeight: 600, marginBottom: '1.5rem' }}>
          Violation {fullscreenViolationCount} of {policy.fullscreenExitLimit} recorded.
        </p>
        <button
          onClick={async () => {
            try { await document.documentElement.requestFullscreen(); }
            catch (err) { console.error('[FS] requestFullscreen failed:', err); }
          }}
          style={{
            width: '100%', padding: '0.875rem 1.5rem',
            background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
            color: '#fff', borderRadius: '0.75rem', fontWeight: 700,
            fontSize: '1rem', border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(139,92,246,0.4)',
          }}
        >
          Resume Exam (Re-enter Fullscreen)
        </button>
        <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#4a4a60' }}>
          You cannot interact with the exam until you return to fullscreen.
        </p>
      </div>
    </div>
  ) : null;

  // ---- Tab warning banner (policy-aware) ----------------------------------------
  const tabWarningBanner = showTabWarning ? (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 140,
      background: 'rgba(239,68,68,0.95)', backdropFilter: 'blur(8px)',
      color: '#fff', textAlign: 'center', padding: '0.875rem 1rem',
      fontWeight: 600, fontSize: '0.875rem',
      boxShadow: '0 4px 20px rgba(239,68,68,0.4)',
    }}>
      ⚠ Security Warning: {tabWarningMsg}
    </div>
  ) : null;

  // ---- Leave section confirmation modal ----------------------------------------
  const leaveConfirmModal = leaveSectionPending ? (
    <div style={{ ...OVERLAY_BG, zIndex: 100 }}>
      <div style={{ ...OVERLAY_CARD, textAlign: 'left' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: '#f0f0f5' }}>
          Leave This Section?
        </h2>
        <p style={{ color: '#8b8ba0', marginBottom: '1.5rem', fontSize: '0.9375rem' }}>
          You are about to leave the current section. Your answers are saved. You can return at any time before final submission.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={cancelLeaveSection}>Stay Here</Button>
          <Button variant="default" onClick={confirmLeaveSection}>Leave Section</Button>
        </div>
      </div>
    </div>
  ) : null;

  // =============================================================================
  // LOADING / ERROR STATES
  // =============================================================================

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f17' }}>
        <LoadingSpinner message="Loading exam..." size="lg" />
      </div>
    );
  }

  if (error || !examSession) {
    return (
      <div style={{ ...OVERLAY_BG, background: '#0f0f17', position: 'relative' }}>
        <div style={OVERLAY_CARD}>
          <div style={ICON_BOX('#f43f5e')}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: '#f0f0f5' }}>Error Loading Exam</h2>
          <p style={{ color: '#8b8ba0', marginBottom: '1.5rem', fontSize: '0.875rem' }}>{error || 'Failed to load exam'}</p>
          <Button variant="default" onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  // =============================================================================
  // STAGE RENDERS
  // =============================================================================

  // ---- Stage: Dashboard --------------------------------------------------------
  if (stage === 'dashboard') {
    const mcqMarks = mcqQuestions.reduce((sum, q) => sum + (q.marks || 0), 0);
    const codingMarks = codingQuestions.reduce((sum, q) => sum + (q.marks || 0), 0);
    const subjectiveMarks = subjectiveQuestions.reduce((sum, q) => sum + (q.maxMarks || 0), 0);

    return (
      <>
        {fullscreenOverlay}
        {tabWarningBanner}
        {leaveConfirmModal}
        <ExamDashboard
          companyName={examSession.exam.title}
          examTitle={examSession.exam.title}
          totalMarks={examSession.exam.totalMarks}
          candidateName={examSession.student.name}
          candidateId={examSession.student.id}
          timeRemainingSeconds={timeRemaining}
          mcqStatus={mcqStatus}
          mcqMeta={{
            itemCountLabel: `${mcqQuestions.length} Question${mcqQuestions.length === 1 ? '' : 's'}`,
            marks: mcqMarks,
          }}
          codingStatus={codingStatus}
          codingMeta={{
            itemCountLabel: `${codingQuestions.length} Problem${codingQuestions.length === 1 ? '' : 's'}`,
            marks: codingMarks,
          }}
          subjectiveStatus={subjectiveQuestions.length > 0 ? subjectiveStatus : undefined}
          subjectiveMeta={subjectiveQuestions.length > 0 ? {
            itemCountLabel: `${subjectiveQuestions.length} Question${subjectiveQuestions.length === 1 ? '' : 's'}`,
            marks: subjectiveMarks,
          } : undefined}
          onStartMcq={() => { setMcqStatus('in_progress'); setStage('mcq'); }}
          onContinueMcq={() => setStage('mcq')}
          onReviewMcq={() => setStage('mcq')}
          onStartCoding={() => { setCodingStatus('in_progress'); setStage('coding'); }}
          onContinueCoding={() => setStage('coding')}
          onReviewCoding={() => setStage('coding')}
          onStartSubjective={() => { setSubjectiveStatus('in_progress'); setStage('subjective'); }}
          onContinueSubjective={() => setStage('subjective')}
          onReviewSubjective={() => setStage('subjective')}
          onSubmitExam={handleFinalSubmit}
        />
      </>
    );
  }

  // ---- Stage: Coding -----------------------------------------------------------
  if (stage === 'coding') {
    return (
      <>
        {fullscreenOverlay}
        {tabWarningBanner}
        {leaveConfirmModal}
        <CodingTest
          questions={codingQuestions}
          attemptId={examSession.attempt.id}
          examId={examSession.attempt.examId}
          onFinish={() => {
            setCodingStatus('completed');
            if (subjectiveQuestions.length > 0 && subjectiveStatus === 'locked') {
              setSubjectiveStatus('not_started');
            }
            setStage('dashboard');
          }}
        />
      </>
    );
  }

  // ---- Stage: Subjective -------------------------------------------------------
  if (stage === 'subjective') {
    return (
      <>
        {fullscreenOverlay}
        {tabWarningBanner}
        {leaveConfirmModal}
        <SubjectiveTest
          questions={subjectiveQuestions}
          answers={examSession.currentAnswers}
          onAnswerChange={updateAnswer}
          onFinish={() => {
            setSubjectiveStatus('completed');
            setStage('dashboard');
          }}
        />
      </>
    );
  }

  // ---- Stage: MCQ --------------------------------------------------------------
  const currentQuestion = mcqQuestions[currentQuestionIndex];
  const answeredQuestions = Object.keys(examSession.currentAnswers).filter(id =>
    mcqQuestions.some(q => q.id === id)
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--exam-bg, #0f0f17)', display: 'flex', flexDirection: 'column' }}>
      {fullscreenOverlay}
      {tabWarningBanner}
      {leaveConfirmModal}

      <ExamHeader
        title={examSession.exam.title}
        timeRemaining={formatTime(timeRemaining)}
        studentName={examSession.student.name}
        saving={saving}
        lastSaved={lastSaved}
        isWarning={isWarning}
      />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <QuestionNavigation
          questions={mcqQuestions}
          currentIndex={currentQuestionIndex}
          answeredQuestions={answeredQuestions}
          onQuestionClick={setCurrentQuestionIndex}
        />

        <main style={{ flex: 1, overflowY: 'auto', padding: '2rem' }} className="custom-scrollbar">
          <div style={{ marginBottom: '1rem' }}>
            <Button variant="secondary" onClick={() => requestStageChange('dashboard')}>
              ← Back to Dashboard
            </Button>
          </div>

          <QuestionDisplay
            question={currentQuestion}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={mcqQuestions.length}
          />

          <AnswerInput
            question={currentQuestion}
            currentAnswer={examSession.currentAnswers[currentQuestion.id] || ''}
            onAnswerChange={(answer) => updateAnswer(currentQuestion.id, answer)}
          />

          {autoSaveError && (
            <div style={{
              marginTop: '1rem', padding: '1rem',
              background: 'rgba(244,63,94,0.1)',
              border: '1px solid rgba(244,63,94,0.2)',
              borderRadius: '0.75rem',
            }}>
              <p style={{ fontSize: '0.875rem', color: '#fb7185' }}>
                {autoSaveError}. Don't worry, your answers are saved locally.
              </p>
            </div>
          )}

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              variant="secondary"
              onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
            >
              ← Previous
            </Button>

            <span style={{ fontSize: '0.875rem', color: '#8b8ba0' }}>
              Question {currentQuestionIndex + 1} of {mcqQuestions.length}
            </span>

            {currentQuestionIndex < mcqQuestions.length - 1 ? (
              <Button variant="default" onClick={() => setCurrentQuestionIndex(prev => prev + 1)}>
                Next →
              </Button>
            ) : (
              <SubmitButton
                onSubmit={async () => {
                  setMcqStatus('completed');
                  if (codingQuestions.length > 0 && codingStatus === 'locked') {
                    setCodingStatus('not_started');
                  } else if (subjectiveQuestions.length > 0 && subjectiveStatus === 'locked') {
                    setSubjectiveStatus('not_started');
                  }
                  requestStageChange('dashboard');
                }}
                answeredCount={answeredQuestions.length}
                totalQuestions={mcqQuestions.length}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};