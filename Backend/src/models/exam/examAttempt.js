import mongoose from 'mongoose';

const ExamAttemptSchema = new mongoose.Schema({
    examId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam',
        required: [true, 'Exam ID is required']
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Student ID is required']
    },
    answers: {
        type: Map,
        of: String,
        default: new Map()
    },
    score: {
        type: Number,
        default: 0
    },
    totalMarks: {
        type: Number,
        required: true
    },
    percentage: {
        type: Number,
        default: 0
    },
    passed: {
        type: Boolean,
        default: false
    },
    startTime: {
        type: Date,
        required: true,
        default: Date.now
    },
    endTime: {
        type: Date
    },
    timeSpent: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['in_progress', 'completed', 'abandoned'],
        default: 'in_progress'
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    },
    tabSwitches: {
        type: Number,
        default: 0
    },
    warnings: [{
        type: String
    }],
    lastActivity: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create indexes for better query performance
ExamAttemptSchema.index({ examId: 1 });
ExamAttemptSchema.index({ studentId: 1 });
ExamAttemptSchema.index({ status: 1 });
ExamAttemptSchema.index({ examId: 1, studentId: 1 });

// Transform _id to id for consistent API responses
ExamAttemptSchema.set('toJSON', {
    transform: function(doc, ret) {
        ret.id = ret._id.toString();
        // Keep _id for compatibility
        if (ret.examId) ret.examId = ret.examId.toString();
        if (ret.studentId) ret.studentId = ret.studentId.toString();
        if (ret.startTime) ret.startTime = ret.startTime.toISOString();
        if (ret.endTime) ret.endTime = ret.endTime.toISOString();
        if (ret.createdAt) ret.createdAt = ret.createdAt.toISOString();
        // Convert Map to plain object for JSON serialization
        if (ret.answers instanceof Map) {
            ret.answers = Object.fromEntries(ret.answers);
        }
        delete ret.__v;
        return ret;
    }
});

export default mongoose.model('ExamAttempt', ExamAttemptSchema);
