import { useEffect, useMemo, useRef, useState } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { Language } from '../types/compiler.types';

const starterCode: Record<Language, string> = {
  python: 'print("Hello from Python")\n',
  javascript: 'console.log("Hello from JavaScript");\n',
  java: 'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello from Java");\n  }\n}\n',
  c: '#include <stdio.h>\n\nint main() {\n  printf("Hello from C\\n");\n  return 0;\n}\n',
  cpp: '#include <iostream>\n\nint main() {\n  std::cout << "Hello from C++\\n";\n  return 0;\n}\n',
};

interface CompilerEditorProps {
  language: Language;
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
}

const languageMap: Record<Language, string> = {
  python: 'python',
  javascript: 'javascript',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
};

export function CompilerEditor({ language, value, onChange, onRun }: CompilerEditorProps) {
  const editorRef = useRef<any>(null);

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    if (monaco && editor) {
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
        onRun();
      });
    }
  };

  useEffect(() => {
    if (!value) {
      onChange(starterCode[language]);
    }
  }, [language, onChange, value]);

  const options = useMemo(
    () => ({
      selectOnLineNumbers: true,
      fontSize: 14,
      minimap: { enabled: false },
      wordWrap: 'on' as const,
      formatOnType: true,
      scrollBeyondLastLine: false,
      automaticLayout: true,
      roundedSelection: true,
      theme: 'vs-dark',
    }),
    []
  );

  return (
    <div className="h-[560px] rounded-3xl overflow-hidden border border-slate-700 bg-slate-950 shadow-2xl shadow-slate-950/30">
      <Editor
        height="100%"
        defaultLanguage={languageMap[language]}
        language={languageMap[language]}
        value={value}
        theme="vs-dark"
        onMount={handleEditorMount}
        onChange={(code) => onChange(code ?? '')}
        options={options}
      />
    </div>
  );
}
