import mongoose from 'mongoose';
import CodingQuestion from '../models/exam/codingQuestion.js';
import TestCase from '../models/exam/testCase.js';
import Exam from '../models/exam/exam.js';
import ExamAttempt from '../models/exam/examAttempt.js';
import Submission from '../models/exam/submissions.js';
import { executeTestCases, isCompilerUnavailable } from '../services/compilerIntegrationService.js';
import { resolveOverrideMark } from '../utils/examQuestionUtils.js';

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
    const matchedLanguage = question.supportedLanguages.find(l => l.toLowerCase() === language.toLowerCase());
    if (!matchedLanguage) {
        const error = new Error('Language is not supported for this question');
        error.status = 400;
        throw error;
    }
    return { question, attempt, exam, language: matchedLanguage, sourceCode };
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
        let testCases = await TestCase.find({
            codingQuestionId: context.question._id,
            isHidden: false
        }).sort({ order: 1 }).lean();

        if (!testCases.length) {
            testCases = await TestCase.find({
                codingQuestionId: context.question._id
            }).sort({ order: 1 }).lean();
        }

        if (!testCases.length) {
            return res.status(422).json({ success: false, error: 'No testcases configured for this coding question' });
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
        let testCases = await TestCase.find({
            codingQuestionId: context.question._id,
            isHidden: true
        }).sort({ order: 1 }).lean();

        if (!testCases.length) {
            testCases = await TestCase.find({
                codingQuestionId: context.question._id
            }).sort({ order: 1 }).lean();
        }

        if (!testCases.length) {
            return res.status(422).json({ success: false, error: 'No testcases configured for this coding question' });
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
        // Use the teacher's per-exam override mark if one was assigned, otherwise the
        // coding question's own fixed marks value.
        const questionMarks = resolveOverrideMark(context.exam, context.question._id, context.question.marks);
        const score = Number(((percentage / 100) * questionMarks).toFixed(2));
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
            totalMarks: questionMarks,
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
                totalMarks: questionMarks,
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
            .populate('studentId', 'name email role')
            .populate('codingQuestionId', 'title difficulty points')
            .sort({ submittedAt: -1 });

        const formattedSubmissions = submissions.map(sub => {
            const studentObj = sub.studentId && typeof sub.studentId === 'object' ? sub.studentId : null;
            const questionObj = sub.codingQuestionId && typeof sub.codingQuestionId === 'object' ? sub.codingQuestionId : null;
            return {
                _id: sub._id.toString(),
                studentId: {
                    _id: studentObj?._id?.toString() || 'unknown',
                    name: studentObj?.name || 'Unknown Candidate',
                    email: studentObj?.email || 'N/A'
                },
                codingQuestionId: {
                    _id: questionObj?._id?.toString() || 'unknown',
                    title: questionObj?.title || 'Coding Challenge',
                    difficulty: questionObj?.difficulty || 'Medium',
                    points: questionObj?.points || 0
                },
                examAttemptId: sub.examAttemptId?.toString() || '',
                language: sub.language,
                sourceCode: sub.sourceCode,
                executionTime: sub.executionTime || 0,
                memoryUsage: sub.memoryUsage || 0,
                passedTestCases: sub.passedTestCases || 0,
                failedTestCases: sub.failedTestCases || 0,
                score: sub.score || 0,
                totalMarks: sub.totalMarks || 0,
                submittedAt: sub.submittedAt
            };
        });

        res.status(200).json({ success: true, submissions: formattedSubmissions });
    } catch (error) {
        next(error);
    }
};