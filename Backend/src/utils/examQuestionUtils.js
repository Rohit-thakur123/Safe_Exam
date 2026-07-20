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

export const buildStudentExamQuestions = async (exam) => {
    const validCodingQuestions = (exam.codingQuestions || []).filter(q => q != null);
    const samplesByQuestion = await getVisibleSamplesByQuestion(validCodingQuestions);

    // Compute per-MCQ mark: (totalMarks - sum of coding marks) / number of MCQ questions
    const totalCodingMarks = validCodingQuestions.reduce((sum, q) => sum + (q.marks || 0), 0);
    const mcqMarksPool = Math.max(0, (exam.totalMarks || 0) - totalCodingMarks);
    const mcqQuestions = (exam.questions || []).filter(q => q != null);
    const marksPerMcq = mcqQuestions.length > 0 ? mcqMarksPool / mcqQuestions.length : 0;

    const legacyQuestions = mcqQuestions.map(question => ({
        id: (question._id || question).toString(),
        type: question.type || 'mcq',
        question: question.question || '',
        options: question.options || [],
        marks: Math.round(marksPerMcq * 100) / 100,
        difficulty: question.difficulty || 'medium',
        category: question.category || 'general'
    }));
    const codingQuestions = validCodingQuestions.map(question =>
        serializeCodingQuestionForStudent(question, samplesByQuestion)
    );
    return [...legacyQuestions, ...codingQuestions];
};
