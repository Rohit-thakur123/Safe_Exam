import mongoose from 'mongoose';

const LogSchema = new mongoose.Schema({
    level: {
        type: String,
        enum: ['info', 'warning', 'error', 'debug'],
        required: true,
        default: 'info'
    },
    message: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    action: {
        type: String
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Create indexes for better query performance
LogSchema.index({ level: 1 });
LogSchema.index({ userId: 1 });
LogSchema.index({ timestamp: -1 });
LogSchema.index({ action: 1 });

// Transform _id to id for consistent API responses
LogSchema.set('toJSON', {
    transform: function(doc, ret) {
        ret.id = ret._id.toString();
        if (ret.userId) ret.userId = ret.userId.toString();
        if (ret.timestamp) ret.timestamp = ret.timestamp.toISOString();
        delete ret.__v;
        return ret;
    }
});

export default mongoose.model('Log', LogSchema);

