import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const CandidateSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    appliedExams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Exam' }],
    results: [{
        exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' },
        score: { type: Number },
        passed: { type: Boolean },
        takenAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Hash password before saving
CandidateSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to compare password
CandidateSchema.methods.comparePassword = function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('Candidate', CandidateSchema);