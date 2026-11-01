import mongoose, { Schema } from "mongoose";

export const followupSchema = new Schema(
  {
    leadId: { type: Schema.Types.ObjectId, ref: "Lead", required: true, index: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    dueAt: { type: Date, required: true, index: true },
    status: { type: String, enum: ["PENDING", "COMPLETED", "CANCELLED"], default: "PENDING", index: true },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "followups" },
);

export const Followup = mongoose.models.Followup || mongoose.model("Followup", followupSchema);
