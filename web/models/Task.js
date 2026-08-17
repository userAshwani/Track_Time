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
    startDate: {
      type: Date,
      default: null,
      index: true,
    },
    dueDate: {
      type: Date,
      default: null,
      index: true,
    },
    slotStart: {
      type: String,
      trim: true,
      default: "09:00",
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "slotStart must use HH:mm."],
    },
    slotEnd: {
      type: String,
      trim: true,
      default: "10:00",
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "slotEnd must use HH:mm."],
    },
    weeklyDays: {
      type: [
        {
          type: Number,
          min: 0,
          max: 6,
        },
      ],
      default: () => [0, 1, 2, 3, 4, 5, 6],
      validate: {
        validator(days) {
          return Array.isArray(days) && days.length > 0 && days.every((day) => Number.isInteger(day) && day >= 0 && day <= 6);
        },
        message: "weeklyDays must include at least one weekday from 0 (Sun) to 6 (Sat).",
      },
    },
    scheduleConfirmed: {
      type: Boolean,
      default: false,
      index: true,
    },
    lastReminderAt: {
      type: Date,
      default: null,
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
TaskSchema.index({ userId: 1, startDate: 1, dueDate: 1 });
TaskSchema.index({ isAlarmSet: 1, alarmTime: 1 });
TaskSchema.index({ createdAt: -1 });

TaskSchema.pre("validate", function validateAlarmConfiguration() {
  if (this.isAlarmSet && !this.alarmTime) {
    this.invalidate("alarmTime", "Alarm time is required when an alarm is enabled.");
  }

  if (this.slotStart && this.slotEnd) {
    const [startHours, startMinutes] = String(this.slotStart).split(":").map(Number);
    const [endHours, endMinutes] = String(this.slotEnd).split(":").map(Number);
    const startTotal = startHours * 60 + startMinutes;
    const endTotal = endHours * 60 + endMinutes;
    if (endTotal <= startTotal) {
      this.invalidate("slotEnd", "Time slot end must be after the start time.");
    }
  }

  if (this.startDate && this.dueDate && this.dueDate < this.startDate) {
    this.invalidate("dueDate", "Due date cannot be earlier than start date.");
  }
});

const Task = mongoose.models.Task || mongoose.model("Task", TaskSchema);

export default Task;
