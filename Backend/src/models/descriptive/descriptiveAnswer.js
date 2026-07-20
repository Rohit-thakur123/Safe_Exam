import mongoose from "mongoose";

const descriptiveAnswerSchema = new mongoose.Schema(
  {
    // Student who wrote the answer
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Exam to which this answer belongs
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
      index: true,
    },

    // Descriptive Question
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DescriptiveQuestion",
      required: true,
    },

    // Student's Answer
    answer: {
      type: String,
      default: "",
      trim: true,
    },

    // Auto calculated word count
    wordCount: {
      type: Number,
      default: 0,
    },

    // Draft or Submitted
    status: {
      type: String,
      enum: ["draft", "submitted", "evaluated"],
      default: "draft",
    },

    // Final Submission Lock
    isSubmitted: {
      type: Boolean,
      default: false,
    },

    // Time of Final Submission
    submittedAt: {
      type: Date,
      default: null,
    },

    // Teacher Evaluation
    marksAwarded: {
      type: Number,
      default: 0,
      min: 0,
    },

    feedback: {
      type: String,
      default: "",
      trim: true,
    },

    evaluatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    evaluatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// One answer per student per question
descriptiveAnswerSchema.index(
  {
    student: 1,
    exam: 1,
    question: 1,
  },
  {
    unique: true,
  }
);

const DescriptiveAnswer = mongoose.model(
  "DescriptiveAnswer",
  descriptiveAnswerSchema
);

export default DescriptiveAnswer;
