import mongoose from "mongoose";

const { Schema } = mongoose;

const DailyScheduleSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: [true, "Schedule date is required."],
      match: [/^\d{4}-\d{2}-\d{2}$/, "Schedule date must use YYYY-MM-DD."],
      index: true,
    },
    plannedHours: {
      type: Number,
      min: [0, "Planned hours cannot be negative."],
      max: [24, "Planned hours cannot exceed 24."],
      default: 8,
    },
    actualHours: {
      type: Number,
      min: [0, "Actual hours cannot be negative."],
      default: 0,
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  }
);

DailyScheduleSchema.index({ userId: 1, date: 1 }, { unique: true });

const DailySchedule =
  mongoose.models.DailySchedule ||
  mongoose.model("DailySchedule", DailyScheduleSchema);

export default DailySchedule;
