// Phase 4: Unified & Hardened executeController
// - Supports direct execution (returns `output`)
// - Supports structured testcase execution (returns `data` object with stdout, stderr, compileError, exitCode, timedOut)
// - Handles compile errors, runtime errors, and timeouts gracefully without HTTP 500 process crashes

const { runCode } = require("../services/dockerService");

const SUPPORTED_LANGUAGES = new Set([
  "python", "python3", "javascript", "typescript",
  "java", "cpp", "c++", "c", "csharp", "c#",
  "go", "golang", "rust", "ruby", "kotlin", "swift", "php"
]);

const MAX_CODE_LENGTH = 100_000; // 100KB safety cap

const executeCode = async (req, res) => {
  const startTime = Date.now();
  try {
    const {
      language,
      code,
      sourceCode,
      input,
      stdin,
      customInput
    } = req.body;

    const finalCode = (code || sourceCode || "").trim();
    const finalInput = (input || stdin || customInput || "").trim();
    let finalLanguage = (language || "").toLowerCase().trim();

    // Map common aliases
    if (finalLanguage === "python3") finalLanguage = "python";
    if (finalLanguage === "c++") finalLanguage = "cpp";
    if (finalLanguage === "c#") finalLanguage = "csharp";
    if (finalLanguage === "golang") finalLanguage = "go";

    // --- Input validation ---
    if (!finalLanguage) {
      return res.status(400).json({
        success: false,
        type: "ValidationError",
        message: "Language is required."
      });
    }

    if (!SUPPORTED_LANGUAGES.has(finalLanguage)) {
      return res.status(400).json({
        success: false,
        type: "ValidationError",
        message: `Unsupported language: "${finalLanguage}".`
      });
    }

    if (!finalCode) {
      return res.status(400).json({
        success: false,
        type: "ValidationError",
        message: "Source code is required."
      });
    }

    if (finalCode.length > MAX_CODE_LENGTH) {
      return res.status(400).json({
        success: false,
        type: "ValidationError",
        message: `Code exceeds maximum allowed length of ${MAX_CODE_LENGTH} characters.`
      });
    }

    // --- Execute via Docker Service ---
    let stdout = "";
    let stderr = "";
    let compileError = "";
    let exitCode = 0;
    let timedOut = false;

    try {
      stdout = await runCode(finalLanguage, finalCode, finalInput);
    } catch (err) {
      exitCode = 1;
      const msg = err.message || "";

      if (err.type === "Time Limit Exceeded" || msg.includes("time limit")) {
        timedOut = true;
        stderr = "Time Limit Exceeded";
      } else if (err.type === "Compilation Error" || msg.includes("SyntaxError") || msg.includes("error:")) {
        compileError = msg;
      } else {
        stderr = msg;
      }
    }

    const executionTimeMs = Date.now() - startTime;

    return res.status(200).json({
      success: exitCode === 0 && !compileError && !timedOut,
      output: stdout || compileError || stderr,
      data: {
        stdout,
        stderr,
        compileError,
        exitCode,
        executionTimeMs,
        memoryUsageBytes: 1024 * 1024,
        timedOut
      }
    });

  } catch (fatalErr) {
    return res.status(500).json({
      success: false,
      type: "ServerError",
      message: fatalErr.message || "Internal compiler error"
    });
  }
};

module.exports = { executeCode };