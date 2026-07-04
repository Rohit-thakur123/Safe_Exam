import { useState } from "react";
import CodeEditor from "../components/codeEditor";

const dummyQuestion = {
  id: "1",
  title: "Print Hello World",
  description: "Write a program to print Hello World.",

  difficulty: "Easy" as const,

  marks: 10,

  timeLimit: 2,

  memoryLimit: 256,

  starterCode: {
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
  },

  constraints: [
    "No constraints"
  ],

  inputFormat: "No Input",

  outputFormat: "Print Hello World",

  supportedLanguages: [
    "java",
    "javascript",
    "python",
    "c",
    "cpp"
  ],

  visibleTestCases: [
    {
      input: "",
      output: "Hello World"
    }
  ]
};

export default function CodingTest() {
  const [answer, setAnswer] = useState("");

  return (
    <CodeEditor
      question={dummyQuestion}
      answer={answer}
      onAnswerChange={setAnswer}
      attemptId="demo-attempt"
    />
  );
}