import mongoose from 'mongoose';

const exampleSchema = new mongoose.Schema({
    input: { type: String, required: true, trim: true },
    output: { type: String, required: true, trim: true },
    explanation: { type: String, trim: true, default: '' }
}, { _id: false });

const codingQuestionSchema = new mongoose.Schema({
    title: { type: String, required: [true, 'Title is required'], trim: true },
    description: { type: String, required: [true, 'Description is required'], trim: true },
    constraints: { type: String, trim: true, default: '' },
    inputFormat: { type: String, trim: true, default: '' },
    outputFormat: { type: String, trim: true, default: '' },
    explanation: { type: String, trim: true, default: '' },
    examples: { type: [exampleSchema], default: [] },
    tags: { type: [String], default: [] },
    difficulty: {
        type: String,
        required: [true, 'Difficulty is required'],
        enum: ['Easy', 'Medium', 'Hard'],
        default: 'Medium'
    },
    marks: { type: Number, required: [true, 'Marks are required'], min: [1, 'Marks must be at least 1'] },
    timeLimit: { type: Number, required: [true, 'Time limit is required'], min: [1, 'Time limit must be at least 1'] },
    memoryLimit: { type: Number, required: [true, 'Memory limit is required'], min: [1, 'Memory limit must be at least 1'] },
    // Per-language starter code stored as a Map (key = language, value = starter code string)
    starterCode: { type: Map, of: String, default: {} },
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
    }
}, {
    timestamps: true
});

codingQuestionSchema.index({ createdBy: 1 });
codingQuestionSchema.index({ difficulty: 1 });
codingQuestionSchema.index({ isActive: 1 });
codingQuestionSchema.index({ title: 'text', description: 'text' });

codingQuestionSchema.set('toJSON', {
    transform: function(doc, ret) {
        ret.id = ret._id.toString();
        if (ret.createdBy && !ret.createdBy.name) ret.createdBy = ret.createdBy.toString();
        if (ret.createdAt) ret.createdAt = ret.createdAt.toISOString();
        if (ret.updatedAt) ret.updatedAt = ret.updatedAt.toISOString();
        // Convert Map to plain object for JSON serialization
        if (ret.starterCode instanceof Map) {
            const obj = {};
            ret.starterCode.forEach((v, k) => { obj[k] = v; });
            ret.starterCode = obj;
        }
        delete ret.__v;
        return ret;
    }
});

export default mongoose.model('CodingQuestion', codingQuestionSchema);
