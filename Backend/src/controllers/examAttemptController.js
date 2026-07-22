import ExamAttempt from '../models/exam/examAttempt.js';
import Exam from '../models/exam/exam.js';
import Question from '../models/exam/question.js';
import CodingQuestion from '../models/exam/codingQuestion.js';
import DescriptiveQuestion from '../models/descriptive/descriptiveQuestion.js';
import mongoose from 'mongoose';
import { buildStudentExamQuestions, resolveMcqMark, resolveOverrideMark } from '../utils/examQuestionUtils.js';
import Submission from '../models/exam/submissions.js';

// Start exam attempt (CRITICAL - TAKE EXAM)
export const startExamAttempt = async (req, res) => {
    try {
        const { examId } = req.body;
        const studentId = req.user._id;

        if (!examId) {
            return res.status(400).json({
                success: false,
                error: 'Exam ID is required'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(examId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid exam ID'
            });
        }

        // Get exam with questions
        const exam = await Exam.findById(examId)
            .populate('questions')
            .populate('codingQuestions')
            .populate({
                path: 'descriptiveQuestions',
                select: '-referenceAnswer -rubric -teacherNotes'
            });

        if (!exam) {
            return res.status(404).json({
                success: false,
                error: 'Exam not found'
            });
        }

        if (!exam.isActive) {
            return res.status(403).json({
                success: false,
                error: 'Exam is not active'
            });
        }

        // NEW: Check if student is assigned to this exam (if exam has assigned students)
        if (exam.assignedCandidates && exam.assignedCandidates.length > 0) {
            const isAssigned = exam.assignedCandidates.some(
                candidateId => candidateId.toString() === studentId.toString()
            );

            if (!isAssigned) {
                return res.status(403).json({
                    success: false,
                    error: 'You are not assigned to this exam'
                });
            }
        }

        const now = new Date();

        // STRICT DATABASE INTEGRITY: Search for ANY existing attempt for (examId, studentId).
        // Candidate receives EXACTLY ONE ExamAttempt document per exam.
        let attempt = await ExamAttempt.findOne({ examId, studentId });

        if (attempt) {
            // Case A: Attempt is completed, submitted, or evaluated -> ALREADY_SUBMITTED lockdown.
            if (['completed', 'submitted', 'evaluated'].includes(attempt.status)) {
                return res.status(409).json({
                    success: false,
                    error: 'Exam Already Submitted',
                    code: 'ALREADY_SUBMITTED',
                    submittedAt: attempt.endTime || attempt.createdAt
                });
            }

            // Case B: Attempt is abandoned -> Lock re-entry
            if (attempt.status === 'abandoned') {
                return res.status(409).json({
                    success: false,
                    error: 'Exam Attempt Expired / Abandoned',
                    code: 'ALREADY_SUBMITTED',
                    submittedAt: attempt.endTime || attempt.createdAt
                });
            }

            // Case C: Attempt is in_progress / started / not_started -> Check if time window expired
            const computedEndTime = attempt.expectedEndTime || new Date(
                attempt.startTime.getTime() + exam.duration * 60 * 1000
            );

            // If time window expired by > 1 minute grace period, mark THIS document as abandoned
            if (now.getTime() > computedEndTime.getTime() + 60000) {
                attempt.status = 'abandoned';
                attempt.endTime = now;
                await attempt.save();

                return res.status(409).json({
                    success: false,
                    error: 'Exam Attempt Window Expired',
                    code: 'ALREADY_SUBMITTED',
                    submittedAt: attempt.endTime
                });
            }

            // Resume existing in_progress attempt
            const questionsForStudent = await buildStudentExamQuestions(exam);
            const currentAnswers = attempt.answers
                ? Object.fromEntries(attempt.answers)
                : {};

            return res.status(200).json({
                success: true,
                resumed: true,
                serverTime: now.toISOString(),
                attempt: {
                    _id: attempt._id.toString(),
                    id: attempt._id.toString(),
                    examId: exam._id.toString(),
                    studentId: studentId.toString(),
                    startTime: attempt.startTime,
                    endTime: computedEndTime,
                    expectedEndTime: computedEndTime,
                    status: attempt.status,
                    currentAnswers,
                    exam: {
                        title: exam.title,
                        description: exam.description || '',
                        duration: exam.duration,
                        totalMarks: exam.totalMarks,
                        passingMarks: exam.passingMarks,
                        totalQuestions: questionsForStudent.length,
                        questions: questionsForStudent,
                        descriptiveQuestions: (exam.descriptiveQuestions || []).map(q => ({
                            id: q._id.toString(),
                            type: 'descriptive',
                            title: q.title,
                            description: q.description,
                            instructions: q.instructions,
                            maxMarks: q.maxMarks,
                            wordLimit: q.wordLimit,
                            minWords: q.minWords,
                            difficulty: q.difficulty,
                            category: q.category
                        }))
                    },
                    student: {
                        id: studentId.toString(),
                        name: req.user.name,
                        email: req.user.email
                    }
                }
            });
        }

        // Case D: NO ATTEMPT EXISTS -> Create the ONE and ONLY attempt document for this candidate!
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'];

        let expectedEndTime = new Date(now.getTime() + exam.duration * 60 * 1000);
        if (exam.endDateTimeUTC && exam.endDateTimeUTC < expectedEndTime) {
            expectedEndTime = exam.endDateTimeUTC;
        }

        try {
            attempt = new ExamAttempt({
                examId,
                studentId,
                totalMarks: exam.totalMarks,
                startTime: now,
                expectedEndTime,
                status: 'in_progress',
                ipAddress,
                userAgent
            });
            await attempt.save();
        } catch (dbErr) {
            // Handle race conditions via MongoDB unique index catch (code 11000)
            if (dbErr.code === 11000) {
                const retryAttempt = await ExamAttempt.findOne({ examId, studentId });
                if (retryAttempt) {
                    const questionsForStudent = await buildStudentExamQuestions(exam);
                    return res.status(200).json({
                        success: true,
                        resumed: true,
                        serverTime: now.toISOString(),
                        attempt: {
                            _id: retryAttempt._id.toString(),
                            id: retryAttempt._id.toString(),
                            examId: exam._id.toString(),
                            studentId: studentId.toString(),
                            startTime: retryAttempt.startTime,
                            endTime: retryAttempt.expectedEndTime || expectedEndTime,
                            expectedEndTime: retryAttempt.expectedEndTime || expectedEndTime,
                            status: retryAttempt.status,
                            currentAnswers: retryAttempt.answers ? Object.fromEntries(retryAttempt.answers) : {},
                            exam: {
                                title: exam.title,
                                description: exam.description || '',
                                duration: exam.duration,
                                totalMarks: exam.totalMarks,
                                passingMarks: exam.passingMarks,
                                totalQuestions: questionsForStudent.length,
                                questions: questionsForStudent
                            },
                            student: {
                                id: studentId.toString(),
                                name: req.user.name,
                                email: req.user.email
                            }
                        }
                    });
                }
            }
            throw dbErr;
        }

        // Prepare questions without answers
        const questionsForStudent = await buildStudentExamQuestions(exam);

        res.status(201).json({
            success: true,
            serverTime: now.toISOString(),
            attempt: {
                _id: attempt._id.toString(),
                id: attempt._id.toString(),
                examId: exam._id.toString(),
                studentId: studentId.toString(),
                startTime: attempt.startTime,
                endTime: expectedEndTime,
                expectedEndTime: expectedEndTime,
                status: attempt.status,
                currentAnswers: {},
                exam: {
                    title: exam.title,
                    description: exam.description || '',
                    duration: exam.duration,
                    totalMarks: exam.totalMarks,
                    passingMarks: exam.passingMarks,
                    totalQuestions: questionsForStudent.length,
                    questions: questionsForStudent,
                    descriptiveQuestions: (exam.descriptiveQuestions || []).map(q => ({
                        id: q._id.toString(),
                        type: 'descriptive',
                        title: q.title,
                        description: q.description,
                        instructions: q.instructions,
                        maxMarks: q.maxMarks,
                        wordLimit: q.wordLimit,
                        minWords: q.minWords,
                        difficulty: q.difficulty,
                        category: q.category
                    }))
                },
                student: {
                    id: studentId.toString(),
                    name: req.user.name,
                    email: req.user.email
                }
            }
        });
    } catch (error) {
        console.error('Start exam attempt error:', error);
        res.status(500).json({
            error: error.message || 'Server error starting exam'
        });
    }
};

// Submit exam attempt (CRITICAL - TAKE EXAM)
export const submitExamAttempt = async (req, res) => {
    try {
        const { attemptId, answers, timeSpent } = req.body;

        if (!attemptId || !answers) {
            return res.status(400).json({
                success: false,
                error: 'Attempt ID and answers are required'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(attemptId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid attempt ID'
            });
        }

        // Get attempt
        const attempt = await ExamAttempt.findById(attemptId);

        if (!attempt) {
            return res.status(404).json({
                success: false,
                error: 'Attempt not found'
            });
        }

        // Check if attempt belongs to user
        if (attempt.studentId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized access'
            });
        }

        // Check if already submitted — Phase 9: immutable lockdown
        if (attempt.status === 'completed') {
            return res.status(409).json({
                success: false,
                error: 'Exam Already Submitted',
                code: 'ALREADY_SUBMITTED',
                submittedAt: attempt.endTime
            });
        }

        // Fetch exam for scoring (single query)
        const exam = await Exam.findById(attempt.examId)
            .populate('questions')
            .populate('codingQuestions')
            .populate({ path: 'descriptiveQuestions', select: '_id maxMarks' });

        if (!exam) {
            return res.status(404).json({ success: false, error: 'Exam not found' });
        }

        const hasDescriptiveQuestions = (exam.descriptiveQuestions?.length || 0) > 0;

        // Use attempt.expectedEndTime as the AUTHORITATIVE deadline.
        // This already factors in exam.endDateTimeUTC vs startTime + duration.
        // Fall back to startTime + duration only if expectedEndTime was never set.
        const deadline = attempt.expectedEndTime
            ? attempt.expectedEndTime
            : new Date(attempt.startTime.getTime() + exam.duration * 60 * 1000);
        const GRACE_PERIOD_MS = 60 * 1000; // 1 minute grace

        if (Date.now() > deadline.getTime() + GRACE_PERIOD_MS) {
            attempt.status = 'abandoned';
            await attempt.save();
            return res.status(410).json({
                success: false,
                error: 'Attempt time expired'
            });
        }

        // For the elapsedTime calculation used for timeSpent
        const elapsedTime = Date.now() - attempt.startTime.getTime();

        // Calculate score
        let score = 0;
        let correctAnswers = 0;
        const codingMarks = exam.codingQuestions.reduce(
            (total, question) => total + resolveOverrideMark(exam, question._id, question.marks), 0
        );
        // Subjective/descriptive marks are awarded later by the teacher, but their share of
        // totalMarks must still be reserved here — otherwise MCQ questions get over-credited
        // with marks that actually belong to the (not-yet-graded) subjective section.
        const descriptiveMarks = exam.descriptiveQuestions.reduce(
            (total, question) => total + resolveOverrideMark(exam, question._id, question.maxMarks), 0
        );
        // Marks pool remaining for MCQ questions that don't have a teacher-assigned custom mark
        const customMcqTotal = exam.questions.reduce((sum, question) => {
            const raw = exam.questionMarks?.get ? exam.questionMarks.get(question._id.toString()) : exam.questionMarks?.[question._id.toString()];
            return sum + (raw !== undefined && raw !== null && raw !== '' ? Number(raw) : 0);
        }, 0);
        const uncustomizedCount = exam.questions.filter(question => {
            const raw = exam.questionMarks?.get ? exam.questionMarks.get(question._id.toString()) : exam.questionMarks?.[question._id.toString()];
            return raw === undefined || raw === null || raw === '';
        }).length;
        const mcqMarksPool = Math.max(0, exam.totalMarks - codingMarks - descriptiveMarks - customMcqTotal);
        const marksPerQuestion = uncustomizedCount > 0 ? mcqMarksPool / uncustomizedCount : 0;
        const detailedResults = [];

        // Convert answers object to Map
        const answersMap = new Map(Object.entries(answers));

        for (const question of exam.questions) {
            const questionId = question._id.toString();
            const selectedAnswer = answersMap.get(questionId);
            const isCorrect = selectedAnswer === question.answer;
            const questionMarks = resolveMcqMark(exam, questionId, marksPerQuestion);

            if (isCorrect) {
                score += questionMarks;
                correctAnswers++;
            }

            detailedResults.push({
                questionId,
                question: question.question,
                selectedAnswer: selectedAnswer || 'Not answered',
                correctAnswer: question.answer,
                isCorrect,
                explanation: question.explanation || '',
                marks: isCorrect ? questionMarks : 0
            });
        }

        for (const codingQuestion of exam.codingQuestions) {
            const submission = await Submission.findOne({
                examAttemptId: attempt._id,
                codingQuestionId: codingQuestion._id
            }).sort({ submittedAt: -1 });
            const codingScore = submission ? Math.min(submission.score, codingQuestion.marks) : 0;
            score += codingScore;
            if (submission?.passed) correctAnswers++;
            detailedResults.push({
                questionId: codingQuestion._id.toString(),
                question: codingQuestion.title,
                selectedAnswer: submission ? 'Code submitted' : 'Not submitted',
                correctAnswer: 'Evaluated against hidden testcases',
                isCorrect: Boolean(submission?.passed),
                explanation: submission
                    ? `Passed ${submission.passedTestCases} hidden testcases; failed ${submission.failedTestCases}.`
                    : '',
                marks: codingScore
            });
        }

        // Calculate percentage and pass status
        const percentage = (score / exam.totalMarks) * 100;
        const passed = score >= exam.passingMarks;

        // Determine subjective status
        const subjectiveStatus = hasDescriptiveQuestions ? 'pending_evaluation' : 'not_applicable';

        // Update attempt — score EXCLUDES subjective marks (awarded later by teacher)
        attempt.answers = answersMap;
        attempt.score = Math.round(score * 100) / 100; // Round to 2 decimals
        attempt.percentage = exam.totalMarks > 0
            ? Math.round((score / exam.totalMarks) * 100 * 100) / 100
            : 0;
        attempt.passed = score >= (exam.passingMarks || 0);
        attempt.endTime = new Date();
        attempt.timeSpent = timeSpent || Math.floor(elapsedTime / 1000);
        attempt.status = 'completed';
        attempt.subjectiveStatus = subjectiveStatus;
        attempt.subjectiveScore = 0;

        await attempt.save();

        // ── Save subjective answers to DescriptiveAnswer collection ──────────
        // The SEB frontend stores ALL answers (MCQ + subjective) in attempt.answers.
        // The grading page reads from DescriptiveAnswer — so we extract and save them here.
        if (hasDescriptiveQuestions && exam.descriptiveQuestions?.length > 0) {
            try {
                const DescriptiveAnswer = (await import('../models/descriptive/descriptiveAnswer.js')).default;
                const upsertOps = exam.descriptiveQuestions.map(dq => {
                    const questionId = dq._id.toString();
                    const answerText = answersMap.get(questionId) || '';
                    const wordCount = answerText.trim()
                        ? answerText.trim().split(/\s+/).filter(Boolean).length
                        : 0;
                    return {
                        updateOne: {
                            filter: {
                                student: attempt.studentId,
                                exam: attempt.examId,
                                question: dq._id,
                            },
                            update: {
                                $set: {
                                    answer: answerText,
                                    wordCount,
                                    status: 'submitted',
                                    isSubmitted: true,
                                    submittedAt: new Date(),
                                    attemptId: attempt._id,
                                },
                            },
                            upsert: true,
                        },
                    };
                });
                await DescriptiveAnswer.bulkWrite(upsertOps);
                console.log(`✅ Saved ${exam.descriptiveQuestions.length} descriptive answer(s) for student ${attempt.studentId}`);
            } catch (descErr) {
                // Non-fatal — log but don't fail the submission
                console.error('⚠️  Failed to save descriptive answers:', descErr.message);
            }
        }
        // ─────────────────────────────────────────────────────────────────────

        // Update student's examAttempts array
        const User = (await import('../models/User/user.js')).default;
        await User.findOneAndUpdate(
            {
                _id: req.user._id,
                'examAttempts.attemptId': attempt._id
            },
            {
                $set: {
                    'examAttempts.$.status': 'completed',
                    'examAttempts.$.score': attempt.score,
                    'examAttempts.$.percentage': attempt.percentage,
                    'examAttempts.$.passed': attempt.passed,
                    'examAttempts.$.completedAt': attempt.endTime
                }
            }
        );

        res.status(200).json({
            success: true,
            message: 'Exam submitted successfully',
            result: {
                attemptId: attempt._id.toString(),
                mcqScore: Math.round((score - (attempt.score - (attempt.score))) * 100) / 100,
                codingScore: 0, // Individual coding scores are per-submission
                subjectiveStatus,
                score: attempt.score,
                totalMarks: exam.totalMarks,
                percentage: attempt.percentage,
                passed: attempt.passed,
                correctAnswers,
                totalQuestions: exam.questions.length + exam.codingQuestions.length + (exam.descriptiveQuestions?.length || 0),
                timeSpent: attempt.timeSpent,
                detailedResults
            }
        });
    } catch (error) {
        console.error('Submit exam attempt error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Server error submitting exam'
        });
    }
};

// Get attempt by ID
export const getAttemptById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid attempt ID'
            });
        }

        const attempt = await ExamAttempt.findById(id)
            .populate('examId', 'title totalMarks passingMarks')
            .populate('studentId', 'name email');

        if (!attempt) {
            return res.status(404).json({
                success: false,
                error: 'Attempt not found'
            });
        }

        // Check authorization
        const isStudent = req.user._id.toString() === attempt.studentId._id.toString();
        const exam = await Exam.findById(attempt.examId);
        const isTeacher = req.user._id.toString() === exam.createdBy.toString();

        if (!isStudent && !isTeacher) {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized access'
            });
        }

        // Get detailed results if completed
        let detailedResults = [];
        if (attempt.status === 'completed') {
            const questions = await Question.find({ _id: { $in: exam.questions } });
            const answersObj = Object.fromEntries(attempt.answers);
            const codingQuestions = await CodingQuestion.find({ _id: { $in: exam.codingQuestions } });
            const codingMarks = codingQuestions.reduce(
                (total, question) => total + resolveOverrideMark(exam, question._id, question.marks), 0
            );
            const descriptiveDocs = await DescriptiveQuestion.find({ _id: { $in: exam.descriptiveQuestions } }).select('maxMarks');
            const descriptiveMarks = descriptiveDocs.reduce(
                (total, question) => total + resolveOverrideMark(exam, question._id, question.maxMarks), 0
            );
            const customMcqTotal = questions.reduce((sum, q) => {
                const id = q._id.toString();
                const raw = exam.questionMarks?.get ? exam.questionMarks.get(id) : exam.questionMarks?.[id];
                return sum + (raw !== undefined && raw !== null && raw !== '' ? Number(raw) : 0);
            }, 0);
            const uncustomizedCount = questions.filter(q => {
                const id = q._id.toString();
                const raw = exam.questionMarks?.get ? exam.questionMarks.get(id) : exam.questionMarks?.[id];
                return raw === undefined || raw === null || raw === '';
            }).length;
            const mcqMarksPool = Math.max(0, attempt.totalMarks - codingMarks - descriptiveMarks - customMcqTotal);

            detailedResults = questions.map(q => {
                const questionId = q._id.toString();
                const selectedAnswer = answersObj[questionId];
                const isCorrect = selectedAnswer === q.answer;
                const marksPerQuestion = uncustomizedCount > 0 ? mcqMarksPool / uncustomizedCount : 0;
                const questionMarks = resolveMcqMark(exam, questionId, marksPerQuestion);

                return {
                    questionId,
                    question: q.question,
                    selectedAnswer: selectedAnswer || 'Not answered',
                    correctAnswer: q.answer,
                    isCorrect,
                    explanation: q.explanation || '',
                    marks: isCorrect ? questionMarks : 0
                };
            });

            for (const codingQuestion of codingQuestions) {
                const submission = await Submission.findOne({
                    examAttemptId: attempt._id,
                    codingQuestionId: codingQuestion._id
                }).sort({ submittedAt: -1 });
                detailedResults.push({
                    questionId: codingQuestion._id.toString(),
                    question: codingQuestion.title,
                    selectedAnswer: submission ? 'Code submitted' : 'Not submitted',
                    correctAnswer: 'Evaluated against hidden testcases',
                    isCorrect: Boolean(submission?.passed),
                    explanation: submission
                        ? `Passed ${submission.passedTestCases}; failed ${submission.failedTestCases}.`
                        : '',
                    marks: submission ? submission.score : 0
                });
            }
        }

        res.status(200).json({
            success: true,
            attempt: {
                id: attempt._id.toString(),
                exam: {
                    title: attempt.examId.title,
                    totalMarks: attempt.examId.totalMarks
                },
                student: {
                    name: attempt.studentId.name,
                    email: attempt.studentId.email
                },
                score: attempt.score,
                percentage: attempt.percentage,
                passed: attempt.passed,
                startTime: attempt.startTime,
                endTime: attempt.endTime,
                timeSpent: attempt.timeSpent,
                status: attempt.status,
                subjectiveStatus: attempt.subjectiveStatus || 'not_applicable',
                subjectiveScore: attempt.subjectiveScore || 0,
                detailed_results: detailedResults
            },
            // Result format used by getResult API call
            result: {
                attemptId: attempt._id.toString(),
                examTitle: attempt.examId.title,
                score: attempt.score,
                totalMarks: attempt.examId.totalMarks,
                percentage: attempt.percentage,
                passed: attempt.passed,
                correctAnswers: detailedResults.filter(r => r.isCorrect).length,
                totalQuestions: detailedResults.length,
                timeSpent: attempt.timeSpent,
                submittedAt: attempt.endTime,
                subjectiveStatus: attempt.subjectiveStatus || 'not_applicable',
                subjectiveScore: attempt.subjectiveScore || 0,
                detailed_results: detailedResults
            }
        });
    } catch (error) {
        console.error('Get attempt by ID error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Server error fetching attempt'
        });
    }
};

// Auto-save in-progress answers (does NOT score or complete the attempt)
export const saveAnswers = async (req, res) => {
    try {
        const { attemptId, answers } = req.body;

        if (!attemptId || !answers) {
            return res.status(400).json({
                success: false,
                error: 'Attempt ID and answers are required'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(attemptId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid attempt ID'
            });
        }

        const attempt = await ExamAttempt.findById(attemptId);

        if (!attempt) {
            return res.status(404).json({
                success: false,
                error: 'Attempt not found'
            });
        }

        if (attempt.studentId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized access'
            });
        }

        // If the attempt is already completed/submitted, return 200 silently.
        // This prevents spurious server errors from sendBeacon firing after submit.
        if (attempt.status !== 'in_progress') {
            return res.status(200).json({
                success: true,
                data: { savedAt: new Date().toISOString(), message: 'Attempt already completed — answers not overwritten' }
            });
        }

        // Merge rather than overwrite, so a stale client can't wipe newer answers.
        for (const [questionId, answer] of Object.entries(answers)) {
            attempt.answers.set(questionId, answer);
        }
        attempt.lastActivity = new Date();
        await attempt.save();

        res.status(200).json({
            success: true,
            data: {
                savedAt: attempt.lastActivity.toISOString(),
                answersCount: attempt.answers.size,
                attemptId: attempt._id.toString()
            }
        });
    } catch (error) {
        console.error('Save answers error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Server error saving answers'
        });
    }
};

// Heartbeat — keeps the attempt marked active and reports remaining time
export const heartbeat = async (req, res) => {
    try {
        const { attemptId } = req.body;

        if (!attemptId || !mongoose.Types.ObjectId.isValid(attemptId)) {
            return res.status(400).json({
                success: false,
                error: 'Valid attempt ID is required'
            });
        }

        const attempt = await ExamAttempt.findById(attemptId);

        if (!attempt) {
            return res.status(404).json({
                success: false,
                error: 'Attempt not found'
            });
        }

        if (attempt.studentId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized access'
            });
        }

        attempt.lastActivity = new Date();
        await attempt.save();

        // Use attempt.expectedEndTime as the authoritative deadline for time remaining.
        // This is consistent with what the frontend timer uses.
        let timeRemaining = 0;
        if (attempt.expectedEndTime) {
            timeRemaining = Math.max(0, Math.floor((attempt.expectedEndTime.getTime() - Date.now()) / 1000));
        } else {
            const exam = await Exam.findById(attempt.examId).select('duration');
            const timeLimitMs = (exam?.duration || 0) * 60 * 1000;
            const elapsedMs = Date.now() - attempt.startTime.getTime();
            timeRemaining = Math.max(0, Math.floor((timeLimitMs - elapsedMs) / 1000));
        }

        res.status(200).json({
            success: true,
            data: {
                sessionActive: attempt.status === 'in_progress',
                timeRemaining,
                serverTime: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Heartbeat error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Server error processing heartbeat'
        });
    }
};

// Get student's attempts
export const getStudentAttempts = async (req, res) => {
    try {
        const { studentId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(studentId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid student ID'
            });
        }

        // Check authorization
        if (req.user._id.toString() !== studentId) {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized access'
            });
        }

        const attempts = await ExamAttempt.find({ studentId, status: 'completed' })
            .populate('examId', 'title description duration totalMarks passingMarks')
            .sort({ createdAt: -1 });

        const formattedAttempts = attempts.map(a => ({
            id: a._id.toString(),
            examId: a.examId._id.toString(),
            exam: {
                id: a.examId._id.toString(),
                title: a.examId.title,
                description: a.examId.description,
                duration: a.examId.duration,
                totalMarks: a.examId.totalMarks,
                passingMarks: a.examId.passingMarks
            },
            score: a.score,
            percentage: a.percentage,
            passed: a.passed,
            status: a.status,
            startTime: a.startTime ? a.startTime.toISOString() : null,
            endTime: a.endTime ? a.endTime.toISOString() : null,
            timeSpent: a.timeSpent,
            submittedAt: a.endTime ? a.endTime.toISOString() : null,
            createdAt: a.createdAt ? a.createdAt.toISOString() : null
        }));

        res.status(200).json({
            success: true,
            count: formattedAttempts.length,
            data: formattedAttempts
        });
    } catch (error) {
        console.error('Get student attempts error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Server error fetching attempts'
        });
    }
};

// Get attempts for an exam (Teacher analytics)
export const getExamAttempts = async (req, res) => {
    try {
        const { examId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(examId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid exam ID'
            });
        }

        // Check if teacher owns the exam
        const exam = await Exam.findById(examId);
        if (!exam) {
            return res.status(404).json({
                success: false,
                error: 'Exam not found'
            });
        }

        if (exam.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized access'
            });
        }

        const allAttempts = await ExamAttempt.find({ examId })
            .populate('studentId', 'name email')
            .sort({ createdAt: -1 });

        // Keep only the latest attempt per student
        const latestAttemptsMap = new Map();
        for (const a of allAttempts) {
            const studentIdStr = a.studentId && typeof a.studentId === 'object'
                ? a.studentId._id.toString()
                : String(a.studentId);
            if (!latestAttemptsMap.has(studentIdStr)) {
                latestAttemptsMap.set(studentIdStr, a);
            }
        }
        const attempts = Array.from(latestAttemptsMap.values());

        // Calculate statistics
        const completedAttempts = attempts.filter(a => a.status === 'completed');
        const inProgressAttempts = attempts.filter(a => a.status === 'in_progress');
        const scores = completedAttempts.map(a => a.score || 0);
        const passedCount = completedAttempts.filter(a => a.passed).length;

        const statistics = {
            totalAttempts: attempts.length,
            completedAttempts: completedAttempts.length,
            inProgressAttempts: inProgressAttempts.length,
            averageScore: scores.length > 0
                ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
                : 0,
            highestScore: scores.length > 0 ? Math.max(...scores) : 0,
            lowestScore: scores.length > 0 ? Math.min(...scores) : 0,
            passRate: completedAttempts.length > 0
                ? Math.round((passedCount / completedAttempts.length) * 100 * 100) / 100
                : 0
        };

        const formattedAttempts = attempts.map(a => {
            const studentObj = a.studentId && typeof a.studentId === 'object' ? a.studentId : null;
            return {
                id: a._id.toString(),
                status: a.status,
                student: {
                    id: studentObj?._id?.toString() || (typeof a.studentId === 'string' ? a.studentId : 'unknown'),
                    name: studentObj?.name || 'Unknown Candidate',
                    email: studentObj?.email || 'N/A'
                },
                score: a.score || 0,
                totalMarks: exam.totalMarks || 0,
                percentage: a.percentage || 0,
                passed: Boolean(a.passed),
                subjectiveStatus: a.subjectiveStatus || 'not_applicable',
                subjectiveScore: a.subjectiveScore || 0,
                submittedAt: a.endTime || a.updatedAt || a.createdAt,
                startTime: a.startTime,
                timeSpent: a.timeSpent || 0,
                violationSummary: a.violationSummary || { tabSwitches: 0, windowBlurs: 0, copyAttempts: 0, pasteAttempts: 0, devToolsAttempts: 0, totalViolations: 0 },
                violations: a.violations || []
            };
        });

        res.status(200).json({
            success: true,
            count: formattedAttempts.length,
            statistics,
            attempts: formattedAttempts
        });
    } catch (error) {
        console.error('Get exam attempts error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Server error fetching exam attempts'
        });
    }
};

// Get current user's attempts (Student: my-attempts endpoint)
export const getMyAttempts = async (req, res) => {
    try {
        const studentId = req.user._id;

        const attempts = await ExamAttempt.find({ studentId })
            .populate('examId', 'title description duration totalMarks passingMarks')
            .sort({ createdAt: -1 });

        // Guard against orphaned attempts where the exam document was deleted
        const formattedAttempts = attempts
            .filter(a => a.examId && typeof a.examId === 'object' && a.examId._id)
            .map(a => ({
                id: a._id.toString(),
                examId: a.examId._id.toString(),
                exam: {
                    id: a.examId._id.toString(),
                    title: a.examId.title || 'Exam Deleted',
                    description: a.examId.description || '',
                    duration: a.examId.duration || 0,
                    totalMarks: a.examId.totalMarks || 0,
                    passingMarks: a.examId.passingMarks || 0
                },
                score: a.score,
                percentage: a.percentage,
                passed: a.passed,
                status: a.status,
                startTime: a.startTime ? a.startTime.toISOString() : null,
                endTime: a.endTime ? a.endTime.toISOString() : null,
                timeSpent: a.timeSpent,
                submittedAt: a.endTime ? a.endTime.toISOString() : null,
                createdAt: a.createdAt ? a.createdAt.toISOString() : null
            }));

        res.status(200).json({
            success: true,
            count: formattedAttempts.length,
            data: formattedAttempts
        });
    } catch (error) {
        console.error('Get my attempts error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Server error fetching attempts'
        });
    }
};

// Get active attempt for an exam
export const getActiveAttemptForExam = async (req, res) => {
    try {
        const { examId } = req.params;
        const studentId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(examId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid exam ID'
            });
        }

        const activeAttempt = await ExamAttempt.findOne({
            examId,
            studentId,
            status: 'in_progress'
        }).populate('examId', 'title duration totalMarks');

        if (!activeAttempt) {
            return res.status(404).json({
                success: false,
                error: 'No active attempt found for this exam'
            });
        }

        res.status(200).json({
            success: true,
            attempt: {
                id: activeAttempt._id.toString(),
                examId: activeAttempt.examId._id.toString(),
                examTitle: activeAttempt.examId.title,
                startTime: activeAttempt.startTime,
                status: activeAttempt.status
            }
        });
    } catch (error) {
        console.error('Get active attempt error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Server error fetching active attempt'
        });
    }
};

// Phase 2: Report a violation event from the frontend
export const reportViolation = async (req, res) => {
    try {
        const { attemptId, type, metadata } = req.body;

        if (!attemptId || !type) {
            return res.status(400).json({ success: false, error: 'attemptId and type are required' });
        }

        if (!mongoose.Types.ObjectId.isValid(attemptId)) {
            return res.status(400).json({ success: false, error: 'Invalid attempt ID' });
        }

        const attempt = await ExamAttempt.findById(attemptId);
        if (!attempt) {
            return res.status(404).json({ success: false, error: 'Attempt not found' });
        }

        if (attempt.studentId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, error: 'Unauthorized' });
        }

        // Append violation record
        attempt.violations.push({ type, metadata: metadata || {} });

        // Update summary counters
        if (!attempt.violationSummary) {
            attempt.violationSummary = { tabSwitches: 0, windowBlurs: 0, copyAttempts: 0, pasteAttempts: 0, devToolsAttempts: 0, totalViolations: 0 };
        }
        const s = attempt.violationSummary;
        if (type === 'tab_switch') s.tabSwitches += 1;
        else if (type === 'window_blur') s.windowBlurs += 1;
        else if (type === 'copy_attempt') s.copyAttempts += 1;
        else if (type === 'paste_attempt') s.pasteAttempts += 1;
        else if (type === 'devtools_open') s.devToolsAttempts += 1;
        s.totalViolations += 1;

        await attempt.save();

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Report violation error:', error);
        res.status(500).json({ success: false, error: error.message || 'Server error reporting violation' });
    }
};

// Phase 2: Teacher — get detailed violation log for an exam's attempts
export const getViolationLog = async (req, res) => {
    try {
        const { examId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(examId)) {
            return res.status(400).json({ success: false, error: 'Invalid exam ID' });
        }

        const exam = await Exam.findById(examId);
        if (!exam) return res.status(404).json({ success: false, error: 'Exam not found' });
        if (exam.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, error: 'Unauthorized access' });
        }

        const attempts = await ExamAttempt.find({ examId })
            .populate('studentId', 'name email')
            .select('studentId violations violationSummary status startTime endTime')
            .sort({ createdAt: -1 });

        const result = attempts.map(a => ({
            attemptId: a._id.toString(),
            student: { name: a.studentId?.name, email: a.studentId?.email },
            status: a.status,
            violationSummary: a.violationSummary,
            violations: a.violations
        }));

        res.status(200).json({ success: true, count: result.length, data: result });
    } catch (error) {
        console.error('Get violation log error:', error);
        res.status(500).json({ success: false, error: error.message || 'Server error' });
    }
};