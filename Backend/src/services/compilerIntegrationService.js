import axios from 'axios';

const compilerClient = axios.create({
    baseURL: process.env.COMPILER_BACKEND_URL || 'http://127.0.0.1:5001/api/compiler',
    timeout: 45000,
    headers: {
        'Content-Type': 'application/json',
        'x-compiler-service-key': process.env.COMPILER_SERVICE_KEY || 'safeexam-internal-compiler-key'
    }
});

const languageMap = {
    Python: 'python',
    python: 'python',
    python3: 'python',
    Java: 'java',
    java: 'java',
    JavaScript: 'javascript',
    javascript: 'javascript',
    typescript: 'javascript',
    C: 'c',
    c: 'c',
    'C++': 'cpp',
    cpp: 'cpp',
    'c++': 'cpp'
};


const normalizeOutput = value => String(value ?? '').replace(/\r\n/g, '\n').trimEnd();

export const executeTestCases = async ({ language, sourceCode, testCases, timeLimit, memoryLimit }) => {
    const compilerLanguage = languageMap[language];
    if (!compilerLanguage) {
        const error = new Error('Unsupported language');
        error.status = 400;
        throw error;
    }

    const results = [];
    for (const testCase of testCases) {
        const response = await compilerClient.post('/run', {
            language: compilerLanguage,
            code: sourceCode,
            stdin: testCase.input,
            timeoutSeconds: Math.min(Math.max(Number(timeLimit) || 1, 1), 30),
            memoryLimitBytes: Math.min(Math.max((Number(memoryLimit) || 16) * 1024 * 1024, 16777216), 536870912)
        });
        const execution = response.data.data;
        results.push({
            passed: execution.exitCode === 0 &&
                !execution.compileError &&
                normalizeOutput(execution.stdout) === normalizeOutput(testCase.expectedOutput),
            stdout: execution.stdout,
            stderr: execution.stderr,
            compileError: execution.compileError || '',
            exitCode: execution.exitCode,
            executionTimeMs: execution.executionTimeMs,
            memoryUsageBytes: execution.memoryUsageBytes,
            timedOut: Boolean(execution.timedOut)
        });
    }
    return results;
};

export const isCompilerUnavailable = error =>
    axios.isAxiosError(error) && (!error.response || error.response.status >= 500);
