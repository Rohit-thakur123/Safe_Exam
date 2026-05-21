import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
    question: { type: String, required: true },
    options: { type: [String], required: true, validate: [arrayLimit, 'Must have exactly 4 options'] },
    answer: { type: String, required: true },
    explanation: { type: String },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium', required: true },
    category: { type: String, required: true },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Validate exactly 4 options
function arrayLimit(val) {
    return val.length === 4;
}

// Create indexes
questionSchema.index({ createdBy: 1 });
questionSchema.index({ category: 1 });
questionSchema.index({ difficulty: 1 });

// Transform _id to id for consistent API responses
questionSchema.set('toJSON', {
    transform: function(doc, ret) {
        ret.id = ret._id.toString();
        // Keep _id for compatibility
        if (ret.createdBy) ret.createdBy = ret.createdBy.toString();
        if (ret.createdAt) ret.createdAt = ret.createdAt.toISOString();
        if (ret.updatedAt) ret.updatedAt = ret.updatedAt.toISOString();
        delete ret.__v;
        return ret;
    }
});

export default mongoose.model('Question', questionSchema);