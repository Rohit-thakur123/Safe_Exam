// // Main App component with routing and security features
// import { useEffect } from 'react';
// import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// import { ErrorBoundary } from './components/ErrorBoundary';
// import { ExamPage } from './pages/ExamPage';
// import { SubmitSuccessPage } from './pages/SubmitSuccessPage';
// import { ErrorPage } from './pages/ErrorPage';
// import { NotFoundPage } from './pages/NotFoundPage';

// function App() {
//   // Security: Disable copy, cut, paste, and right-click
//   useEffect(() => {
//     const preventCopy = (e: ClipboardEvent) => {
//       e.preventDefault();
//       return false;
//     };
    
//     const preventCut = (e: ClipboardEvent) => {
//       e.preventDefault();
//       return false;
//     };
    
//     const preventPaste = (e: ClipboardEvent) => {
//       e.preventDefault();
//       return false;
//     };
    
//     const preventContextMenu = (e: MouseEvent) => {
//       e.preventDefault();
//       return false;
//     };
    
//     const preventKeyboardShortcuts = (e: KeyboardEvent) => {
//       // Prevent common keyboard shortcuts
//       if (
//         (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'x' || e.key === 'a' || e.key === 'p')) ||
//         (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
//         e.key === 'F12' ||
//         (e.ctrlKey && e.key === 'u')
//       ) {
//         e.preventDefault();
//         return false;
//       }
//     };
    
//     document.addEventListener('copy', preventCopy);
//     document.addEventListener('cut', preventCut);
//     document.addEventListener('paste', preventPaste);
//     document.addEventListener('contextmenu', preventContextMenu);
//     document.addEventListener('keydown', preventKeyboardShortcuts);
    
//     return () => {
//       document.removeEventListener('copy', preventCopy);
//       document.removeEventListener('cut', preventCut);
//       document.removeEventListener('paste', preventPaste);
//       document.removeEventListener('contextmenu', preventContextMenu);
//       document.removeEventListener('keydown', preventKeyboardShortcuts);
//     };
//   }, []);
  
//   // Prevent text selection globally
//   useEffect(() => {
//     document.body.classList.add('no-select');
//     return () => {
//       document.body.classList.remove('no-select');
//     };
//   }, []);

//   return (
//     <ErrorBoundary>
//       <BrowserRouter>
//         <Routes>
//           {/* Main exam route */}
//           <Route path="/exam/:examId/:sessionToken" element={<ExamPage />} />
          
//           {/* Success page after submission */}
//           <Route path="/exam/submit-success" element={<SubmitSuccessPage />} />
          
//           {/* Error page */}
//           <Route path="/exam/error" element={<ErrorPage />} />
          
//           {/* Default redirect to error (no home page needed) */}
//           <Route path="/" element={<Navigate to="/exam/error?message=No%20exam%20link%20provided&code=INVALID_ACCESS" replace />} />
          
//           {/* 404 page */}
//           <Route path="*" element={<NotFoundPage />} />
//         </Routes>
//       </BrowserRouter>
//     </ErrorBoundary>
//   );
// }

// export default App;

import CodingTest from "./pages/CodingTest";

function App() {
  return <CodingTest />;
}

export default App;