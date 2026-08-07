import mongoose from "mongoose";

const { Schema } = mongoose;

const OtpTokenSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
      select: false,
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    consumedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

OtpTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
OtpTokenSchema.index({ email: 1, createdAt: -1 });

const OtpToken =
  mongoose.models.OtpToken || mongoose.model("OtpToken", OtpTokenSchema);

export default OtpToken;
