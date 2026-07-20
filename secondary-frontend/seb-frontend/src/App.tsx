// Main App component with routing and security features
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ExamPage } from './pages/ExamPage';
import { SubmitSuccessPage } from './pages/SubmitSuccessPage';
import { ErrorPage } from './pages/ErrorPage';
import { NotFoundPage } from './pages/NotFoundPage';
import DashboardPage from './pages/DashboardPage';

function App() {
  // Phase 2 Security: Block ALL keyboard shortcuts, copy/paste, right-click context menu globally.
  // This is an intentional policy decision — no exceptions are made for Monaco editor.
  useEffect(() => {
    const preventCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      return false;
    };

    const preventCut = (e: ClipboardEvent) => {
      e.preventDefault();
      return false;
    };

    const preventPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      return false;
    };

    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    const preventKeyboardShortcuts = (e: KeyboardEvent) => {
      // Block ALL copy/paste/cut shortcuts
      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase();
        if (
          key === 'c' ||   // Copy
          key === 'v' ||   // Paste
          key === 'x' ||   // Cut
          key === 'a' ||   // Select All
          key === 'p' ||   // Print
          key === 'u' ||   // View Source
          // key === 's' removed — EditorPanel uses Ctrl+S for Submit action
          key === 'o' ||   // Open
          key === 'n' ||   // New window
          key === 'w' ||   // Close tab
          key === 't' ||   // New tab
          key === 'r'      // Refresh
        ) {
          e.preventDefault();
          return false;
        }
        // Block Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C (DevTools)
        if (e.shiftKey && (key === 'i' || key === 'j' || key === 'c')) {
          e.preventDefault();
          return false;
        }
      }
      // Block function keys that open DevTools / refresh
      if (e.key === 'F5' || e.key === 'F12') {
        e.preventDefault();
        return false;
      }
    };

    // DevTools detection via window size heuristic
    const detectDevTools = () => {
      const threshold = 160;
      if (
        window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold
      ) {
        // DevTools is likely open — navigate to error page
        window.location.href = '/exam/error?message=DevTools%20detected.%20Exam%20terminated.&code=DEVTOOLS_DETECTED';
      }
    };

    // Trap browser back/forward buttons during active exam
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
    };

    const preventDragDrop = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    const devToolsInterval = window.setInterval(detectDevTools, 3000);

    window.history.pushState(null, "", window.location.href);
    window.addEventListener('popstate', handlePopState);
    document.addEventListener('copy', preventCopy, true);
    document.addEventListener('cut', preventCut, true);
    document.addEventListener('paste', preventPaste, true);
    document.addEventListener('contextmenu', preventContextMenu, true);
    document.addEventListener('keydown', preventKeyboardShortcuts, true);
    document.addEventListener('dragover', preventDragDrop, true);
    document.addEventListener('drop', preventDragDrop, true);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('copy', preventCopy, true);
      document.removeEventListener('cut', preventCut, true);
      document.removeEventListener('paste', preventPaste, true);
      document.removeEventListener('contextmenu', preventContextMenu, true);
      document.removeEventListener('keydown', preventKeyboardShortcuts, true);
      document.removeEventListener('dragover', preventDragDrop, true);
      document.removeEventListener('drop', preventDragDrop, true);
      window.clearInterval(devToolsInterval);
    };
  }, []);


  // Prevent text selection globally
  useEffect(() => {
    document.body.classList.add('no-select');
    return () => {
      document.body.classList.remove('no-select');
    };
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* IMPORTANT: Static paths must come BEFORE dynamic params.
               /exam/submit-success and /exam/error must be above
               /exam/:examId/:sessionToken or React Router will treat
               'submit-success' and 'error' as the examId param. */}
          <Route path="/exam/submit-success" element={<SubmitSuccessPage />} />
          <Route path="/exam/error" element={<ErrorPage />} />

          {/* Main exam route */}
          <Route path="/exam/:examId/:sessionToken" element={<ExamPage />} />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/exam/error?message=No%20exam%20link%20provided&code=INVALID_ACCESS" replace />} />

          {/* 404 page */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
