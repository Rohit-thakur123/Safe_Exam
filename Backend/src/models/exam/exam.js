import mongoose from 'mongoose';

const ExamSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    codingQuestions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CodingQuestion' }],
    descriptiveQuestions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DescriptiveQuestion' }],
    duration: { type: Number, required: true }, // in minutes
    totalMarks: { type: Number, required: true },
    passingMarks: { type: Number, required: true },
    
    // Exam Finite State Machine (FSM) Status
    status: {
        type: String,
        enum: ['draft', 'scheduled', 'active', 'completed', 'evaluated', 'results_published'],
        default: 'draft'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Extended Scheduling & Timezone Fields
    startDate: { type: Date },
    startTime: { type: String }, // Format: "HH:MM" (24-hour format)
    endDate: { type: Date },
    endTime: { type: String },   // Format: "HH:MM" (24-hour format)
    timezone: { type: String, default: 'UTC' }, // e.g. "Asia/Kolkata", "UTC", "America/New_York"
    startDateTimeUTC: { type: Date },
    endDateTimeUTC: { type: Date },

    // Entry & Auto-Submit Controls
    allowLateEntry: { type: Boolean, default: false },
    lateEntryWindowMinutes: { type: Number, default: 15 },
    autoSubmit: { type: Boolean, default: true },
    
    // Result Publication Controls
    resultPublishDate: { type: Date },
    resultPublishTime: { type: String },
    resultPublishDateTimeUTC: { type: Date },
    resultsPublished: { type: Boolean, default: false },

    allowRetakes: { type: Boolean, default: false },
    shuffleQuestions: { type: Boolean, default: false },
    assignedCandidates: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// Create indexes
ExamSchema.index({ createdBy: 1 });
ExamSchema.index({ isActive: 1, status: 1 });
ExamSchema.index({ startDateTimeUTC: 1, endDateTimeUTC: 1 });

// Transform _id to id for consistent API responses
ExamSchema.set('toJSON', {
    transform: function(doc, ret) {
        ret.id = ret._id.toString();
        if (ret.createdBy) ret.createdBy = ret.createdBy.toString();
        if (ret.createdAt) ret.createdAt = ret.createdAt.toISOString();
        if (ret.updatedAt) ret.updatedAt = ret.updatedAt.toISOString();
        if (ret.startDate) ret.startDate = ret.startDate.toISOString();
        if (ret.endDate) ret.endDate = ret.endDate.toISOString();
        if (ret.startDateTimeUTC) ret.startDateTimeUTC = ret.startDateTimeUTC.toISOString();
        if (ret.endDateTimeUTC) ret.endDateTimeUTC = ret.endDateTimeUTC.toISOString();
        if (ret.resultPublishDateTimeUTC) ret.resultPublishDateTimeUTC = ret.resultPublishDateTimeUTC.toISOString();
        delete ret.__v;
        return ret;
    }
});

export default mongoose.model('Exam', ExamSchema);
