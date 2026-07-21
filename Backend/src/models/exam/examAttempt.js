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
    mcqScore: {
        type: Number,
        default: 0
    },
    codingScore: {
        type: Number,
        default: 0
    },
    subjectiveScore: {
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
    expectedEndTime: {
        type: Date // Authoritative calculated end time for this candidate
    },
    endTime: {
        type: Date // Actual submission time
    },
    timeSpent: {
        type: Number,
        default: 0
    },
    // Student Attempt Finite State Machine (FSM) Status
    status: {
        type: String,
        enum: ['not_started', 'started', 'in_progress', 'submitted', 'completed', 'evaluated', 'abandoned', 'locked'],
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
    violations: [{
        type: {
            type: String,
            enum: ['tab_switch', 'window_blur', 'copy_attempt', 'paste_attempt', 'devtools_open', 'refresh_attempt', 'keyboard_shortcut'],
            required: true
        },
        timestamp: { type: Date, default: Date.now },
        metadata: { type: mongoose.Schema.Types.Mixed }
    }],
    violationSummary: {
        tabSwitches: { type: Number, default: 0 },
        windowBlurs: { type: Number, default: 0 },
        copyAttempts: { type: Number, default: 0 },
        pasteAttempts: { type: Number, default: 0 },
        devToolsAttempts: { type: Number, default: 0 },
        totalViolations: { type: Number, default: 0 }
    },
    subjectiveStatus: {
        type: String,
        enum: ['not_applicable', 'pending_evaluation', 'evaluated'],
        default: 'not_applicable'
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
ExamAttemptSchema.index({ examId: 1, studentId: 1 }, { unique: true });

// Transform _id to id for consistent API responses
ExamAttemptSchema.set('toJSON', {
    transform: function(doc, ret) {
        ret.id = ret._id.toString();
        if (ret.examId) ret.examId = ret.examId.toString();
        if (ret.studentId) ret.studentId = ret.studentId.toString();
        if (ret.startTime) ret.startTime = ret.startTime.toISOString();
        if (ret.expectedEndTime) ret.expectedEndTime = ret.expectedEndTime.toISOString();
        if (ret.endTime) ret.endTime = ret.endTime.toISOString();
        if (ret.createdAt) ret.createdAt = ret.createdAt.toISOString();
        if (ret.answers instanceof Map) {
            ret.answers = Object.fromEntries(ret.answers);
        }
        delete ret.__v;
        return ret;
    }
});

export default mongoose.model('ExamAttempt', ExamAttemptSchema);
