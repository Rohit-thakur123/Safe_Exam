// =====================================================================================
// EditorPanel.tsx
// Monaco-powered code editor with sticky toolbar, language switcher and action buttons.
// =====================================================================================

import React, { useCallback, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import type { OnMount } from "@monaco-editor/react";
import type { editor as MonacoEditorNS } from "monaco-editor";
import {
  Play,
  Send,
  RotateCcw,
  ChevronDown,
  Loader2,
  Check,
  Maximize2,
  Minimize2,
} from "lucide-react";

interface EditorPanelProps {
  supportedLanguages: string[];
  language: string;
  sourceCode: string;
  onLanguageChange: (language: string) => void;
  onCodeChange: (code: string) => void;
  onRun: () => void;
  onSubmit: () => void;
  onReset: () => void;
  isRunning: boolean;
  isSubmitting: boolean;
  saveStatus: "idle" | "saving" | "saved";
}

const languageToMonacoId: Record<string, string> = {
  javascript: "javascript",
  typescript: "typescript",
  python: "python",
  python3: "python",
  java: "java",
  cpp: "cpp",
  "c++": "cpp",
  c: "c",
  csharp: "csharp",
  "c#": "csharp",
  go: "go",
  golang: "go",
  rust: "rust",
  ruby: "ruby",
  kotlin: "kotlin",
  swift: "swift",
  php: "php",
};

const getMonacoLanguage = (language: string): string => {
  const key = language.toLowerCase();
  return languageToMonacoId[key] ?? "plaintext";
};

const languageDisplayNames: Record<string, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
  python3: "Python 3",
  java: "Java",
  cpp: "C++",
  "c++": "C++",
  c: "C",
  csharp: "C#",
  "c#": "C#",
  go: "Go",
  golang: "Go",
  rust: "Rust",
  ruby: "Ruby",
  kotlin: "Kotlin",
  swift: "Swift",
  php: "PHP",
};

const getLanguageDisplayName = (language: string): string =>
  languageDisplayNames[language.toLowerCase()] ?? language;

const EditorPanel: React.FC<EditorPanelProps> = ({
  supportedLanguages,
  language,
  sourceCode,
  onLanguageChange,
  onCodeChange,
  onRun,
  onSubmit,
  onReset,
  isRunning,
  isSubmitting,
  saveStatus,
}) => {
  const [isLangMenuOpen, setIsLangMenuOpen] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const editorRef = useRef<MonacoEditorNS.IStandaloneCodeEditor | null>(null);

  const isBusy = isRunning || isSubmitting;

  const handleEditorMount: OnMount = useCallback(
    (editorInstance, monaco) => {
      editorRef.current = editorInstance;

      editorInstance.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
        () => {
          onRun();
        }
      );

      editorInstance.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
        () => {
          onSubmit();
        }
      );
    },
    [onRun, onSubmit]
  );

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      onCodeChange(value ?? "");
    },
    [onCodeChange]
  );

  const handleResetClick = () => {
    if (showResetConfirm) {
      onReset();
      setShowResetConfirm(false);
    } else {
      setShowResetConfirm(true);
      window.setTimeout(() => setShowResetConfirm(false), 3000);
    }
  };

  return (
    <div
      className={`flex flex-col h-full min-h-0 rounded-2xl border border-white/10 bg-[#0d0d13] shadow-xl overflow-hidden ${
        isFullscreen ? "fixed inset-4 z-50" : "relative"
      }`}
    >
      {/* Sticky toolbar */}
      <div className="sticky top-0 z-20 flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10 bg-[#0d0d13]/95 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {/* Language dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsLangMenuOpen((prev) => !prev)}
              disabled={isBusy}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] transition-colors px-3 py-1.5 text-sm font-medium text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_8px_2px_rgba(139,92,246,0.6)]" />
              {getLanguageDisplayName(language)}
              <ChevronDown
                size={14}
                className={`text-slate-500 transition-transform duration-200 ${
                  isLangMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {isLangMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsLangMenuOpen(false)}
                />
                <div className="absolute left-0 top-full mt-2 w-48 rounded-xl border border-white/10 bg-[#15151d] shadow-2xl shadow-black/50 overflow-hidden z-20 py-1">
                  {supportedLanguages.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => {
                        onLanguageChange(lang);
                        setIsLangMenuOpen(false);
                      }}
                      className={`w-full text-left flex items-center justify-between px-3.5 py-2 text-sm transition-colors ${
                        lang === language
                          ? "text-violet-300 bg-violet-500/10"
                          : "text-slate-300 hover:bg-white/[0.06]"
                      }`}
                    >
                      {getLanguageDisplayName(lang)}
                      {lang === language && <Check size={14} />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Save status */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
            {saveStatus === "saving" && (
              <>
                <Loader2 size={12} className="animate-spin" />
                <span>Saving draft…</span>
              </>
            )}
            {saveStatus === "saved" && (
              <>
                <Check size={12} className="text-emerald-400" />
                <span>Draft saved</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetClick}
            disabled={isBusy}
            title="Reset to starter code"
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
              showResetConfirm
                ? "border-rose-400/40 bg-rose-400/10 text-rose-300"
                : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
            }`}
          >
            <RotateCcw size={14} />
            <span className="hidden md:inline">
              {showResetConfirm ? "Confirm Reset" : "Reset"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen((prev) => !prev)}
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] transition-colors px-2.5 py-1.5 text-slate-300"
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>

          <button
            type="button"
            onClick={onRun}
            disabled={isBusy}
            title="Run (Ctrl+Enter)"
            className="flex items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-400/10 hover:bg-emerald-400/20 transition-colors px-3.5 py-1.5 text-sm font-semibold text-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Play size={14} />
            )}
            Run
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={isBusy}
            title="Submit (Ctrl+S)"
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all duration-200 px-3.5 py-1.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/40 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
            Submit
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          theme="vs-dark"
          language={getMonacoLanguage(language)}
          value={sourceCode}
          onChange={handleEditorChange}
          onMount={handleEditorMount}
          options={{
            fontSize: 14,
            fontFamily:
              "'JetBrains Mono', 'Fira Code', Menlo, Monaco, Consolas, monospace",
            fontLigatures: true,
            minimap: { enabled: false },
            automaticLayout: true,
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: "smooth",
            padding: { top: 16, bottom: 16 },
            renderLineHighlight: "gutter",
            lineNumbersMinChars: 3,
            tabSize: 2,
            readOnly: isBusy,
          }}
        />
      </div>
    </div>
  );
};

export default EditorPanel;