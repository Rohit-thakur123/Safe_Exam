import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import {
  ChevronLeft, Save, Plus, Trash2, GripVertical, Eye, CheckCircle,
  AlertCircle, ChevronDown, ChevronUp, Tag, Clock, MemoryStick, Code2
} from 'lucide-react';
import { codingQuestionAPI } from '../../services/api';
import type { CodingExample, CodingQuestion } from '../../types';

// ─── Constants ──────────────────────────────────────────────────────────────

const ALL_LANGUAGES = ['Python', 'Java', 'C++', 'C', 'JavaScript'] as const;

const LANGUAGE_IDS: Record<string, string> = {
  Python: 'python', Java: 'java', 'C++': 'cpp', C: 'c', JavaScript: 'javascript'
};

const DEFAULT_STARTER: Record<string, string> = {
  Python: '# Write your solution here\n\n',
  Java: 'public class Main {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}\n',
  'C++': '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n',
  C: '#include <stdio.h>\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n',
  JavaScript: '// Write your solution here\n\n'
};

type SectionId = 'basic' | 'problem' | 'examples' | 'languages' | 'starter';

// ─── Section wrapper ─────────────────────────────────────────────────────────

const Section: React.FC<{
  id: SectionId;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}> = ({ title, subtitle, badge, badgeColor = 'bg-indigo-50 text-indigo-700', open, onToggle, children }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors text-left"
    >
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 text-sm">{title}</span>
            {badge && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeColor}`}>{badge}</span>
            )}
          </div>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
    </button>
    {open && (
      <div className="border-t border-gray-100 px-6 py-5">
        {children}
      </div>
    )}
  </div>
);

// ─── Field components ─────────────────────────────────────────────────────────

const Field: React.FC<{ label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode }> = ({
  label, required, hint, error, children
}) => (
  <div className="space-y-1">
    <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
      {label}
      {required && <span className="text-red-500">*</span>}
      {hint && <span className="ml-1 text-xs font-normal text-gray-400">({hint})</span>}
    </label>
    {children}
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }> = ({ error, className = '', ...props }) => (
  <input
    {...props}
    className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${error ? 'border-red-300 bg-red-50' : 'border-gray-300'} ${className}`}
  />
);

const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { mono?: boolean }> = ({ mono, className = '', ...props }) => (
  <textarea
    {...props}
    className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y transition-colors ${mono ? 'font-mono' : ''} ${className}`}
  />
);

// ─── Main Component ───────────────────────────────────────────────────────────

const CreateCodingQuestion: React.FC = () => {
  const { questionId } = useParams<{ questionId: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(questionId);

  // Section open state
  const [openSections, setOpenSections] = useState<Record<SectionId, boolean>>({
    basic: true, problem: true, examples: true, languages: true, starter: true
  });

  const toggleSection = (id: SectionId) =>
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));

  // ── Form state ──
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [marks, setMarks] = useState(10);
  const [timeLimit, setTimeLimit] = useState(2);
  const [memoryLimit, setMemoryLimit] = useState(256);
  const [isActive, setIsActive] = useState(true);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const [description, setDescription] = useState('');
  const [constraints, setConstraints] = useState('');
  const [inputFormat, setInputFormat] = useState('');
  const [outputFormat, setOutputFormat] = useState('');
  const [explanation, setExplanation] = useState('');

  const [examples, setExamples] = useState<CodingExample[]>([{ input: '', output: '', explanation: '' }]);

  const [supportedLanguages, setSupportedLanguages] = useState<string[]>(['Python']);
  const [starterCode, setStarterCode] = useState<Record<string, string>>({ Python: DEFAULT_STARTER.Python });
  const [activeStarterLang, setActiveStarterLang] = useState('Python');

  // ── UI state ──
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Drag state for examples
  const dragIdx = useRef<number | null>(null);

  // ── Load question for edit ──
  useEffect(() => {
    if (!isEdit || !questionId) return;
    codingQuestionAPI.getById(questionId).then(q => {
      setTitle(q.title || '');
      setDifficulty(q.difficulty || 'Medium');
      setMarks(q.marks || 10);
      setTimeLimit(q.timeLimit || 2);
      setMemoryLimit(q.memoryLimit || 256);
      setIsActive(q.isActive !== false);
      setTags(q.tags || []);
      setDescription(q.description || '');
      setConstraints(q.constraints || '');
      setInputFormat(q.inputFormat || '');
      setOutputFormat(q.outputFormat || '');
      setExplanation(q.explanation || '');
      setExamples(q.examples && q.examples.length > 0 ? q.examples : [{ input: '', output: '', explanation: '' }]);
      const langs = q.supportedLanguages || ['Python'];
      setSupportedLanguages(langs);

      // Normalise starterCode
      let sc: Record<string, string> = {};
      if (q.starterCode && typeof q.starterCode === 'object' && !Array.isArray(q.starterCode)) {
        sc = { ...(q.starterCode as Record<string, string>) };
      } else if (typeof q.starterCode === 'string' && q.starterCode) {
        // Legacy: assign the string to the first language
        sc[langs[0]] = q.starterCode as string;
      }
      // Fill missing languages with defaults
      for (const l of langs) {
        if (!sc[l]) sc[l] = DEFAULT_STARTER[l] || '';
      }
      setStarterCode(sc);
      setActiveStarterLang(langs[0] || 'Python');
    }).catch(() => setGlobalError('Failed to load coding question')).finally(() => setLoading(false));
  }, [isEdit, questionId]);

  // ── Language toggle ──
  const toggleLanguage = (lang: string) => {
    setSupportedLanguages(prev => {
      if (prev.includes(lang)) {
        if (prev.length === 1) return prev; // keep at least one
        const next = prev.filter(l => l !== lang);
        if (activeStarterLang === lang) setActiveStarterLang(next[0]);
        return next;
      }
      const next = [...prev, lang];
      if (!starterCode[lang]) {
        setStarterCode(sc => ({ ...sc, [lang]: DEFAULT_STARTER[lang] || '' }));
      }
      return next;
    });
  };

  // ── Starter code per language ──
  const handleStarterCodeChange = (value: string | undefined) => {
    setStarterCode(prev => ({ ...prev, [activeStarterLang]: value || '' }));
  };

  // ── Tags ──
  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t) && tags.length < 10) {
      setTags(prev => [...prev, t]);
      setTagInput('');
    }
  };
  const removeTag = (t: string) => setTags(prev => prev.filter(x => x !== t));

  // ── Examples ──
  const addExample = () => setExamples(prev => [...prev, { input: '', output: '', explanation: '' }]);
  const removeExample = (i: number) => setExamples(prev => prev.filter((_, idx) => idx !== i));
  const updateExample = (i: number, key: keyof CodingExample, val: string) =>
    setExamples(prev => prev.map((ex, idx) => idx === i ? { ...ex, [key]: val } : ex));

  // ── Drag reorder for examples ──
  const onDragStart = (i: number) => { dragIdx.current = i; };
  const onDrop = (i: number) => {
    if (dragIdx.current === null || dragIdx.current === i) return;
    const arr = [...examples];
    const [item] = arr.splice(dragIdx.current, 1);
    arr.splice(i, 0, item);
    setExamples(arr);
    dragIdx.current = null;
  };

  // ── Validation ──
  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'Title is required';
    if (!description.trim()) e.description = 'Description is required';
    if (marks < 1) e.marks = 'Marks must be at least 1';
    if (timeLimit < 1) e.timeLimit = 'Time limit must be at least 1';
    if (memoryLimit < 1) e.memoryLimit = 'Memory limit must be at least 1';
    if (supportedLanguages.length === 0) e.languages = 'Select at least one language';
    for (const lang of supportedLanguages) {
      if (!starterCode[lang]?.trim()) e[`starter_${lang}`] = `Starter code for ${lang} is required`;
    }
    for (let i = 0; i < examples.length; i++) {
      if (!examples[i].input.trim()) e[`ex_input_${i}`] = `Example ${i + 1}: input is required`;
      if (!examples[i].output.trim()) e[`ex_output_${i}`] = `Example ${i + 1}: output is required`;
    }
    setErrors(e);
    if (Object.keys(e).length > 0) {
      // Auto-open sections with errors
      const open: Partial<Record<SectionId, boolean>> = {};
      if (e.title || e.marks || e.timeLimit || e.memoryLimit) open.basic = true;
      if (e.description) open.problem = true;
      if (Object.keys(e).some(k => k.startsWith('ex_'))) open.examples = true;
      if (e.languages) open.languages = true;
      if (Object.keys(e).some(k => k.startsWith('starter_'))) open.starter = true;
      setOpenSections(prev => ({ ...prev, ...open }));
    }
    return Object.keys(e).length === 0;
  };

  // ── Submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');
    if (!validate()) return;

    const payload: Partial<CodingQuestion> = {
      title: title.trim(),
      description: description.trim(),
      constraints: constraints.trim(),
      inputFormat: inputFormat.trim(),
      outputFormat: outputFormat.trim(),
      explanation: explanation.trim(),
      examples: examples.filter(ex => ex.input.trim() && ex.output.trim()),
      tags,
      difficulty,
      marks,
      timeLimit,
      memoryLimit,
      starterCode,
      supportedLanguages,
      isActive
    };

    setSaving(true);
    try {
      if (isEdit && questionId) {
        await codingQuestionAPI.update(questionId, payload);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const created = await codingQuestionAPI.create(payload);
        const newId = (created as CodingQuestion & { _id?: string }).id || (created as CodingQuestion & { _id?: string })._id;
        navigate(`/teacher/coding-questions/${newId}/testcases`);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setGlobalError(msg || 'Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-gray-500">Loading question...</p>
        </div>
      </div>
    );
  }

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link to="/teacher/coding-questions" className="text-gray-400 hover:text-gray-600">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-sm font-semibold text-gray-900">
                  {isEdit ? 'Edit Coding Question' : 'New Coding Question'}
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">
                  {isEdit ? 'Update question details' : 'Create a new problem for your students'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isEdit && (
                <Link
                  to={`/teacher/coding-questions/${questionId}/preview`}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </Link>
              )}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 px-4 py-2 text-sm font-medium text-white transition-colors"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create & Add Testcases'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        {/* Global alerts */}
        {globalError && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Error</p>
              <p>{globalError}</p>
            </div>
          </div>
        )}
        {hasErrors && (
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Please fix the following errors:</p>
              <ul className="mt-1 list-disc list-inside space-y-0.5">
                {Object.values(errors).map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          </div>
        )}
        {saveSuccess && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle className="w-4 h-4" />
            Question saved successfully.
          </div>
        )}

        {/* ── Section 1: Basic Information ── */}
        <Section
          id="basic"
          title="Basic Information"
          subtitle="Title, difficulty, marks and time limits"
          open={openSections.basic}
          onToggle={() => toggleSection('basic')}
        >
          <div className="space-y-4">
            <Field label="Title" required error={errors.title}>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Two Sum, Binary Search, Longest Common Subsequence"
                error={Boolean(errors.title)}
              />
            </Field>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Field label="Difficulty" required>
                <select
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value as 'Easy' | 'Medium' | 'Hard')}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </Field>

              <Field label="Marks" required error={errors.marks} hint="pts">
                <Input
                  type="number" min={1} value={marks}
                  onChange={e => setMarks(Number(e.target.value))}
                  error={Boolean(errors.marks)}
                />
              </Field>

              <Field label="Time Limit" required error={errors.timeLimit} hint="seconds">
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="number" min={1} value={timeLimit}
                    onChange={e => setTimeLimit(Number(e.target.value))}
                    className={`w-full rounded-lg border pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.timeLimit ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                  />
                </div>
              </Field>

              <Field label="Memory Limit" required error={errors.memoryLimit} hint="MB">
                <div className="relative">
                  <MemoryStick className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="number" min={1} value={memoryLimit}
                    onChange={e => setMemoryLimit(Number(e.target.value))}
                    className={`w-full rounded-lg border pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.memoryLimit ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                  />
                </div>
              </Field>
            </div>

            <div className="flex items-center gap-6">
              <Field label="Status">
                <div className="flex items-center gap-3 mt-1">
                  <button
                    type="button"
                    onClick={() => setIsActive(true)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium border transition-colors ${isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsActive(false)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium border transition-colors ${!isActive ? 'bg-gray-100 text-gray-700 border-gray-400' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                  >
                    <span className="w-2 h-2 rounded-full bg-gray-400" />
                    Draft
                  </button>
                </div>
              </Field>
            </div>

            <Field label="Tags" hint="press Enter or comma to add">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); } }}
                      placeholder="Add tags: array, dp, graph..."
                      className="w-full rounded-lg border border-gray-300 pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <button type="button" onClick={addTag} className="px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50">
                    Add
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map(t => (
                      <span key={t} className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 rounded-full px-2.5 py-1">
                        {t}
                        <button type="button" onClick={() => removeTag(t)} className="ml-0.5 hover:text-indigo-900">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Field>
          </div>
        </Section>

        {/* ── Section 2: Problem Statement ── */}
        <Section
          id="problem"
          title="Problem Statement"
          subtitle="Description, constraints, input/output format"
          open={openSections.problem}
          onToggle={() => toggleSection('problem')}
        >
          <div className="space-y-4">
            <Field label="Description" required error={errors.description}>
              <Textarea
                rows={5}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe the problem clearly. What should the student implement?"
                className={errors.description ? 'border-red-300 bg-red-50' : ''}
              />
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Constraints" hint="optional">
                <Textarea
                  rows={4}
                  value={constraints}
                  onChange={e => setConstraints(e.target.value)}
                  placeholder="e.g. 1 ≤ n ≤ 10^5&#10;-10^9 ≤ nums[i] ≤ 10^9"
                />
              </Field>

              <Field label="Input Format" hint="optional">
                <Textarea
                  rows={4}
                  value={inputFormat}
                  onChange={e => setInputFormat(e.target.value)}
                  placeholder="Describe how the input will be given..."
                />
              </Field>

              <Field label="Output Format" hint="optional">
                <Textarea
                  rows={4}
                  value={outputFormat}
                  onChange={e => setOutputFormat(e.target.value)}
                  placeholder="Describe the expected output format..."
                />
              </Field>

              <Field label="Explanation" hint="optional">
                <Textarea
                  rows={4}
                  value={explanation}
                  onChange={e => setExplanation(e.target.value)}
                  placeholder="Optional: overall approach or explanation..."
                />
              </Field>
            </div>
          </div>
        </Section>

        {/* ── Section 3: Examples ── */}
        <Section
          id="examples"
          title="Examples"
          subtitle="Shown to students on the exam screen (like LeetCode)"
          badge={`${examples.length} example${examples.length !== 1 ? 's' : ''}`}
          open={openSections.examples}
          onToggle={() => toggleSection('examples')}
        >
          <div className="space-y-3">
            {examples.map((ex, i) => (
              <div
                key={i}
                draggable
                onDragStart={() => onDragStart(i)}
                onDragOver={e => e.preventDefault()}
                onDrop={() => onDrop(i)}
                className="rounded-lg border border-gray-200 bg-gray-50 overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-gray-100">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                    Example {i + 1}
                  </div>
                  {examples.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeExample(i)}
                      className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Input <span className="text-red-400">*</span>
                    </label>
                    <Textarea
                      rows={3}
                      mono
                      value={ex.input}
                      onChange={e => updateExample(i, 'input', e.target.value)}
                      placeholder="Sample input..."
                      className={errors[`ex_input_${i}`] ? 'border-red-300 bg-red-50' : ''}
                    />
                    {errors[`ex_input_${i}`] && <p className="text-xs text-red-500">{errors[`ex_input_${i}`]}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Output <span className="text-red-400">*</span>
                    </label>
                    <Textarea
                      rows={3}
                      mono
                      value={ex.output}
                      onChange={e => updateExample(i, 'output', e.target.value)}
                      placeholder="Expected output..."
                      className={errors[`ex_output_${i}`] ? 'border-red-300 bg-red-50' : ''}
                    />
                    {errors[`ex_output_${i}`] && <p className="text-xs text-red-500">{errors[`ex_output_${i}`]}</p>}
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Explanation (optional)</label>
                    <Textarea
                      rows={2}
                      value={ex.explanation || ''}
                      onChange={e => updateExample(i, 'explanation', e.target.value)}
                      placeholder="Explain why this is the expected output..."
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addExample}
              className="w-full rounded-lg border-2 border-dashed border-gray-200 py-3 text-sm text-gray-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/30 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Example
            </button>
          </div>
        </Section>

        {/* ── Section 4: Supported Languages ── */}
        <Section
          id="languages"
          title="Supported Languages"
          subtitle="Select which languages students can use"
          badge={`${supportedLanguages.length} selected`}
          badgeColor={errors.languages ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-700'}
          open={openSections.languages}
          onToggle={() => toggleSection('languages')}
        >
          {errors.languages && (
            <p className="text-sm text-red-500 mb-3">{errors.languages}</p>
          )}
          <div className="flex flex-wrap gap-2">
            {ALL_LANGUAGES.map(lang => {
              const selected = supportedLanguages.includes(lang);
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => toggleLanguage(lang)}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium border-2 transition-all ${selected
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-300 hover:text-indigo-600'
                    }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  {lang}
                  {selected && <CheckCircle className="w-3.5 h-3.5" />}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-gray-500">
            ℹ️ You must provide starter code for every selected language in the next section.
          </p>
        </Section>

        {/* ── Section 5: Starter Code ── */}
        <Section
          id="starter"
          title="Starter Code"
          subtitle="One Monaco editor per language — each is stored independently"
          badge={`${supportedLanguages.length} language${supportedLanguages.length !== 1 ? 's' : ''}`}
          open={openSections.starter}
          onToggle={() => toggleSection('starter')}
        >
          {supportedLanguages.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500">
              Select at least one language in the previous section to configure starter code.
            </div>
          ) : (
            <>
              {/* Language tabs */}
              <div className="flex flex-wrap gap-1 mb-0 border-b border-gray-200 pb-0">
                {supportedLanguages.map(lang => {
                  const hasCode = Boolean(starterCode[lang]?.trim());
                  const hasError = Boolean(errors[`starter_${lang}`]);
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setActiveStarterLang(lang)}
                      className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${activeStarterLang === lang
                        ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                        : hasError
                          ? 'border-red-400 text-red-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                      {lang}
                      {hasCode && !hasError && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                      {hasError && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
                    </button>
                  );
                })}
              </div>

              {/* Error for active lang */}
              {errors[`starter_${activeStarterLang}`] && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 px-3 py-2 rounded-lg text-sm text-red-600 mt-3">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {errors[`starter_${activeStarterLang}`]}
                </div>
              )}

              {/* Monaco editor */}
              <div className="mt-3 rounded-lg overflow-hidden border border-gray-200">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700">
                  <span className="text-xs text-gray-400 font-mono">{activeStarterLang} — starter code</span>
                  <button
                    type="button"
                    onClick={() => setStarterCode(prev => ({ ...prev, [activeStarterLang]: DEFAULT_STARTER[activeStarterLang] || '' }))}
                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    Reset to default
                  </button>
                </div>
                <Editor
                  height="400px"
                  language={LANGUAGE_IDS[activeStarterLang] || 'plaintext'}
                  value={starterCode[activeStarterLang] || ''}
                  theme="vs-dark"
                  onChange={handleStarterCodeChange}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    wordWrap: 'on',
                    tabSize: 4,
                    renderWhitespace: 'boundary'
                  }}
                />
              </div>
            </>
          )}
        </Section>

        {/* Bottom actions */}
        <div className="flex items-center justify-between pt-2 pb-8">
          <Link
            to="/teacher/coding-questions"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <div className="flex items-center gap-3">
            {isEdit && (
              <Link
                to={`/teacher/coding-questions/${questionId}/testcases`}
                className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
              >
                Manage Testcases →
              </Link>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 px-5 py-2 text-sm font-medium text-white transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create & Add Testcases'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCodingQuestion;
