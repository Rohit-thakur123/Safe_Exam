// Phase 5: Hardened executeController
// - Fixed validation bug: was checking !code but using finalCode (which can be sourceCode)
// - Added language whitelist
// - Added maximum code length guard
// - Structured error response for compile errors vs runtime errors
const { runCode } = require("../services/dockerService");

const SUPPORTED_LANGUAGES = new Set([
  "python", "python3", "javascript", "typescript",
  "java", "cpp", "c++", "c", "csharp", "c#",
  "go", "golang", "rust", "ruby", "kotlin", "swift", "php"
]);

const MAX_CODE_LENGTH = 100_000; // 100KB safety cap

const executeCode = async (req, res) => {
  try {
    const {
      language,
      code,
      sourceCode,
      input,
      customInput
    } = req.body;

    const finalCode = (code || sourceCode || "").trim();
    const finalInput = (input || customInput || "").trim();
    const finalLanguage = (language || "").toLowerCase().trim();

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
        message: `Unsupported language: "${finalLanguage}". Supported: ${[...SUPPORTED_LANGUAGES].join(", ")}`
      });
    }

    if (!finalCode) {
      return res.status(400).json({
        success: false,
        type: "ValidationError",
        message: "Code (code or sourceCode) is required."
      });
    }

    if (finalCode.length > MAX_CODE_LENGTH) {
      return res.status(400).json({
        success: false,
        type: "ValidationError",
        message: `Code exceeds maximum allowed length of ${MAX_CODE_LENGTH} characters.`
      });
    }

    // --- Execute ---
    const output = await runCode(finalLanguage, finalCode, finalInput);

    res.json({
      success: true,
      output
    });

  } catch (err) {
    // Phase 5: Distinguish compile errors from runtime errors for the client
    const isCompileError =
      err.type === "CompileError" ||
      (err.message && (
        err.message.includes("SyntaxError") ||
        err.message.includes("compilation failed") ||
        err.message.includes("error:") ||
        err.message.includes("undefined symbol")
      ));

    const statusCode = isCompileError ? 422 : 500;

    res.status(statusCode).json({
      success: false,
      type: err.type || (isCompileError ? "CompileError" : "RuntimeError"),
      message: err.message || "Execution failed"
    });
  }
};

module.exports = { executeCode };