import mongoose from "mongoose";

const { Schema } = mongoose;

export const TASK_STATUSES = ["pending", "in_progress", "completed", "cancelled", "archived"];
export const TIME_HORIZONS = ["1_Day", "1_Week", "1_Month", "1_Year"];
export const TASK_PRIORITIES = ["low", "medium", "high"];

const TaskSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Task title is required."],
      trim: true,
      minlength: [2, "Task title must be at least 2 characters."],
      maxlength: [160, "Task title cannot exceed 160 characters."],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Task description cannot exceed 2000 characters."],
      default: "",
    },
    status: {
      type: String,
      enum: TASK_STATUSES,
      default: "pending",
      index: true,
    },
    priority: {
      type: String,
      enum: TASK_PRIORITIES,
      default: "medium",
      index: true,
    },
    timeHorizon: {
      type: String,
      enum: TIME_HORIZONS,
      default: "1_Day",
      index: true,
    },
    timeAllocated: {
      type: Number,
      default: 60,
      min: [1, "Allocated time must be at least 1 minute."],
      max: [525600, "Allocated time cannot exceed 1 year in minutes."],
      validate: {
        validator: Number.isInteger,
        message: "Allocated time must be stored as whole minutes.",
      },
    },
    timeSpent: {
      type: Number,
      min: [0, "Time spent cannot be negative."],
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: "Time spent must be stored as whole minutes.",
      },
    },
    isAlarmSet: {
      type: Boolean,
      default: false,
      index: true,
    },
    alarmTime: {
      type: Date,
      default: null,
      index: true,
    },
    pushToken: {
      type: String,
      trim: true,
      default: "",
      select: false,
    },
    dueDate: {
      type: Date,
      default: null,
      index: true,
    },
    estimatedHours: {
      type: Number,
      min: [0, "Estimated hours cannot be negative."],
      default: null,
    },
    scheduleOrder: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  }
);

TaskSchema.index({ timeHorizon: 1, status: 1, updatedAt: -1 });
TaskSchema.index({ userId: 1, timeHorizon: 1, status: 1, updatedAt: -1 });
TaskSchema.index({ userId: 1, dueDate: 1, scheduleOrder: 1 });
TaskSchema.index({ isAlarmSet: 1, alarmTime: 1 });
TaskSchema.index({ createdAt: -1 });

TaskSchema.pre("validate", function validateAlarmConfiguration(next) {
  if (this.isAlarmSet && !this.alarmTime) {
    this.invalidate("alarmTime", "Alarm time is required when an alarm is enabled.");
  }

  next();
});

const Task = mongoose.models.Task || mongoose.model("Task", TaskSchema);

export default Task;
