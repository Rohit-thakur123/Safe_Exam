import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    role: {
        type: String,
        required: [true, 'Role is required'],
        enum: ['teacher', 'student'],
        default: 'student'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    // Exam attempts tracking for students
    examAttempts: [{
        examId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Exam',
            required: true
        },
        attemptId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ExamAttempt',
            required: true
        },
        status: {
            type: String,
            enum: ['in_progress', 'completed', 'abandoned', 'expired'],
            default: 'in_progress'
        },
        score: {
            type: Number,
            default: 0
        },
        percentage: {
            type: Number,
            default: 0
        },
        passed: {
            type: Boolean,
            default: false
        },
        totalMarks: {
            type: Number,
            default: 0
        },
        startedAt: {
            type: Date,
            default: Date.now
        },
        completedAt: {
            type: Date
        }
    }]
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Transform _id to id for consistent API responses
UserSchema.set('toJSON', {
    transform: function(doc, ret) {
        ret.id = ret._id.toString();
        // Keep _id for compatibility
        if (ret.examAttempts && Array.isArray(ret.examAttempts)) {
            ret.examAttempts = ret.examAttempts.map(attempt => ({
                ...attempt,
                examId: attempt.examId.toString(),
                attemptId: attempt.attemptId.toString()
            }));
        }
        if (ret.createdAt) ret.createdAt = ret.createdAt.toISOString();
        if (ret.updatedAt) ret.updatedAt = ret.updatedAt.toISOString();
        delete ret.__v;
        delete ret.password; // Remove password from responses
        return ret;
    }
});

export default mongoose.model('User', UserSchema);
