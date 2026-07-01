import mongoose from 'mongoose';

const codingQuestionSchema = new mongoose.Schema({
    title: { type: String, required: [true, 'Title is required'], trim: true },
    description: { type: String, required: [true, 'Description is required'], trim: true },
    constraints: { type: String, required: [true, 'Constraints are required'], trim: true },
    inputFormat: { type: String, required: [true, 'Input format is required'], trim: true },
    outputFormat: { type: String, required: [true, 'Output format is required'], trim: true },
    explanation: { type: String, required: [true, 'Explanation is required'], trim: true },
    difficulty: {
        type: String,
        required: [true, 'Difficulty is required'],
        enum: ['Easy', 'Medium', 'Hard'],
        default: 'Medium'
    },
    marks: { type: Number, required: [true, 'Marks are required'], min: [1, 'Marks must be at least 1'] },
    timeLimit: { type: Number, required: [true, 'Time limit is required'], min: [1, 'Time limit must be at least 1'] },
    memoryLimit: { type: Number, required: [true, 'Memory limit is required'], min: [1, 'Memory limit must be at least 1'] },
    starterCode: { type: String, required: [true, 'Starter code is required'] },
    supportedLanguages: {
        type: [String],
        required: [true, 'Supported languages are required'],
        enum: {
            values: ['Python', 'Java', 'JavaScript', 'C', 'C++'],
            message: '{VALUE} is not a supported language'
        },
        validate: {
            validator: (value) => Array.isArray(value) && value.length > 0,
            message: 'At least one supported language is required'
        }
    },
    isActive: { type: Boolean, default: true },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

codingQuestionSchema.index({ createdBy: 1 });
codingQuestionSchema.index({ difficulty: 1 });
codingQuestionSchema.index({ isActive: 1 });
codingQuestionSchema.index({ title: 'text', description: 'text', explanation: 'text' });

codingQuestionSchema.set('toJSON', {
    transform: function(doc, ret) {
        ret.id = ret._id.toString();
        if (ret.createdBy && !ret.createdBy.name) ret.createdBy = ret.createdBy.toString();
        if (ret.createdAt) ret.createdAt = ret.createdAt.toISOString();
        if (ret.updatedAt) ret.updatedAt = ret.updatedAt.toISOString();
        delete ret.__v;
        return ret;
    }
});

export default mongoose.model('CodingQuestion', codingQuestionSchema);
