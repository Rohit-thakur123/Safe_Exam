import mongoose from 'mongoose';

const ExamSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    duration: { type: Number, required: true }, // in minutes
    totalMarks: { type: Number, required: true },
    passingMarks: { type: Number, required: true },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    startDate: { type: Date },
    endDate: { type: Date },
    startTime: { type: String }, // Format: "HH:MM" (24-hour format)
    endTime: { type: String },   // Format: "HH:MM" (24-hour format)
    allowRetakes: { type: Boolean, default: false },
    shuffleQuestions: { type: Boolean, default: false },
    assignedCandidates: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// Create indexes
ExamSchema.index({ createdBy: 1 });
ExamSchema.index({ isActive: 1 });
ExamSchema.index({ startDate: 1, endDate: 1 });

// Transform _id to id for consistent API responses
ExamSchema.set('toJSON', {
    transform: function(doc, ret) {
        ret.id = ret._id.toString();
        // Keep _id for compatibility
        if (ret.createdBy) ret.createdBy = ret.createdBy.toString();
        if (ret.createdAt) ret.createdAt = ret.createdAt.toISOString();
        if (ret.updatedAt) ret.updatedAt = ret.updatedAt.toISOString();
        if (ret.startDate) ret.startDate = ret.startDate.toISOString();
        if (ret.endDate) ret.endDate = ret.endDate.toISOString();
        delete ret.__v;
        return ret;
    }
});

export default mongoose.model('Exam', ExamSchema);