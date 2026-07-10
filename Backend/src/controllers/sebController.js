import Exam from '../models/exam/exam.js';
import ExamAttempt from '../models/exam/examAttempt.js';
import User from '../models/User/user.js';
import mongoose from 'mongoose';
import { verifyExamAccessToken, generateSEBSessionToken } from '../utils/examLinkUtils.js';
import { generateSEBConfig as buildSEBConfig } from '../utils/sebConfigGenerator.js';

/**
 * Verify exam link and student eligibility
 * This endpoint is called by primary frontend to check if student can attempt exam
 *
 * POST /api/seb/verify-exam-link
 * Body: {
 *   examId: string,
 *   studentId: string,
 *   token: string (exam access token from email)
 * }
 */
/**
 * Core eligibility checks shared by verifyExamLink and getSEBSessionToken.
 * Returns a plain result object — never touches `res` — so both callers can
 * decide how to respond. (Previously getSEBSessionToken called verifyExamLink
 * directly and checked `.success` on the Express response object, which is
 * always undefined — so it never actually returned a session token.)
 */
const runExamLinkVerification = async (examId, studentId, token) => {
    if (!examId || !studentId || !token) {
        return { success: false, status: 400, error: 'Missing required fields: examId, studentId, and token are required' };
    }

    if (!mongoose.Types.ObjectId.isValid(examId) || !mongoose.Types.ObjectId.isValid(studentId)) {
        return { success: false, status: 400, error: 'Invalid examId or studentId format' };
    }

    let tokenData;
    try {
        tokenData = verifyExamAccessToken(token);
    } catch (error) {
        return { success: false, status: 401, error: 'Invalid or expired exam access token', code: 'TOKEN_INVALID' };
    }

    if (tokenData.examId !== examId || tokenData.studentId !== studentId) {
        return { success: false, status: 403, error: 'Token does not match exam or student', code: 'TOKEN_MISMATCH' };
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
        return { success: false, status: 404, error: 'Exam not found', code: 'EXAM_NOT_FOUND' };
    }

    if (!exam.isActive) {
        return { success: false, status: 403, error: 'This exam is not active', code: 'EXAM_INACTIVE', data: { exam: { title: exam.title, isActive: false } } };
    }

    const now = new Date();

    if (exam.startDate && new Date(exam.startDate) > now) {
        return { success: false, status: 403, error: 'Exam has not started yet', code: 'EXAM_NOT_STARTED', data: { exam: { title: exam.title, startDate: exam.startDate } } };
    }

    if (exam.endDate) {
        const endDate = new Date(exam.endDate);
        if (exam.endTime) {
            const [hours, minutes] = exam.endTime.split(':');
            endDate.setHours(parseInt(hours));
            endDate.setMinutes(parseInt(minutes));
            endDate.setSeconds(59);
        }
        if (now > endDate) {
            return { success: false, status: 403, error: 'Exam has ended', code: 'EXAM_ENDED', data: { exam: { title: exam.title, endDate: exam.endDate, endTime: exam.endTime } } };
        }
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student' || !student.isActive) {
        return { success: false, status: 403, error: 'Student not found or not active', code: 'STUDENT_INVALID' };
    }

    if (exam.assignedCandidates && exam.assignedCandidates.length > 0) {
        const isAssigned = exam.assignedCandidates.some(
            (candidateId) => candidateId.toString() === studentId.toString()
        );
        if (!isAssigned) {
            return { success: false, status: 403, error: 'Student not assigned to this exam', code: 'NOT_ASSIGNED' };
        }
    }

    const activeAttempt = await ExamAttempt.findOne({ examId, studentId, status: 'in_progress' });
    if (activeAttempt) {
        return {
            success: false, status: 409, error: 'You already have an active attempt for this exam', code: 'ACTIVE_ATTEMPT_EXISTS',
            data: { attemptId: activeAttempt._id.toString(), startTime: activeAttempt.startTime }
        };
    }

    if (!exam.allowRetakes) {
        const previousAttempt = await ExamAttempt.findOne({ examId, studentId, status: 'completed' });
        if (previousAttempt) {
            return {
                success: false, status: 409, error: 'You have already attempted this exam. Retakes are not allowed.', code: 'RETAKE_NOT_ALLOWED',
                data: { previousAttempt: { score: previousAttempt.score, submittedAt: previousAttempt.endTime } }
            };
        }
    }

    return {
        success: true,
        status: 200,
        exam,
        data: {
            examId: exam._id.toString(),
            canAttempt: true,
            exam: {
                id: exam._id.toString(),
                title: exam.title,
                description: exam.description,
                duration: exam.duration,
                totalMarks: exam.totalMarks,
                passingMarks: exam.passingMarks,
                startDate: exam.startDate,
                endDate: exam.endDate,
                allowRetakes: exam.allowRetakes
            },
            student: { id: student._id.toString(), name: student.name, email: student.email },
            attemptStatus: { hasAttempted: false, previousAttempts: 0, allowRetakes: exam.allowRetakes }
        }
    };
};

export const verifyExamLink = async (req, res) => {
    try {
        const { examId, studentId, token } = req.body;
        const result = await runExamLinkVerification(examId, studentId, token);

        if (!result.success) {
            return res.status(result.status).json({ success: false, error: result.error, code: result.code, data: result.data });
        }

        return res.status(200).json({
            success: true,
            message: 'Exam eligibility verified successfully',
            data: result.data
        });
    } catch (error) {
        console.error('Verify exam link error:', error);
        return res.status(500).json({
            success: false,
            error: 'Server error verifying exam eligibility',
            code: 'SERVER_ERROR'
        });
    }
};

/**
 * Generate exam access links for assigned students
 * This is called by teacher when assigning exam to students
 *
 * POST /api/seb/generate-exam-links
 * Body: {
 *   examId: string,
 *   studentIds: string[],
 *   frontendBaseUrl: string
 * }
 */
export const generateExamLinks = async (req, res) => {
    try {
        const { examId, studentIds, frontendBaseUrl } = req.body;

        // Validate required fields
        if (!examId || !studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: examId and studentIds array are required'
            });
        }

        if (!frontendBaseUrl) {
            return res.status(400).json({
                success: false,
                error: 'frontendBaseUrl is required'
            });
        }

        // Validate exam exists
        const exam = await Exam.findById(examId);
        if (!exam) {
            return res.status(404).json({
                success: false,
                error: 'Exam not found'
            });
        }

        // Check if user is the exam creator
        if (exam.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized: You can only generate links for your own exams'
            });
        }

        // Validate all students
        const students = await User.find({
            _id: { $in: studentIds },
            role: 'student',
            isActive: true
        });

        if (students.length !== studentIds.length) {
            return res.status(400).json({
                success: false,
                error: 'One or more student IDs are invalid'
            });
        }

        // Generate links for each student
        const { generateExamLink } = await import('../utils/examLinkUtils.js');
        const examLinks = students.map(student => ({
            studentId: student._id.toString(),
            studentName: student.name,
            studentEmail: student.email,
            examLink: generateExamLink(
                exam._id.toString(),
                student._id.toString(),
                exam.duration,
                frontendBaseUrl
            )
        }));

        return res.status(200).json({
            success: true,
            message: 'Exam links generated successfully',
            data: {
                examId: exam._id.toString(),
                examTitle: exam.title,
                links: examLinks
            }
        });

    } catch (error) {
        console.error('Generate exam links error:', error);
        return res.status(500).json({
            success: false,
            error: 'Server error generating exam links'
        });
    }
};

/**
 * Get SEB session token for verified exam attempt
 * Called by primary frontend after exam verification succeeds
 * This token is then used to generate SEB config
 *
 * POST /api/seb/get-session-token
 * Body: {
 *   examId: string,
 *   studentId: string,
 *   token: string (exam access token)
 * }
 */
export const getSEBSessionToken = async (req, res) => {
    try {
        const { examId, studentId, token } = req.body;

        if (!examId || !studentId || !token) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        const result = await runExamLinkVerification(examId, studentId, token);

        if (!result.success) {
            return res.status(result.status).json({ success: false, error: result.error, code: result.code, data: result.data });
        }

        const exam = result.exam;

        // Generate SEB session token
        const sebSessionToken = generateSEBSessionToken(examId, studentId, exam.duration);

        return res.status(200).json({
            success: true,
            message: 'SEB session token generated',
            data: {
                sebSessionToken,
                expiresIn: `${exam.duration + 30} minutes`
            }
        });

    } catch (error) {
        console.error('Get SEB session token error:', error);
        return res.status(500).json({
            success: false,
            error: 'Server error generating SEB session token'
        });
    }
};

export const downloadSEBConfig = async (req, res) => {
    try {
        const examId = req.query.examId || req.body.examId;
        const sessionToken = req.query.sessionToken || req.body.sessionToken;

        if (!examId || !mongoose.Types.ObjectId.isValid(examId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid examId'
            });
        }

        if (!sessionToken) {
            return res.status(400).json({
                success: false,
                error: 'sessionToken is required'
            });
        }

        const exam = await Exam.findById(examId);
        if (!exam) {
            return res.status(404).json({
                success: false,
                error: 'Exam not found'
            });
        }

        // Must point at the SEB student frontend (its own dev server/port),
        // not the primary teacher frontend — and must carry the real session
        // token, since /exam/:examId/:sessionToken is the actual route.
        const sebFrontendUrl = process.env.SEB_FRONTEND_URL || 'http://localhost:5174';
        const startUrl = `${sebFrontendUrl}/exam/${examId}/${sessionToken}`;
        const quitPassword = process.env.SEB_QUIT_PASSWORD || 'quit123';
        const config = buildSEBConfig({ startUrl, quitPassword });

        res.setHeader('Content-Type', 'application/seb');
        res.setHeader('Content-Disposition', `attachment; filename="secure-exam-${examId}.seb"`);
        return res.status(200).send(config);
    } catch (error) {
        console.error('Download SEB config error:', error);
        return res.status(500).json({
            success: false,
            error: 'Server error generating SEB configuration'
        });
    }
};
