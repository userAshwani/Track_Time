import mongoose from "mongoose";

const { Schema } = mongoose;

export const USER_ROLES = ["user", "superadmin"];
export const USER_STATUSES = ["active", "disabled"];

const UserSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      maxlength: [120, "Name cannot exceed 120 characters."],
      default: "",
    },
    username: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
      unique: true,
      sparse: true,
      match: [/^[a-z0-9][a-z0-9_-]{2,19}$/, "Username must be 3-20 characters: lowercase letters, numbers, - or _."],
    },
    publicProfile: {
      type: Boolean,
      default: false,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: "user",
      index: true,
    },
    status: {
      type: String,
      enum: USER_STATUSES,
      default: "active",
      index: true,
    },
    passwordHash: {
      type: String,
      default: "",
      select: false,
    },
    passwordUpdatedAt: {
      type: Date,
      default: null,
    },
    authMethods: {
      type: [String],
      enum: ["otp", "password", "google"],
      default: ["otp"],
    },
    loginCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastLoginAt: {
      type: Date,
      default: null,
      index: true,
    },
    lastIp: {
      type: String,
      default: "",
      trim: true,
      select: false,
    },
    lastUserAgent: {
      type: String,
      default: "",
      trim: true,
      select: false,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    profilePicture: {
      type: String,
      trim: true,
      default: "",
    },
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    timezone: {
      type: String,
      trim: true,
      default: "UTC",
    },
    theme: {
      type: String,
      enum: ["light", "dark", "auto"],
      default: "light",
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  }
);

UserSchema.index({ role: 1, createdAt: -1 });

const User = mongoose.models.User || mongoose.model("User", UserSchema);

export default User;
