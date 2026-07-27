import mongoose from 'mongoose';

const ExamSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    // Teacher-assigned marks per question: { questionId: marks }
    questionMarks: { type: Map, of: Number, default: new Map() },
    codingQuestions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CodingQuestion' }],
    descriptiveQuestions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DescriptiveQuestion' }],
    // Optional per-MCQ-question marks chosen by the teacher while creating/editing the exam.
    // Keyed by Question ID (string) -> marks (Number). When a question has no entry here,
    // its marks fall back to an even split of the remaining MCQ marks pool.
    questionMarks: {
        type: Map,
        of: Number,
        default: {}
    },
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
    
    // Security Policy
    securityPolicy: {
        requireFullscreen: { type: Boolean, default: true },
        fullscreenExitLimit: { type: Number, default: 2 },
        
        tabSwitchLimit: { type: Number, default: 3 },
        windowBlurLimit: { type: Number, default: 3 },
        
        copyPasteLimit: { type: Number, default: 2 },
        rightClickLimit: { type: Number, default: 2 },
        devToolsLimit: { type: Number, default: 1 },
        
        networkDisconnectLimit: { type: Number, default: 5 },
        idleLimitSeconds: { type: Number, default: 300 },
        
        cameraRequired: { type: Boolean, default: false },
        microphoneRequired: { type: Boolean, default: false },
        screenSharingRequired: { type: Boolean, default: false },
        
        overallViolationLimit: { type: Number, default: 8 },
        action: { type: String, enum: ['WARNING', 'AUTO_SUBMIT', 'TERMINATE'], default: 'TERMINATE' }
    },
    
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
        if (ret.questionMarks instanceof Map) {
            const obj = {};
            ret.questionMarks.forEach((value, key) => { obj[key] = value; });
            ret.questionMarks = obj;
        }
        delete ret.__v;
        return ret;
    }
});

export default mongoose.model('Exam', ExamSchema);