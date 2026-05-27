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
export const verifyExamLink = async (req, res) => {
    console.log('\n🔍 ===== VERIFY EXAM LINK REQUEST RECEIVED =====');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Request headers:', JSON.stringify(req.headers, null, 2));

    try {
        const { examId, studentId, token } = req.body;

        console.log('\n📋 Extracted values:');
        console.log('examId:', examId);
        console.log('studentId:', studentId);
        console.log('token:', token ? token.substring(0, 50) + '...' : 'undefined');

        // Validate required fields
        if (!examId || !studentId || !token) {
            console.log('❌ Missing required fields');
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: examId, studentId, and token are required'
            });
        }

        // Validate ObjectId formats
        if (!mongoose.Types.ObjectId.isValid(examId) || !mongoose.Types.ObjectId.isValid(studentId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid examId or studentId format'
            });
        }

        // 1. Verify the exam access token
        let tokenData;
        try {
            tokenData = verifyExamAccessToken(token);
        } catch (error) {
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired exam access token',
                code: 'TOKEN_INVALID'
            });
        }

        // 2. Verify token matches the request
        if (tokenData.examId !== examId || tokenData.studentId !== studentId) {
            return res.status(403).json({
                success: false,
                error: 'Token does not match exam or student',
                code: 'TOKEN_MISMATCH'
            });
        }

        // 3. Get exam details
        const exam = await Exam.findById(examId);
        if (!exam) {
            return res.status(404).json({
                success: false,
                error: 'Exam not found',
                code: 'EXAM_NOT_FOUND'
            });
        }

        // 4. Check if exam is active
        if (!exam.isActive) {
            return res.status(403).json({
                success: false,
                error: 'This exam is not active',
                code: 'EXAM_INACTIVE',
                data: { exam: { title: exam.title, isActive: false } }
            });
        }

        // 5. Check exam date/time window
        const now = new Date();

        if (exam.startDate && new Date(exam.startDate) > now) {
            return res.status(403).json({
                success: false,
                error: 'Exam has not started yet',
                code: 'EXAM_NOT_STARTED',
                data: {
                    exam: {
                        title: exam.title,
                        startDate: exam.startDate
                    }
                }
            });
        }

        // if (exam.endDate && new Date(exam.endDate) < now) {
        //     return res.status(403).json({
        //         success: false,
        //         error: 'Exam has ended',
        //         code: 'EXAM_ENDED',
        //         data: {
        //             exam: {
        //                 title: exam.title,
        //                 endDate: exam.endDate
        //             }
        //         }
        //     });
        // }

        // Proper end date + end time validation
         
        if (exam.endDate) {

            // Get end date
            const endDate = new Date(exam.endDate);

            // Add end time if available
            if (exam.endTime) {

                const [hours, minutes] = exam.endTime.split(':');

                endDate.setHours(parseInt(hours));
                endDate.setMinutes(parseInt(minutes));
                endDate.setSeconds(59);

            }

            console.log('Current Time:', now);
            console.log('Exam End Time:', endDate);

            if (now > endDate) {

                return res.status(403).json({
                    success: false,
                    error: 'Exam has ended',
                    code: 'EXAM_ENDED',
                    data: {
                        exam: {
                            title: exam.title,
                            endDate: exam.endDate,
                            endTime: exam.endTime
                        }
                    }
                });

            }
        }

        // 6. Verify student exists and is active
        const student = await User.findById(studentId);
        if (!student || student.role !== 'student' || !student.isActive) {
            return res.status(403).json({
                success: false,
                error: 'Student not found or not active',
                code: 'STUDENT_INVALID'
            });
        }

        // 7. Check if student is assigned to this exam
        if (exam.assignedCandidates && exam.assignedCandidates.length > 0) {
            console.log('=== ASSIGNMENT CHECK DEBUG ===');
            console.log('Exam ID:', examId);
            console.log('Student ID from request:', studentId);
            console.log('Student ID type:', typeof studentId);
            console.log('Assigned candidates count:', exam.assignedCandidates.length);
            console.log('Assigned candidates:', exam.assignedCandidates.map(c => c.toString()));

            const isAssigned = exam.assignedCandidates.some(
                candidateId => {
                    const candidateStr = candidateId.toString();
                    const studentStr = studentId.toString();
                    console.log(`Comparing: ${candidateStr} === ${studentStr} ? ${candidateStr === studentStr}`);
                    return candidateStr === studentStr;
                }
            );

            console.log('Is student assigned?', isAssigned);
            console.log('=== END DEBUG ===');

            if (!isAssigned) {
                return res.status(403).json({
                    success: false,
                    error: 'Student not assigned to this exam',
                    code: 'NOT_ASSIGNED'
                });
            }
        }

        // 8. Check for existing active attempt
        const activeAttempt = await ExamAttempt.findOne({
            examId,
            studentId,
            status: 'in_progress'
        });

        if (activeAttempt) {
            return res.status(409).json({
                success: false,
                error: 'You already have an active attempt for this exam',
                code: 'ACTIVE_ATTEMPT_EXISTS',
                data: {
                    attemptId: activeAttempt._id.toString(),
                    startTime: activeAttempt.startTime
                }
            });
        }

        // 9. Check retake policy
        if (!exam.allowRetakes) {
            const previousAttempt = await ExamAttempt.findOne({
                examId,
                studentId,
                status: 'completed'
            });

            if (previousAttempt) {
                return res.status(409).json({
                    success: false,
                    error: 'You have already attempted this exam. Retakes are not allowed.',
                    code: 'RETAKE_NOT_ALLOWED',
                    data: {
                        previousAttempt: {
                            score: previousAttempt.score,
                            submittedAt: previousAttempt.endTime
                        }
                    }
                });
            }
        }

        // 10. All checks passed - student can attempt exam
        return res.status(200).json({
        success: true,
        message: 'Exam eligibility verified successfully',
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

            student: {
                id: student._id.toString(),
                name: student.name,
                email: student.email
            },

            attemptStatus: {
                hasAttempted: false,
                previousAttempts: 0,
                allowRetakes: exam.allowRetakes
            }
        }
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

        // Validate required fields
        if (!examId || !studentId || !token) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        // First verify the exam link (reuse the verification logic)
        const verificationResult = await verifyExamLink(req, res);

        // If verification failed, response already sent
        if (!verificationResult || !verificationResult.success) {
            return;
        }

        // Get exam to know duration
        const exam = await Exam.findById(examId);

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

        if (!examId || !mongoose.Types.ObjectId.isValid(examId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid examId'
            });
        }

        const exam = await Exam.findById(examId);
        if (!exam) {
            return res.status(404).json({
                success: false,
                error: 'Exam not found'
            });
        }

        const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const startUrl = `${frontendBaseUrl}/exam/start?examId=${examId}`;
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
