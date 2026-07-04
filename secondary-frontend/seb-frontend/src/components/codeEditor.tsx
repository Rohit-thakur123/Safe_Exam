import { useState } from "react";
import { compilerAPI } from "../services/api";
import Editor from "@monaco-editor/react";

const boilerplates = {
  java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello World");
    }
}`,

  javascript: `console.log("Hello World");`,

  python: `print("Hello World")`,

  c: `#include <stdio.h>

int main() {
    printf("Hello World");
    return 0;
}`,

  cpp: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello World";
    return 0;
}`
};

export default function CodeEditor() {
  const [language, setLanguage] = useState("java");
  const [code, setCode] = useState(boilerplates.java);
  const [output, setOutput] = useState("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLanguageChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const lang = e.target.value;

    setLanguage(lang);

    setCode(
      boilerplates[lang as keyof typeof boilerplates]
    );
  };
  const runCode = async () => {
    try {
      setLoading(true);
      setOutput("Running...");

      const res = await compilerAPI.execute({
        language,
        code,
        input,
      });

      if (res.success) {
        setOutput(res.output);
      } else {
        setOutput(res.message);
      }
    } catch (err: any) {
      setOutput(
        err.response?.data?.message ||
        err.message ||
        "Execution failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">

      <div className="mb-4">
        <select
          value={language}
          onChange={handleLanguageChange}
          className="border p-2 rounded"
        >
          <option value="java">Java</option>
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="c">C</option>
          <option value="cpp">C++</option>
        </select>
      </div>

      <Editor
        height="500px"
        language={language}
        value={code}
        theme="vs-dark"
        onChange={(value) => setCode(value || "")}
        options={{
          minimap: {
            enabled: false
          },

          quickSuggestions: false,

          suggestOnTriggerCharacters: false,

          wordBasedSuggestions: "off",

          parameterHints: {
            enabled: false
          },

          tabCompletion: "off",

          formatOnPaste: false,

          formatOnType: false
        }}
      />
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Custom Input..."
        className="mt-4 w-full border rounded p-3 h-28 font-mono"
      />
      <button
        onClick={runCode}
        disabled={loading}
        className="mt-4 px-6 py-2 rounded bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-600"
      >
        {loading ? "Running..." : "▶ Run Code"}
      </button>

      <pre className="mt-4 bg-black text-green-400 rounded p-4 min-h-[160px] overflow-auto whitespace-pre-wrap">
      {output || "Output will appear here"}
      </pre>

    </div>
  );
}
