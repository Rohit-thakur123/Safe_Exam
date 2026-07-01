const ALLOWED_DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const ALLOWED_LANGUAGES = ['Python', 'Java', 'JavaScript', 'C', 'C++'];

const hasText = (value) => typeof value === 'string' && value.trim().length > 0;

export const validateCodingQuestion = (req, res, next) => {
    const payload = req.body;
    const errors = [];

    // Required text fields
    if (!hasText(payload.title)) errors.push('Title is required');
    if (!hasText(payload.description)) errors.push('Description is required');

    // Difficulty
    if (!ALLOWED_DIFFICULTIES.includes(payload.difficulty)) {
        errors.push('Difficulty must be Easy, Medium, or Hard');
    }

    // Numeric fields
    for (const [field, label] of [
        ['marks', 'Marks'],
        ['timeLimit', 'Time limit'],
        ['memoryLimit', 'Memory limit']
    ]) {
        if (!Number.isFinite(Number(payload[field])) || Number(payload[field]) < 1) {
            errors.push(`${label} must be at least 1`);
        }
    }

    // Supported languages
    const languages = payload.supportedLanguages;
    if (!Array.isArray(languages) || languages.length === 0) {
        errors.push('At least one supported language is required');
    } else if (languages.some(lang => !ALLOWED_LANGUAGES.includes(lang))) {
        errors.push(`Supported languages must be one of: ${ALLOWED_LANGUAGES.join(', ')}`);
    } else {
        // Validate per-language starter code
        const starterCode = payload.starterCode;
        if (!starterCode || typeof starterCode !== 'object' || Array.isArray(starterCode)) {
            errors.push('Starter code must be provided as an object keyed by language');
        } else {
            for (const lang of languages) {
                if (!hasText(starterCode[lang])) {
                    errors.push(`Starter code for ${lang} is required`);
                }
            }
        }
    }

    // Validate examples if provided
    if (Array.isArray(payload.examples)) {
        for (let i = 0; i < payload.examples.length; i++) {
            const ex = payload.examples[i];
            if (!hasText(ex?.input)) errors.push(`Example ${i + 1}: input is required`);
            if (!hasText(ex?.output)) errors.push(`Example ${i + 1}: output is required`);
        }
    }

    if (errors.length) {
        return res.status(400).json({ success: false, error: errors[0], errors });
    }

    // Build sanitized payload
    const uniqueLangs = [...new Set(languages)];
    const sanitizedStarterCode = {};
    for (const lang of uniqueLangs) {
        sanitizedStarterCode[lang] = String(payload.starterCode[lang] || '').trimEnd();
    }

    req.body = {
        title: payload.title.trim(),
        description: payload.description.trim(),
        constraints: typeof payload.constraints === 'string' ? payload.constraints.trim() : '',
        inputFormat: typeof payload.inputFormat === 'string' ? payload.inputFormat.trim() : '',
        outputFormat: typeof payload.outputFormat === 'string' ? payload.outputFormat.trim() : '',
        explanation: typeof payload.explanation === 'string' ? payload.explanation.trim() : '',
        examples: Array.isArray(payload.examples) ? payload.examples.map(ex => ({
            input: String(ex.input).trim(),
            output: String(ex.output).trim(),
            explanation: String(ex.explanation || '').trim()
        })) : [],
        tags: Array.isArray(payload.tags) ? payload.tags.map(t => String(t).trim()).filter(Boolean) : [],
        difficulty: payload.difficulty,
        marks: Number(payload.marks),
        timeLimit: Number(payload.timeLimit),
        memoryLimit: Number(payload.memoryLimit),
        starterCode: sanitizedStarterCode,
        supportedLanguages: uniqueLangs,
        ...(typeof payload.isActive === 'boolean' ? { isActive: payload.isActive } : {})
    };
    next();
};

export const validateTestCase = (req, res, next) => {
    const { input, expectedOutput, isHidden, weight } = req.body;
    const errors = [];
    if (!hasText(input)) errors.push('Input is required');
    if (!hasText(expectedOutput)) errors.push('Expected output is required');
    if (typeof isHidden !== 'boolean') errors.push('Visibility flag is required');
    if (weight !== undefined && (typeof weight !== 'number' || weight < 0)) errors.push('Weight must be a non-negative number');

    if (errors.length) {
        return res.status(400).json({ success: false, error: errors[0], errors });
    }
    req.body = {
        input: input.trim(),
        expectedOutput: expectedOutput.trim(),
        isHidden,
        weight: weight !== undefined ? weight : 1
    };
    next();
};
