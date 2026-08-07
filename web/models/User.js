import mongoose from "mongoose";

const { Schema } = mongoose;

export const USER_ROLES = ["user", "superadmin"];
export const USER_STATUSES = ["active", "disabled"];

const UserSchema = new Schema(
  {
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
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  }
);

UserSchema.index({ role: 1, createdAt: -1 });

const User = mongoose.models.User || mongoose.model("User", UserSchema);

export default User;
