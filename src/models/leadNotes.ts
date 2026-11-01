import mongoose, { Schema } from "mongoose";

export const leadNoteSchema = new Schema(
  {
    leadId: { type: Schema.Types.ObjectId, ref: "Lead", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    note: { type: String, required: true, trim: true },
  },
  { timestamps: true, collection: "lead_notes" },
);

export const LeadNote = mongoose.models.LeadNote || mongoose.model("LeadNote", leadNoteSchema);

export const leadActivitySchema = new Schema(
  {
    leadId: { type: Schema.Types.ObjectId, ref: "Lead", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    action: { type: String, required: true }, // CREATED, STATUS_CHANGED, ASSIGNED, NOTE_ADDED, AI_ANALYZED...
    description: { type: String, default: "" },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: "lead_activities" },
);

export const LeadActivity = mongoose.models.LeadActivity || mongoose.model("LeadActivity", leadActivitySchema);
