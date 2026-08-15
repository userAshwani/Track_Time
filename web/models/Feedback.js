import mongoose from "mongoose";

const { Schema } = mongoose;

export const FEEDBACK_TYPES = ["suggestion", "review", "bug", "other"];

const FeedbackSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: FEEDBACK_TYPES,
      default: "suggestion",
      index: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    message: {
      type: String,
      required: [true, "Feedback message is required."],
      trim: true,
      maxlength: [3000, "Feedback cannot exceed 3000 characters."],
    },
    status: {
      type: String,
      enum: ["new", "reviewed", "archived"],
      default: "new",
      index: true,
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  }
);

FeedbackSchema.index({ userId: 1, createdAt: -1 });
FeedbackSchema.index({ createdAt: -1 });

const Feedback =
  mongoose.models.Feedback || mongoose.model("Feedback", FeedbackSchema);

export default Feedback;
