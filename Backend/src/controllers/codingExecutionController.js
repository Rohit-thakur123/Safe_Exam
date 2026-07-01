import mongoose from 'mongoose';
import CodingQuestion from '../models/exam/codingQuestion.js';
import TestCase from '../models/exam/testCase.js';
import Exam from '../models/exam/exam.js';
import ExamAttempt from '../models/exam/examAttempt.js';
import Submission from '../models/exam/submissions.js';
import { executeTestCases, isCompilerUnavailable } from '../services/compilerIntegrationService.js';

const getExecutionContext = async (req) => {
    const { codingQuestionId } = req.params;
    const { attemptId, language, sourceCode } = req.body;
    if (!mongoose.Types.ObjectId.isValid(codingQuestionId) || !mongoose.Types.ObjectId.isValid(attemptId)) {
        const error = new Error('Invalid coding question or attempt ID');
        error.status = 400;
        throw error;
    }
    if (typeof sourceCode !== 'string' || !sourceCode.trim() || sourceCode.length > 100000) {
        const error = new Error('Source code is required and must be at most 100,000 characters');
        error.status = 400;
        throw error;
    }

    const [question, attempt] = await Promise.all([
        CodingQuestion.findById(codingQuestionId),
        ExamAttempt.findById(attemptId)
    ]);
    if (!question) {
        const error = new Error('Coding question not found');
        error.status = 404;
        throw error;
    }
    if (!attempt || attempt.studentId.toString() !== req.user._id.toString()) {
        const error = new Error('Active exam attempt not found');
        error.status = 403;
        throw error;
    }
    if (attempt.status !== 'in_progress') {
        const error = new Error('Code execution is only available during an active exam attempt');
        error.status = 409;
        throw error;
    }
    const exam = await Exam.findById(attempt.examId);
    if (!exam || !exam.codingQuestions.some(id => id.toString() === codingQuestionId)) {
        const error = new Error('Coding question is not part of this exam');
        error.status = 403;
        throw error;
    }
    if (!question.supportedLanguages.includes(language)) {
        const error = new Error('Language is not supported for this question');
        error.status = 400;
        throw error;
    }
    return { question, attempt, exam, language, sourceCode };
};

const handleExecutionError = (error, res, next) => {
    if (isCompilerUnavailable(error)) {
        return res.status(503).json({ success: false, error: 'Compiler service is unavailable' });
    }
    if (error.response?.status === 400) {
        return res.status(400).json({ success: false, error: 'Compiler rejected the execution request' });
    }
    if (error.status) {
        return res.status(error.status).json({ success: false, error: error.message });
    }
    next(error);
};

export const runCodingQuestion = async (req, res, next) => {
    try {
        const context = await getExecutionContext(req);
        const testCases = await TestCase.find({
            codingQuestionId: context.question._id,
            isHidden: false
        }).sort({ order: 1 }).lean();
        if (!testCases.length) {
            return res.status(422).json({ success: false, error: 'No visible testcases are configured' });
        }
        const results = await executeTestCases({
            ...context,
            testCases,
            timeLimit: context.question.timeLimit,
            memoryLimit: context.question.memoryLimit
        });
        res.status(200).json({
            success: true,
            results: results.map((result, index) => ({
                order: testCases[index].order,
                input: testCases[index].input,
                expectedOutput: testCases[index].expectedOutput,
                ...result
            }))
        });
    } catch (error) {
        handleExecutionError(error, res, next);
    }
};

export const submitCodingQuestion = async (req, res, next) => {
    try {
        const context = await getExecutionContext(req);
        const testCases = await TestCase.find({
            codingQuestionId: context.question._id,
            isHidden: true
        }).sort({ order: 1 }).lean();
        if (!testCases.length) {
            return res.status(422).json({ success: false, error: 'No hidden testcases are configured' });
        }
        const results = await executeTestCases({
            ...context,
            testCases,
            timeLimit: context.question.timeLimit,
            memoryLimit: context.question.memoryLimit
        });
        const passedTestCases = results.filter(result => result.passed).length;
        const failedTestCases = results.length - passedTestCases;
        const percentage = results.length ? (passedTestCases / results.length) * 100 : 0;
        const score = Number(((percentage / 100) * context.question.marks).toFixed(2));
        const executionTime = results.reduce((total, result) => total + result.executionTimeMs, 0);
        const memoryUsage = Math.max(0, ...results.map(result => result.memoryUsageBytes));

        const submission = await Submission.create({
            examAttemptId: context.attempt._id,
            examId: context.exam._id,
            studentId: req.user._id,
            codingQuestionId: context.question._id,
            language: context.language,
            sourceCode: context.sourceCode,
            executionTime,
            memoryUsage,
            passedTestCases,
            failedTestCases,
            score,
            totalMarks: context.question.marks,
            percentage: Number(percentage.toFixed(2)),
            passed: failedTestCases === 0
        });

        res.status(201).json({
            success: true,
            submission: {
                id: submission._id.toString(),
                passedTestCases,
                failedTestCases,
                totalTestCases: results.length,
                percentage: submission.percentage,
                score,
                totalMarks: context.question.marks,
                executionTime,
                memoryUsage
            }
        });
    } catch (error) {
        handleExecutionError(error, res, next);
    }
};

export const getExamCodingSubmissions = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.examId)) {
            return res.status(400).json({ success: false, error: 'Invalid exam ID' });
        }
        const exam = await Exam.findById(req.params.examId);
        if (!exam) return res.status(404).json({ success: false, error: 'Exam not found' });
        if (exam.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, error: 'Unauthorized access' });
        }
        const submissions = await Submission.find({
            examId: exam._id,
            codingQuestionId: { $exists: true }
        })
            .populate('studentId', 'name email')
            .populate('codingQuestionId', 'title')
            .sort({ submittedAt: -1 });
        res.status(200).json({ success: true, submissions });
    } catch (error) {
        next(error);
    }
};
