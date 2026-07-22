import TestCase from '../models/exam/testCase.js';

export const getVisibleSamplesByQuestion = async (codingQuestions = []) => {
    const validQuestions = (codingQuestions || []).filter(q => q != null);
    if (validQuestions.length === 0) return {};

    const testCases = await TestCase.find({
        codingQuestionId: { $in: validQuestions.map(question => question._id || question) },
        isHidden: false
    })
        .select('codingQuestionId input expectedOutput order -_id')
        .sort({ order: 1 })
        .lean();

    return testCases.reduce((samples, testCase) => {
        const key = testCase.codingQuestionId.toString();
        if (!samples[key]) samples[key] = [];
        samples[key].push({
            input: testCase.input,
            expectedOutput: testCase.expectedOutput,
            order: testCase.order
        });
        return samples;
    }, {});
};

export const serializeCodingQuestionForStudent = (question, samplesByQuestion) => {
    const qId = (question._id || question).toString();
    return {
        id: qId,
        type: 'coding',
        title: question.title || '',
        description: question.description || '',
        constraints: question.constraints || [],
        inputFormat: question.inputFormat || '',
        outputFormat: question.outputFormat || '',
        explanation: question.explanation || '',
        difficulty: question.difficulty || 'medium',
        marks: question.marks || 0,
        timeLimit: question.timeLimit || 0,
        memoryLimit: question.memoryLimit || 0,
        starterCode: question.starterCode || {},
        supportedLanguages: question.supportedLanguages || [],
        visibleTestCases: samplesByQuestion[qId] || []
    };
};

// Get the teacher's custom mark for a question within an exam, if one was assigned
// (via exam.questionMarks) — otherwise returns undefined.
const getCustomMark = (exam, questionId) => {
    const customMarks = exam?.questionMarks;
    if (!customMarks) return undefined;
    const id = (questionId || '').toString();
    const raw = typeof customMarks.get === 'function' ? customMarks.get(id) : customMarks[id];
    return raw !== undefined && raw !== null && raw !== '' && !Number.isNaN(Number(raw))
        ? Number(raw)
        : undefined;
};

// Resolve the marks for a coding or subjective/descriptive question within an exam:
// the teacher's per-exam override if assigned, otherwise the question bank's own
// fixed marks/maxMarks value.
export const resolveOverrideMark = (exam, questionId, defaultMarks) => {
    const custom = getCustomMark(exam, questionId);
    const value = custom !== undefined ? custom : (defaultMarks || 0);
    return Math.round(value * 100) / 100;
};

// Resolve the marks awarded for a single MCQ question within an exam.
// If the teacher assigned custom marks to this question while creating/editing
// the exam (exam.questionMarks), that value takes priority. Otherwise the
// question falls back to an even split of whatever MCQ marks pool remains.
export const resolveMcqMark = (exam, questionId, evenShareMarks) => {
    const custom = getCustomMark(exam, questionId);
    if (custom !== undefined) {
        return Math.round(custom * 100) / 100;
    }
    return Math.round((evenShareMarks || 0) * 100) / 100;
};

export const buildStudentExamQuestions = async (exam) => {
    const validCodingQuestions = (exam.codingQuestions || []).filter(q => q != null);
    const samplesByQuestion = await getVisibleSamplesByQuestion(validCodingQuestions);

    // Compute the even-split fallback: (totalMarks - sum of coding marks - sum of
    // descriptive/subjective marks - sum of custom-assigned MCQ marks) / number of
    // MCQ questions that don't have a custom mark. Descriptive marks must be reserved
    // here too, even though they're graded later, otherwise MCQs get over-credited.
    // Coding/descriptive marks here already account for any per-exam override.
    const totalCodingMarks = validCodingQuestions.reduce(
        (sum, q) => sum + resolveOverrideMark(exam, q._id || q, q.marks), 0
    );
    const validDescriptiveQuestions = (exam.descriptiveQuestions || []).filter(q => q != null);
    const totalDescriptiveMarks = validDescriptiveQuestions.reduce(
        (sum, q) => sum + resolveOverrideMark(exam, q._id || q, q.maxMarks), 0
    );
    const mcqQuestions = (exam.questions || []).filter(q => q != null);
    const customMarks = exam.questionMarks;
    const getCustomMark = (id) => {
        if (!customMarks) return undefined;
        const raw = typeof customMarks.get === 'function' ? customMarks.get(id) : customMarks[id];
        return raw !== undefined && raw !== null && raw !== '' ? Number(raw) : undefined;
    };
    const customMarksTotal = mcqQuestions.reduce((sum, q) => {
        const id = (q._id || q).toString();
        const custom = getCustomMark(id);
        return sum + (custom !== undefined ? custom : 0);
    }, 0);
    const uncustomizedCount = mcqQuestions.filter(q => getCustomMark((q._id || q).toString()) === undefined).length;
    const mcqMarksPool = Math.max(0, (exam.totalMarks || 0) - totalCodingMarks - totalDescriptiveMarks - customMarksTotal);
    const marksPerMcq = uncustomizedCount > 0 ? mcqMarksPool / uncustomizedCount : 0;

    const legacyQuestions = mcqQuestions.map(question => {
        const questionId = (question._id || question).toString();
        return {
            id: questionId,
            type: question.type || 'mcq',
            question: question.question || '',
            options: question.options || [],
            marks: resolveMcqMark(exam, questionId, marksPerMcq),
            difficulty: question.difficulty || 'medium',
            category: question.category || 'general'
        };
    });
    const codingQuestions = validCodingQuestions.map(question => ({
        ...serializeCodingQuestionForStudent(question, samplesByQuestion),
        marks: resolveOverrideMark(exam, question._id || question, question.marks)
    }));
    return [...legacyQuestions, ...codingQuestions];
};