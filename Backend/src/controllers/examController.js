import Exam from '../models/exam/exam.js';
import Question from '../models/exam/question.js';
import ExamAttempt from '../models/exam/examAttempt.js';
import mongoose from 'mongoose';
import { sendBulkExamAssignmentEmails } from '../services/examEmailService.js';

// Create new exam
export const createExam = async (req, res) => {
    try {
        const { title, description, questions, duration, totalMarks, passingMarks, startDate, endDate, startTime, endTime, allowRetakes, shuffleQuestions, assignedStudents, sendEmailNotification } = req.body;

        // Validate required fields
        if (!title || !questions || !duration || !totalMarks || !passingMarks) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        // Validate questions exist
        const validQuestions = await Question.find({ _id: { $in: questions }, isActive: true });
        if (validQuestions.length !== questions.length) {
            return res.status(400).json({
                success: false,
                error: 'One or more questions are invalid or inactive'
            });
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
                questionsCount: exam.questions.length
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
                questionsCount: exam.questions.length,
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
            .populate('questions');

        if (!exam) {
            return res.status(404).json({
                success: false,
                error: 'Exam not found'
            });
        }

        // For students, remove correct answers from questions
        let examData = exam.toObject();

        if (req.user.role === 'student') {
            examData.questions = examData.questions.map(q => ({
                id: q._id.toString(),
                question: q.question,
                options: q.options,
                difficulty: q.difficulty,
                category: q.category
                // NO answer field for students
            }));
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
                questions: examData.questions
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

        // Check if exam has attempts
        const attempts = await ExamAttempt.findOne({ examId: id });
        if (attempts) {
            return res.status(409).json({
                success: false,
                error: 'Cannot edit exam with existing attempts'
            });
        }

        // Update exam
        const updatedExam = await Exam.findByIdAndUpdate(
            id,
            { ...req.body, updatedAt: Date.now() },
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

        // Check if exam has attempts
        const attempts = await ExamAttempt.findOne({ examId: id });
        if (attempts) {
            return res.status(409).json({
                success: false,
                error: 'Cannot delete exam with existing attempts'
            });
        }

        await Exam.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'Exam deleted successfully'
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
                questionsCount: exam.questions.length
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
