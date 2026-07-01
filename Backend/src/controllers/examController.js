import Exam from '../models/exam/exam.js';
import Question from '../models/exam/question.js';
import CodingQuestion from '../models/exam/codingQuestion.js';
import ExamAttempt from '../models/exam/examAttempt.js';
import User from '../models/User/user.js';
import mongoose from 'mongoose';
import { sendBulkExamAssignmentEmails } from '../services/examEmailService.js';
import {
    buildStudentExamQuestions,
    getVisibleSamplesByQuestion,
    serializeCodingQuestionForStudent
} from '../utils/examQuestionUtils.js';

// Create new exam
export const createExam = async (req, res) => {
    try {
        const { title, description, questions = [], codingQuestions = [], duration, totalMarks, passingMarks, startDate, endDate, startTime, endTime, allowRetakes, shuffleQuestions, assignedStudents, sendEmailNotification } = req.body;

        if (!Array.isArray(questions) || !Array.isArray(codingQuestions)) {
            return res.status(400).json({ success: false, error: 'Questions and coding questions must be arrays' });
        }

        // Validate required fields
        if (!title || (!questions.length && !codingQuestions.length) || !duration || !totalMarks || !passingMarks) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        if (new Set(questions.map(String)).size !== questions.length) {
            return res.status(400).json({ success: false, error: 'Duplicate questions are not allowed' });
        }

        // Validate questions exist
        const validQuestions = await Question.find({ _id: { $in: questions }, isActive: true });
        if (validQuestions.length !== questions.length) {
            return res.status(400).json({
                success: false,
                error: 'One or more questions are invalid or inactive'
            });
        }

        if (new Set(codingQuestions.map(String)).size !== codingQuestions.length) {
            return res.status(400).json({ success: false, error: 'Duplicate coding questions are not allowed' });
        }
        const validCodingQuestions = await CodingQuestion.find({
            _id: { $in: codingQuestions },
            isActive: true
        });
        if (validCodingQuestions.length !== codingQuestions.length) {
            return res.status(400).json({ success: false, error: 'One or more coding questions are invalid or inactive' });
        }

        // Validate assigned students if provided
        let validatedStudents = [];
        let studentObjects = [];
        if (assignedStudents && assignedStudents.length > 0) {
            const User = (await import('../models/User/user.js')).default;
            const students = await User.find({
                _id: { $in: assignedStudents },
                role: 'student',
                isActive: true
            });

            if (students.length !== assignedStudents.length) {
                return res.status(400).json({
                    success: false,
                    error: 'One or more student IDs are invalid or not active students'
                });
            }
            validatedStudents = students.map(s => s._id);
            studentObjects = students;
        }

        const exam = new Exam({
            title,
            description,
            questions,
            codingQuestions,
            duration,
            totalMarks,
            passingMarks,
            createdBy: req.user._id,
            assignedCandidates: validatedStudents,
            startDate,
            endDate,
            startTime,
            endTime,
            allowRetakes,
            shuffleQuestions
        });

        await exam.save();

        // Send email notifications to assigned students (if requested)
        let emailResults = null;
        if (sendEmailNotification !== false && studentObjects.length > 0) {
            const examDetails = {
                _id: exam._id,  // ADD THIS - Required for generating unique links
                title: exam.title,
                description: exam.description,
                startDate: exam.startDate,
                endDate: exam.endDate,
                startTime: exam.startTime,
                endTime: exam.endTime,
                duration: exam.duration,
                totalMarks: exam.totalMarks,
                passingMarks: exam.passingMarks,
                questionsCount: exam.questions.length + exam.codingQuestions.length
            };

            emailResults = await sendBulkExamAssignmentEmails(studentObjects, examDetails, req.user);
        }

        res.status(201).json({
            success: true,
            message: 'Exam created successfully',
            id: exam._id.toString(),
            exam,
            emailNotifications: emailResults ? {
                sent: emailResults.sent,
                failed: emailResults.failed,
                total: emailResults.total
            } : null
        });
    } catch (error) {
        console.error('Create exam error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Server error during exam creation'
        });
    }
};

// Get all exams (CRITICAL - STUDENT DASHBOARD)
export const getAllExams = async (req, res) => {
    try {
        const { isActive, createdBy } = req.query;
        const filter = {};

        if (isActive !== undefined) {
            filter.isActive = isActive === 'true';
        }

        if (createdBy) {
            filter.createdBy = createdBy;
        }

        // For students, only show exams they are assigned to OR exams with no assigned students
        if (req.user.role === 'student') {
            filter.$or = [
                { assignedCandidates: req.user._id }, // Exams assigned to this student
                { assignedCandidates: { $size: 0 } }  // Exams open to all students
            ];
        }

        const exams = await Exam.find(filter)
            .populate('createdBy', 'name email')
            .select('-assignedCandidates')
            .sort({ createdAt: -1 });

        // Transform to JSON (will use model's toJSON transform automatically)
        const examsData = exams.map(exam => {
            const examObj = exam.toJSON();
            return {
                ...examObj,
                questionsCount: exam.questions.length + exam.codingQuestions.length,
                createdBy: exam.createdBy ? exam.createdBy._id.toString() : null
            };
        });

        res.status(200).json({
            success: true,
            count: examsData.length,
            data: examsData
        });
    } catch (error) {
        console.error('Get all exams error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Server error fetching exams'
        });
    }
};

// Get exam by ID (CRITICAL - TAKE EXAM)
export const getExamById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid exam ID'
            });
        }

        const exam = await Exam.findById(id)
            .populate('createdBy', 'name email')
            .populate('questions')
            .populate('codingQuestions');

        if (!exam) {
            return res.status(404).json({
                success: false,
                error: 'Exam not found'
            });
        }

        if (req.user.role === 'student') {
            const userAgent = req.headers['user-agent'] || '';
            if (!userAgent.includes('SEB')) {
                return res.status(403).json({
                    success: false,
                    error: 'Use Safe Exam Browser'
                });
            }
        }

        // For students, remove correct answers from questions
        let examData = exam.toObject();
        const samplesByQuestion = await getVisibleSamplesByQuestion(exam.codingQuestions);

        if (req.user.role === 'student') {
            examData.questions = await buildStudentExamQuestions(exam);
            examData.codingQuestions = exam.codingQuestions.map(q =>
                serializeCodingQuestionForStudent(q, samplesByQuestion)
            );
        } else {
            // For teachers, include full question details
            examData.questions = examData.questions.map(q => ({
                id: q._id.toString(),
                question: q.question,
                options: q.options,
                answer: q.answer,
                explanation: q.explanation,
                difficulty: q.difficulty,
                category: q.category
            }));
            examData.codingQuestions = examData.codingQuestions.map(q => ({
                ...q,
                id: q._id.toString(),
                type: 'coding',
                visibleTestCases: samplesByQuestion[q._id.toString()] || []
            }));
        }

        res.status(200).json({
            success: true,
            exam: {
                id: examData._id.toString(),
                title: examData.title,
                description: examData.description,
                duration: examData.duration,
                totalMarks: examData.totalMarks,
                passingMarks: examData.passingMarks,
                isActive: examData.isActive,
                startDate: examData.startDate,
                endDate: examData.endDate,
                startTime: examData.startTime,
                endTime: examData.endTime,
                allowRetakes: examData.allowRetakes,
                shuffleQuestions: examData.shuffleQuestions,
                assignedCandidates: examData.assignedCandidates,
                questions: [
                    ...(req.user.role === 'student'
                        ? examData.questions
                        : [
                            ...examData.questions.map(question => ({ ...question, type: question.type || 'mcq' })),
                            ...examData.codingQuestions
                        ])
                ],
                codingQuestions: examData.codingQuestions
            }
        });
    } catch (error) {
        console.error('Get exam by ID error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Server error fetching exam'
        });
    }
};

// Get exams by teacher ID
export const getExamsByTeacher = async (req, res) => {
    try {
        const { teacherId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(teacherId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid teacher ID'
            });
        }

        const exams = await Exam.find({ createdBy: teacherId })
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: exams.length,
            exams
        });
    } catch (error) {
        console.error('Get exams by teacher error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Server error fetching teacher exams'
        });
    }
};

// Update exam
export const updateExam = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid exam ID'
            });
        }

        const exam = await Exam.findById(id);

        if (!exam) {
            return res.status(404).json({
                success: false,
                error: 'Exam not found'
            });
        }

        // Check if user owns the exam
        if (exam.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                error: 'Can only edit your own exams'
            });
        }

        const attemptExists = await ExamAttempt.exists({ examId: id });
        const allowedFields = [
            'title',
            'description',
            'questions',
            'codingQuestions',
            'duration',
            'totalMarks',
            'passingMarks',
            'startDate',
            'endDate',
            'startTime',
            'endTime',
            'allowRetakes',
            'shuffleQuestions',
            'isActive',
            'assignedCandidates',
            'assignedStudents'
        ];
        const safeFieldsWithAttempts = [
            'title',
            'description',
            'duration',
            'startDate',
            'endDate',
            'startTime',
            'endTime',
            'allowRetakes',
            'shuffleQuestions',
            'isActive',
            'assignedCandidates',
            'assignedStudents'
        ];

        const updateData = {};
        const idsMatch = (currentValues = [], nextValues = []) => {
            if (!Array.isArray(nextValues)) return false;
            const currentIds = currentValues.map(value => value.toString()).sort();
            const nextIds = nextValues.map(value => value.toString()).sort();
            return currentIds.length === nextIds.length && currentIds.every((value, index) => value === nextIds[index]);
        };

        for (const field of allowedFields) {
            if (Object.prototype.hasOwnProperty.call(req.body, field)) {
                if (attemptExists && !safeFieldsWithAttempts.includes(field)) {
                    const isUnchangedProtectedField =
                        (field === 'questions' && idsMatch(exam.questions, req.body.questions)) ||
                        (field === 'codingQuestions' && idsMatch(exam.codingQuestions, req.body.codingQuestions)) ||
                        (field === 'totalMarks' && Number(req.body.totalMarks) === Number(exam.totalMarks)) ||
                        (field === 'passingMarks' && Number(req.body.passingMarks) === Number(exam.passingMarks));

                    if (isUnchangedProtectedField) {
                        continue;
                    }

                    return res.status(409).json({
                        success: false,
                        error: 'This exam has attempts. You can edit title, description, duration, schedule, status, retake/shuffle settings, and assignments only.'
                    });
                }
                updateData[field === 'assignedStudents' ? 'assignedCandidates' : field] = req.body[field];
            }
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No valid exam fields provided'
            });
        }

        if (typeof updateData.title === 'string' && updateData.title.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'Exam title is required'
            });
        }

        if (updateData.duration !== undefined && Number(updateData.duration) < 1) {
            return res.status(400).json({
                success: false,
                error: 'Duration must be at least 1 minute'
            });
        }

        if (!attemptExists) {
            if (updateData.totalMarks !== undefined && Number(updateData.totalMarks) < 1) {
                return res.status(400).json({
                    success: false,
                    error: 'Total marks must be at least 1'
                });
            }

            if (updateData.passingMarks !== undefined && Number(updateData.passingMarks) < 1) {
                return res.status(400).json({
                    success: false,
                    error: 'Passing marks must be at least 1'
                });
            }

            const nextTotalMarks = updateData.totalMarks ?? exam.totalMarks;
            const nextPassingMarks = updateData.passingMarks ?? exam.passingMarks;
            if (Number(nextPassingMarks) > Number(nextTotalMarks)) {
                return res.status(400).json({
                    success: false,
                    error: 'Passing marks cannot be greater than total marks'
                });
            }

            if (updateData.questions) {
                if (!Array.isArray(updateData.questions)) {
                    return res.status(400).json({
                        success: false,
                        error: 'Questions must be an array'
                    });
                }

                const validQuestions = await Question.find({ _id: { $in: updateData.questions }, isActive: true });
                if (validQuestions.length !== updateData.questions.length) {
                    return res.status(400).json({
                        success: false,
                        error: 'One or more questions are invalid or inactive'
                    });
                }
            }

            if (updateData.codingQuestions) {
                if (!Array.isArray(updateData.codingQuestions)) {
                    return res.status(400).json({ success: false, error: 'Coding questions must be an array' });
                }
                if (new Set(updateData.codingQuestions.map(String)).size !== updateData.codingQuestions.length) {
                    return res.status(400).json({ success: false, error: 'Duplicate coding questions are not allowed' });
                }
                const validCodingQuestions = await CodingQuestion.find({
                    _id: { $in: updateData.codingQuestions },
                    isActive: true
                });
                if (validCodingQuestions.length !== updateData.codingQuestions.length) {
                    return res.status(400).json({ success: false, error: 'One or more coding questions are invalid or inactive' });
                }
            }

            const nextQuestions = updateData.questions ?? exam.questions;
            const nextCodingQuestions = updateData.codingQuestions ?? exam.codingQuestions;
            if (nextQuestions.length === 0 && nextCodingQuestions.length === 0) {
                return res.status(400).json({ success: false, error: 'Please select at least one question' });
            }
        }

        // Update exam
        const updatedExam = await Exam.findByIdAndUpdate(
            id,
            { ...updateData, updatedAt: Date.now() },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Exam updated successfully',
            exam: updatedExam
        });
    } catch (error) {
        console.error('Update exam error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Server error updating exam'
        });
    }
};

// Delete exam
export const deleteExam = async (req, res) => {
    try {
        const { id } = req.params;
        const forceDelete = req.query.force === 'true' || req.body?.force === true;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid exam ID'
            });
        }

        const exam = await Exam.findById(id);

        if (!exam) {
            return res.status(404).json({
                success: false,
                error: 'Exam not found'
            });
        }

        // Check if user owns the exam
        if (exam.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                error: 'Can only delete your own exams'
            });
        }

        const attemptsCount = await ExamAttempt.countDocuments({ examId: id });
        if (attemptsCount > 0 && !forceDelete) {
            return res.status(409).json({
                success: false,
                code: 'EXAM_HAS_ATTEMPTS',
                error: 'This exam has existing attempts. Confirm force delete to remove all attempts and delete the exam.',
                attemptsCount,
                canForceDelete: true
            });
        }

        if (attemptsCount > 0) {
            await ExamAttempt.deleteMany({ examId: id });
            await User.updateMany(
                { 'examAttempts.examId': exam._id },
                { $pull: { examAttempts: { examId: exam._id } } }
            );
        }

        await Exam.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: attemptsCount > 0
                ? 'Exam and related attempts deleted successfully'
                : 'Exam deleted successfully'
        });
    } catch (error) {
        console.error('Delete exam error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Server error deleting exam'
        });
    }
};

// Toggle exam status
export const toggleExamStatus = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid exam ID'
            });
        }

        const exam = await Exam.findById(id);

        if (!exam) {
            return res.status(404).json({
                success: false,
                error: 'Exam not found'
            });
        }

        // Check if user owns the exam
        if (exam.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                error: 'Can only modify your own exams'
            });
        }

        exam.isActive = !exam.isActive;
        exam.updatedAt = Date.now();
        await exam.save();

        res.status(200).json({
            success: true,
            message: 'Exam status updated',
            isActive: exam.isActive
        });
    } catch (error) {
        console.error('Toggle exam status error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Server error toggling exam status'
        });
    }
};

// Assign students to exam (NEW - TEACHER ONLY)
export const assignStudentsToExam = async (req, res) => {
    try {
        const { examId } = req.params;
        const { studentIds, sendEmailNotification } = req.body;

        if (!mongoose.Types.ObjectId.isValid(examId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid exam ID'
            });
        }

        if (!studentIds || !Array.isArray(studentIds)) {
            return res.status(400).json({
                success: false,
                error: 'Student IDs array is required'
            });
        }

        const exam = await Exam.findById(examId);

        if (!exam) {
            return res.status(404).json({
                success: false,
                error: 'Exam not found'
            });
        }

        // Check if user owns the exam
        if (exam.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                error: 'Can only modify your own exams'
            });
        }

        // Validate all student IDs
        const User = (await import('../models/User/user.js')).default;
        const students = await User.find({
            _id: { $in: studentIds },
            role: 'student',
            isActive: true
        });

        if (students.length !== studentIds.length) {
            return res.status(400).json({
                success: false,
                error: 'One or more student IDs are invalid or not active students'
            });
        }

        console.log('=== ASSIGNING STUDENTS DEBUG ===');
        console.log('Exam ID:', examId);
        console.log('Student IDs to assign:', studentIds);
        console.log('Student IDs types:', studentIds.map(id => typeof id));
        console.log('Valid students found:', students.map(s => ({ id: s._id.toString(), email: s.email })));

        // Update assigned students
        exam.assignedCandidates = studentIds;
        exam.updatedAt = Date.now();
        await exam.save();

        console.log('After save - Assigned candidates:', exam.assignedCandidates.map(c => c.toString()));
        console.log('=== END ASSIGN DEBUG ===');

        // Send email notifications to newly assigned students (if requested)
        let emailResults = null;
        if (sendEmailNotification !== false && students.length > 0) {
            const examDetails = {
                _id: exam._id,
                title: exam.title,
                description: exam.description,
                startDate: exam.startDate,
                endDate: exam.endDate,
                startTime: exam.startTime,
                endTime: exam.endTime,
                duration: exam.duration,
                totalMarks: exam.totalMarks,
                passingMarks: exam.passingMarks,
                questionsCount: exam.questions.length + exam.codingQuestions.length
            };

            emailResults = await sendBulkExamAssignmentEmails(students, examDetails, req.user);
        }

        res.status(200).json({
            message: 'Students assigned successfully',
            assignedCount: studentIds.length,
            emailsSent: emailResults ? emailResults.sent > 0 : false
        });
    } catch (error) {
        console.error('Assign students error:', error);
        res.status(500).json({
            error: error.message || 'Server error assigning students'
        });
    }
};

// Get assigned students for an exam (NEW - TEACHER ONLY)
export const getAssignedStudents = async (req, res) => {
    try {
        const { examId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(examId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid exam ID'
            });
        }

        const exam = await Exam.findById(examId)
            .populate('assignedCandidates', 'name email')
            .populate('createdBy', 'name email');

        if (!exam) {
            return res.status(404).json({
                success: false,
                error: 'Exam not found'
            });
        }

        // Check if user owns the exam
        if (exam.createdBy._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                error: 'Can only view students from your own exams'
            });
        }

        res.status(200).json({
            students: exam.assignedCandidates.map(s => ({
                _id: s._id.toString(),
                name: s.name,
                email: s.email
            }))
        });
    } catch (error) {
        console.error('Get assigned students error:', error);
        res.status(500).json({
            error: error.message || 'Server error fetching assigned students'
        });
    }
};

// Get all students (NEW - TEACHER ONLY - for assigning to exams)
export const getAllStudents = async (req, res) => {
    try {
        const User = (await import('../models/User/user.js')).default;
        const students = await User.find({ role: 'student', isActive: true })
            .select('name email')
            .sort({ name: 1 });

        res.status(200).json({
            success: true,
            count: students.length,
            students: students.map(s => ({
                id: s._id.toString(),
                name: s.name,
                email: s.email
            }))
        });
    } catch (error) {
        console.error('Get all students error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Server error fetching students'
        });
    }
};
