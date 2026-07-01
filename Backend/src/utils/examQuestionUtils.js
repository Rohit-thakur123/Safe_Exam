import TestCase from '../models/exam/testCase.js';

export const getVisibleSamplesByQuestion = async (codingQuestions = []) => {
    if (codingQuestions.length === 0) return {};

    const testCases = await TestCase.find({
        codingQuestionId: { $in: codingQuestions.map(question => question._id) },
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

export const serializeCodingQuestionForStudent = (question, samplesByQuestion) => ({
    id: question._id.toString(),
    type: 'coding',
    title: question.title,
    description: question.description,
    constraints: question.constraints,
    inputFormat: question.inputFormat,
    outputFormat: question.outputFormat,
    explanation: question.explanation,
    difficulty: question.difficulty,
    marks: question.marks,
    timeLimit: question.timeLimit,
    memoryLimit: question.memoryLimit,
    starterCode: question.starterCode,
    supportedLanguages: question.supportedLanguages,
    visibleTestCases: samplesByQuestion[question._id.toString()] || []
});

export const buildStudentExamQuestions = async (exam) => {
    const samplesByQuestion = await getVisibleSamplesByQuestion(exam.codingQuestions);
    const legacyQuestions = exam.questions.map(question => ({
        id: question._id.toString(),
        type: question.type || 'mcq',
        question: question.question,
        options: question.options,
        difficulty: question.difficulty,
        category: question.category
    }));
    const codingQuestions = exam.codingQuestions.map(question =>
        serializeCodingQuestionForStudent(question, samplesByQuestion)
    );
    return [...legacyQuestions, ...codingQuestions];
};
