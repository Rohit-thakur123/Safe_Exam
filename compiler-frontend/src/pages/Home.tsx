import { useEffect, useMemo, useState } from 'react';
import { CompilerEditor } from '../components/CompilerEditor';
import { runCode } from '../services/compiler.service';
import { Language } from '../types/compiler.types';
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut';

const languages: { label: string; value: Language }[] = [
  { label: 'Python', value: 'python' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'Java', value: 'java' },
  { label: 'C', value: 'c' },
  { label: 'C++', value: 'cpp' },
];

export function Home() {
  const defaultLanguage = (import.meta.env.VITE_DEFAULT_LANGUAGE as Language) || 'python';
  const [language, setLanguage] = useState<Language>(defaultLanguage);
  const [code, setCode] = useState('');
  const [stdin, setStdin] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setOutput('');
    setError(null);
  }, [language]);

  const languageLabel = useMemo(
    () => languages.find((item) => item.value === language)?.label ?? 'Code',
    [language]
  );

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    setOutput('');

    try {
      const response = await runCode({ language, code, stdin });
      const payload = response.data;
      const report: string[] = [];

      if (payload.compileError) {
        report.push(`Compile error:\n${payload.compileError}`);
      }
      if (payload.stderr) {
        report.push(`Stderr:\n${payload.stderr}`);
      }
      if (payload.stdout) {
        report.push(`Stdout:\n${payload.stdout}`);
      }
      report.push(`Exit code: ${payload.exitCode}`);
      report.push(`Execution time: ${payload.executionTimeMs}ms`);
      report.push(`Memory limit: ${payload.memoryUsageBytes} bytes`);

      setOutput(report.join('\n\n'));
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Unexpected runtime error');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setCode('');
    setStdin('');
    setOutput('');
    setError(null);
  };

  useKeyboardShortcut('Enter', handleRun, { ctrlKey: true });

  return (
    <div className="min-h-screen px-4 py-8 text-slate-100 sm:px-8 lg:px-16">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-8">
        <header className="rounded-3xl border border-slate-700 bg-slate-950/80 p-8 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Online Code Compiler</p>
              <h1 className="mt-3 text-4xl font-semibold text-white">Professional sandboxed development playground</h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-200">{languageLabel}</span>
              <div className="rounded-3xl border border-slate-700 bg-slate-900 p-3 text-sm text-slate-300">
                Shortcut: <span className="font-semibold text-white">Ctrl + Enter</span>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-8 xl:grid-cols-[1.7fr_1fr]">
          <div className="space-y-4">
            <div className="flex flex-col gap-4 rounded-3xl border border-slate-700 bg-slate-950/80 p-5 shadow-xl shadow-slate-950/20 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Editor</p>
                <h2 className="text-2xl font-semibold text-white">Write, run and inspect code safely</h2>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <select
                  className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none transition hover:border-slate-500"
                  value={language}
                  onChange={(event) => setLanguage(event.target.value as Language)}
                >
                  {languages.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleClear}
                    className="rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-medium text-slate-200 transition hover:border-slate-500"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={handleRun}
                    disabled={loading}
                    className="rounded-2xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? 'Running…' : 'Run'}
                  </button>
                </div>
              </div>
            </div>
            <CompilerEditor language={language} value={code} onChange={setCode} onRun={handleRun} />
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-700 bg-slate-950/80 p-6 shadow-xl shadow-slate-950/20">
              <h2 className="text-xl font-semibold text-white">Stdin</h2>
              <textarea
                className="mt-4 min-h-[160px] w-full resize-none rounded-3xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none focus:border-cyan-400"
                value={stdin}
                onChange={(event) => setStdin(event.target.value)}
                placeholder="Enter custom input for your program"
              />
            </div>

            <div className="rounded-3xl border border-slate-700 bg-slate-950/80 p-6 shadow-xl shadow-slate-950/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Output</p>
                  <h2 className="text-xl font-semibold text-white">Execution console</h2>
                </div>
                <span className="rounded-full bg-slate-900 px-3 py-1 text-sm text-slate-300">{languageLabel}</span>
              </div>
              <div className="mt-5 min-h-[240px] rounded-3xl border border-slate-800 bg-slate-900 p-4 text-sm leading-6 text-slate-200">
                {error ? (
                  <pre className="whitespace-pre-wrap text-rose-300">{error}</pre>
                ) : output ? (
                  <pre className="whitespace-pre-wrap">{output}</pre>
                ) : (
                  <p className="text-slate-500">Run your code to view stdout, stderr, and diagnostics.</p>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
