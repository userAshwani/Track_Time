import mongoose from "mongoose";

const { Schema } = mongoose;

const CategorySchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Category name is required."],
      trim: true,
      maxlength: [255, "Category name cannot exceed 255 characters."],
    },
    color: {
      type: String,
      default: "#6366F1",
      match: [/^#[0-9A-Fa-f]{6}$/, "Category color must be a hex color."],
    },
    icon: {
      type: String,
      trim: true,
      default: "folder",
      maxlength: [100, "Category icon cannot exceed 100 characters."],
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  }
);

CategorySchema.index({ userId: 1, name: 1 }, { unique: true });

const Category =
  mongoose.models.Category || mongoose.model("Category", CategorySchema);

export default Category;
