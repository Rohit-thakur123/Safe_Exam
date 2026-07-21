import mongoose from "mongoose";

const descriptiveQuestionSchema = new mongoose.Schema(
  {
    // Question heading shown to students
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },

    // Full question body (supports plain text; frontend may render as markdown)
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },

    // Answering instructions shown below the question
    instructions: {
      type: String,
      trim: true,
      default: "",
    },

    // Maximum marks for this question
    maxMarks: {
      type: Number,
      required: [true, "Maximum marks are required"],
      min: [1, "Maximum marks must be at least 1"],
    },

    // Optional word limit (0 = no limit)
    wordLimit: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Optional minimum words required
    minWords: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Model / reference answer — hidden from students, visible to teacher during grading
    referenceAnswer: {
      type: String,
      trim: true,
      default: "",
    },

    // Grading rubric — optional breakdown of marks criteria
    rubric: {
      type: String,
      trim: true,
      default: "",
    },

    // Private notes visible only to the teacher (not shown anywhere to students)
    teacherNotes: {
      type: String,
      trim: true,
      default: "",
    },

    tags: {
      type: [String],
      default: [],
    },

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },

    category: {
      type: String,
      trim: true,
      default: "",
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
descriptiveQuestionSchema.index({ createdBy: 1 });
descriptiveQuestionSchema.index({ isActive: 1 });
descriptiveQuestionSchema.index({ difficulty: 1 });
descriptiveQuestionSchema.index({ categoryId: 1 });
descriptiveQuestionSchema.index({ title: "text", description: "text" });

// Consistent toJSON transform
descriptiveQuestionSchema.set("toJSON", {
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    if (ret.createdBy && typeof ret.createdBy !== "object") {
      ret.createdBy = ret.createdBy.toString();
    }
    if (ret.categoryId && typeof ret.categoryId !== "object") {
      ret.categoryId = ret.categoryId.toString();
    }
    if (ret.createdAt) ret.createdAt = ret.createdAt.toISOString();
    if (ret.updatedAt) ret.updatedAt = ret.updatedAt.toISOString();
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("DescriptiveQuestion", descriptiveQuestionSchema);
