const fetch = globalThis.fetch;
const backend = 'http://127.0.0.1:4000';
const doPost = async (body) => {
  const res = await fetch(`${backend}/api/compiler/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { status: res.status, body: json };
};
const langs = ['python', 'javascript', 'java', 'c', 'cpp'];
const tasks = [
  { name: 'success', code: {
      python: 'print("Hello Python")',
      javascript: 'console.log("Hello JavaScript")',
      java: 'public class Main { public static void main(String[] args) { System.out.println("Hello Java"); }}',
      c: '#include <stdio.h>\nint main(){printf("Hello C\\n");return 0;}',
      cpp: '#include <iostream>\nint main(){std::cout<<"Hello C++\\n";return 0;}',
    }
  },
  { name: 'stdin', code: {
      python: 'print(input())',
      javascript: 'let data = ""; process.stdin.on("data", chunk => data += chunk.toString()); process.stdin.on("end", () => console.log(data));',
      java: 'import java.util.*; public class Main { public static void main(String[] args) { Scanner s = new Scanner(System.in); System.out.println(s.nextLine()); }}',
      c: '#include <stdio.h>\nint main(){char s[256]; if(fgets(s,256,stdin)) fputs(s,stdout); return 0;}',
      cpp: '#include <iostream>\n#include <string>\nint main(){std::string s; std::getline(std::cin, s); std::cout<<s; return 0;}',
    }
  },
  { name: 'compile-error', code: {
      python: 'print("Hello"',
      javascript: 'console.log("Hello"',
      java: 'public class Main { public static void main(String[] args) { System.out.println("Hello") }}',
      c: '#include <stdio.h>\nint main(){printf("Hello" return 0;}',
      cpp: '#include <iostream>\nint main(){std::cout<<"Hello" return 0;}',
    }
  },
  { name: 'runtime-error', code: {
      python: 'raise Exception("runtime error")',
      javascript: 'throw new Error("runtime error")',
      java: 'public class Main { public static void main(String[] args) { throw new RuntimeException("runtime error"); }}',
      c: '#include <stdio.h>\nint main(){int *p = 0; *p = 1; return 0;}',
      cpp: '#include <iostream>\nint main(){int *p = 0; *p = 1; return 0;}',
    }
  },
  { name: 'timeout', code: {
      python: 'while True: pass',
      javascript: 'while(true){}',
      java: 'public class Main { public static void main(String[] args) { while(true) {} }}',
      c: '#include <stdio.h>\nint main(){while(1){} return 0;}',
      cpp: '#include <iostream>\nint main(){while(true){} return 0;}',
    }
  },
];

(async () => {
  const results = [];
  for (const lang of langs) {
    for (const task of tasks) {
      const body = { language: lang, code: task.code[lang], stdin: task.name === 'stdin' ? 'hello-input' : '' };
      const result = await doPost(body);
      results.push({ task: task.name, language: lang, body, result });
      console.log(JSON.stringify({ task: task.name, language: lang, result }, null, 2));
    }
  }
  process.exit(0);
})();
