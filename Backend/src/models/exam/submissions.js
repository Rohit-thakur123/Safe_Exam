import mongoose from 'mongoose';

const SubmissionSchema = new mongoose.Schema({
    examAttemptId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ExamAttempt',
        required: [true, 'Exam Attempt ID is required']
    },
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
    codingQuestionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CodingQuestion'
    },
    language: {
        type: String,
        enum: ['Python', 'Java', 'JavaScript', 'C', 'C++']
    },
    sourceCode: { type: String },
    executionTime: { type: Number, default: 0 },
    memoryUsage: { type: Number, default: 0 },
    passedTestCases: { type: Number, default: 0 },
    failedTestCases: { type: Number, default: 0 },
    answers: {
        type: Map,
        of: String,
        default: new Map()
    },
    submittedAt: {
        type: Date,
        default: Date.now
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
    feedback: {
        type: String
    }
});

// Create indexes
SubmissionSchema.index({ examAttemptId: 1 });
SubmissionSchema.index({ examId: 1 });
SubmissionSchema.index({ studentId: 1 });
SubmissionSchema.index({ examId: 1, codingQuestionId: 1 });

// Transform _id to id for consistent API responses
SubmissionSchema.set('toJSON', {
    transform: function(doc, ret) {
        ret.id = ret._id.toString();
        if (ret.examAttemptId) ret.examAttemptId = ret.examAttemptId.toString();
        if (ret.examId) ret.examId = ret.examId.toString();
        if (ret.studentId) ret.studentId = ret.studentId.toString();
        if (ret.codingQuestionId) ret.codingQuestionId = ret.codingQuestionId.toString();
        if (ret.submittedAt) ret.submittedAt = ret.submittedAt.toISOString();
        // Convert Map to plain object for JSON serialization
        if (ret.answers instanceof Map) {
            ret.answers = Object.fromEntries(ret.answers);
        }
        delete ret.__v;
        return ret;
    }
});

export default mongoose.model('Submission', SubmissionSchema);

