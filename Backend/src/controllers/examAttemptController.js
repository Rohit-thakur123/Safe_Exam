import ExamAttempt from '../models/exam/examAttempt.js';
import Exam from '../models/exam/exam.js';
import Question from '../models/exam/question.js';
import mongoose from 'mongoose';

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
        const exam = await Exam.findById(examId).populate('questions');

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

        // Check if student already has an active attempt
        const existingAttempt = await ExamAttempt.findOne({
            examId,
            studentId,
            status: 'in_progress'
        });

        if (existingAttempt) {
            return res.status(409).json({
                success: false,
                error: 'You already have an active attempt for this exam'
            });
        }

        // Check if retakes are allowed
        if (!exam.allowRetakes) {
            const previousAttempt = await ExamAttempt.findOne({
                examId,
                studentId,
                status: 'completed'
            });

            if (previousAttempt) {
                return res.status(409).json({
                    success: false,
                    error: 'Retakes are not allowed for this exam'
                });
            }
        }

        // Get client info
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'];

        // Create exam attempt
        const attempt = new ExamAttempt({
            examId,
            studentId,
            totalMarks: exam.totalMarks,
            startTime: new Date(),
            status: 'in_progress',
            ipAddress,
            userAgent
        });

        await attempt.save();

        // Prepare questions without answers
        const questionsForStudent = exam.questions.map(q => ({
            id: q._id.toString(),
            question: q.question,
            options: q.options,
            difficulty: q.difficulty,
            category: q.category
        }));

        res.status(201).json({
            attempt: {
                _id: attempt._id.toString(),
                id: attempt._id.toString(),
                examId: exam._id.toString(),
                studentId: studentId.toString(),
                startTime: attempt.startTime,
                status: attempt.status,
                exam: {
                    title: exam.title,
                    duration: exam.duration,
                    totalMarks: exam.totalMarks,
                    questions: questionsForStudent
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

        // Check if already submitted
        if (attempt.status === 'completed') {
            return res.status(409).json({
                success: false,
                error: 'Attempt already submitted'
            });
        }

        // Check if time expired
        const exam = await Exam.findById(attempt.examId).populate('questions');
        const timeLimitMs = exam.duration * 60 * 1000;
        const elapsedTime = Date.now() - attempt.startTime.getTime();

        if (elapsedTime > timeLimitMs + 60000) { // 1 minute grace period
            attempt.status = 'abandoned';
            await attempt.save();
            return res.status(410).json({
                success: false,
                error: 'Attempt time expired'
            });
        }

        // Calculate score
        let score = 0;
        let correctAnswers = 0;
        const marksPerQuestion = exam.totalMarks / exam.questions.length;
        const detailedResults = [];

        // Convert answers object to Map
        const answersMap = new Map(Object.entries(answers));

        for (const question of exam.questions) {
            const questionId = question._id.toString();
            const selectedAnswer = answersMap.get(questionId);
            const isCorrect = selectedAnswer === question.answer;

            if (isCorrect) {
                score += marksPerQuestion;
                correctAnswers++;
            }

            detailedResults.push({
                questionId,
                question: question.question,
                selectedAnswer: selectedAnswer || 'Not answered',
                correctAnswer: question.answer,
                isCorrect,
                explanation: question.explanation || '',
                marks: isCorrect ? marksPerQuestion : 0
            });
        }

        // Calculate percentage and pass status
        const percentage = (score / exam.totalMarks) * 100;
        const passed = score >= exam.passingMarks;

        // Update attempt
        attempt.answers = answersMap;
        attempt.score = Math.round(score * 100) / 100; // Round to 2 decimals
        attempt.percentage = Math.round(percentage * 100) / 100;
        attempt.passed = passed;
        attempt.endTime = new Date();
        attempt.timeSpent = timeSpent || Math.floor(elapsedTime / 1000);
        attempt.status = 'completed';

        await attempt.save();

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
                score: attempt.score,
                totalMarks: exam.totalMarks,
                percentage: attempt.percentage,
                passed: attempt.passed,
                correctAnswers,
                totalQuestions: exam.questions.length,
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

            detailedResults = questions.map(q => {
                const questionId = q._id.toString();
                const selectedAnswer = answersObj[questionId];
                const isCorrect = selectedAnswer === q.answer;
                const marksPerQuestion = attempt.totalMarks / questions.length;

                return {
                    questionId,
                    question: q.question,
                    selectedAnswer: selectedAnswer || 'Not answered',
                    correctAnswer: q.answer,
                    isCorrect,
                    explanation: q.explanation || '',
                    marks: isCorrect ? marksPerQuestion : 0
                };
            });
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

        const attempts = await ExamAttempt.find({ examId })
            .populate('studentId', 'name email')
            .sort({ createdAt: -1 });

        // Calculate statistics
        const completedAttempts = attempts.filter(a => a.status === 'completed');
        const scores = completedAttempts.map(a => a.score);
        const passedCount = completedAttempts.filter(a => a.passed).length;

        const statistics = {
            totalAttempts: attempts.length,
            completedAttempts: completedAttempts.length,
            averageScore: scores.length > 0
                ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
                : 0,
            highestScore: scores.length > 0 ? Math.max(...scores) : 0,
            lowestScore: scores.length > 0 ? Math.min(...scores) : 0,
            passRate: completedAttempts.length > 0
                ? Math.round((passedCount / completedAttempts.length) * 100 * 100) / 100
                : 0
        };

        const formattedAttempts = completedAttempts.map(a => ({
            id: a._id.toString(),
            student: {
                name: a.studentId.name,
                email: a.studentId.email
            },
            score: a.score,
            percentage: a.percentage,
            passed: a.passed,
            submittedAt: a.endTime,
            timeSpent: a.timeSpent
        }));

        res.status(200).json({
            success: true,
            count: completedAttempts.length,
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
