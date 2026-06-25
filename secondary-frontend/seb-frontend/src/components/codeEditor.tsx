import { useState } from "react";
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
  const [output] = useState("");

  const handleLanguageChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const lang = e.target.value;

    setLanguage(lang);

    setCode(
      boilerplates[lang as keyof typeof boilerplates]
    );
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

      <button
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
      >
        Run Code
      </button>

      <div className="mt-4 border rounded p-3 bg-black text-green-400 min-h-[120px]">
        {output || "Output will appear here"}
      </div>

    </div>
  );
}