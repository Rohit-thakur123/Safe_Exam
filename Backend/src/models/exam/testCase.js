import mongoose from 'mongoose';

const testCaseSchema = new mongoose.Schema({
    codingQuestionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CodingQuestion',
        required: [true, 'Coding question ID is required']
    },
    input: { type: String, required: [true, 'Input is required'], trim: true },
    expectedOutput: { type: String, required: [true, 'Expected output is required'], trim: true },
    isHidden: { type: Boolean, default: false },
    weight: { type: Number, required: true, default: 1, min: [0, 'Weight cannot be negative'] },
    order: { type: Number, required: true, min: [0, 'Order cannot be negative'], default: 0 },
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

testCaseSchema.index({ codingQuestionId: 1, order: 1 });

testCaseSchema.set('toJSON', {
    transform: function(doc, ret) {
        ret.id = ret._id.toString();
        if (ret.codingQuestionId) ret.codingQuestionId = ret.codingQuestionId.toString();
        if (ret.createdBy && !ret.createdBy.name) ret.createdBy = ret.createdBy.toString();
        if (ret.createdAt) ret.createdAt = ret.createdAt.toISOString();
        if (ret.updatedAt) ret.updatedAt = ret.updatedAt.toISOString();
        delete ret.__v;
        return ret;
    }
});

export default mongoose.model('TestCase', testCaseSchema);
