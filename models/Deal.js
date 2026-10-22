import mongoose from "mongoose";

const DealSchema = new mongoose.Schema(
  {
    dealId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    branch: {
      type: String,
      default: "Sasaram",
      required: true,
    },
    status: {
      type: String,
      default: "draft",
    },
    createdBy: String,
    data: {
      type: Object,
      required: true,
    },
  },
  { timestamps: true, strict: false }
);

export default mongoose.models.Deal || mongoose.model("Deal", DealSchema);
