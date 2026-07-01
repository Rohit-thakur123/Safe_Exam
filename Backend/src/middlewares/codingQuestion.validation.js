const ALLOWED_DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const ALLOWED_LANGUAGES = ['Python', 'Java', 'JavaScript', 'C', 'C++'];

const hasText = (value) => typeof value === 'string' && value.trim().length > 0;

export const validateCodingQuestion = (req, res, next) => {
    const payload = req.body;
    const errors = [];

    for (const [field, label] of [
        ['title', 'Title'],
        ['description', 'Description'],
        ['constraints', 'Constraints'],
        ['inputFormat', 'Input format'],
        ['outputFormat', 'Output format'],
        ['explanation', 'Explanation'],
        ['starterCode', 'Starter code']
    ]) {
        if (!hasText(payload[field])) errors.push(`${label} is required`);
    }

    if (!ALLOWED_DIFFICULTIES.includes(payload.difficulty)) {
        errors.push('Difficulty must be Easy, Medium, or Hard');
    }

    for (const [field, label] of [
        ['marks', 'Marks'],
        ['timeLimit', 'Time limit'],
        ['memoryLimit', 'Memory limit']
    ]) {
        if (!Number.isFinite(Number(payload[field])) || Number(payload[field]) < 1) {
            errors.push(`${label} must be at least 1`);
        }
    }

    if (!Array.isArray(payload.supportedLanguages) || payload.supportedLanguages.length === 0) {
        errors.push('At least one supported language is required');
    } else if (payload.supportedLanguages.some(language => !ALLOWED_LANGUAGES.includes(language))) {
        errors.push(`Supported languages must be one of: ${ALLOWED_LANGUAGES.join(', ')}`);
    }

    if (errors.length) {
        return res.status(400).json({ success: false, error: errors[0], errors });
    }

    req.body = {
        title: payload.title.trim(),
        description: payload.description.trim(),
        constraints: payload.constraints.trim(),
        inputFormat: payload.inputFormat.trim(),
        outputFormat: payload.outputFormat.trim(),
        explanation: payload.explanation.trim(),
        starterCode: payload.starterCode.trim(),
        marks: Number(payload.marks),
        timeLimit: Number(payload.timeLimit),
        memoryLimit: Number(payload.memoryLimit),
        supportedLanguages: [...new Set(payload.supportedLanguages)]
    };
    next();
};

export const validateTestCase = (req, res, next) => {
    const { input, expectedOutput, isHidden } = req.body;
    const errors = [];
    if (!hasText(input)) errors.push('Input is required');
    if (!hasText(expectedOutput)) errors.push('Expected output is required');
    if (typeof isHidden !== 'boolean') errors.push('Visibility flag is required');

    if (errors.length) {
        return res.status(400).json({ success: false, error: errors[0], errors });
    }
    req.body = {
        input: input.trim(),
        expectedOutput: expectedOutput.trim(),
        isHidden
    };
    next();
};
