import mongoose from "mongoose";

const { Schema } = mongoose;

const TimeLogSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    taskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: true,
      index: true,
    },
    startTime: {
      type: Date,
      required: [true, "Start time is required."],
      index: true,
    },
    endTime: {
      type: Date,
      default: null,
    },
    durationMinutes: {
      type: Number,
      required: [true, "Duration is required."],
      min: [1, "Duration must be at least 1 minute."],
      validate: {
        validator: Number.isInteger,
        message: "Duration must be stored as whole minutes.",
      },
    },
    notes: {
      type: String,
      trim: true,
      default: "",
      maxlength: [2000, "Notes cannot exceed 2000 characters."],
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  }
);

TimeLogSchema.index({ userId: 1, startTime: -1 });
TimeLogSchema.index({ taskId: 1, startTime: -1 });

const TimeLog =
  mongoose.models.TimeLog || mongoose.model("TimeLog", TimeLogSchema);

export default TimeLog;
