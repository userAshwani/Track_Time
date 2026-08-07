import mongoose from "mongoose";

const { Schema } = mongoose;

const SessionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
      select: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    revokedAt: {
      type: Date,
      default: null,
      index: true,
    },
    ip: {
      type: String,
      default: "",
      trim: true,
      select: false,
    },
    userAgent: {
      type: String,
      default: "",
      trim: true,
      select: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
SessionSchema.index({ userId: 1, createdAt: -1 });

const Session =
  mongoose.models.Session || mongoose.model("Session", SessionSchema);

export default Session;
