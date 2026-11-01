import mongoose, { Schema } from "mongoose";

export const leadSchema = new Schema(
  {
    leadNumber: { type: String, required: true, unique: true }, // human-readable e.g. LF-2026-000123
    name: { type: String, required: true, trim: true, index: true },
    phone: { type: String, default: "", index: true },
    email: { type: String, default: "", lowercase: true, index: true },
    company: { type: String, default: "" },
    serviceRequired: { type: String, default: "" },
    budget: { type: Number, default: null },
    currency: { type: String, default: "BDT" },
    message: { type: String, default: "" }, // untrusted customer text
    sourceId: { type: Schema.Types.ObjectId, ref: "LeadSource", required: true, index: true },
    campaign: { type: String, default: "" },
    status: {
      type: String,
      enum: ["NEW", "CONTACTED", "INTERESTED", "FOLLOW_UP", "WON", "LOST"],
      default: "NEW",
      index: true,
    },
    priority: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "URGENT"], default: "MEDIUM" },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    customFields: { type: Map, of: String, default: {} },
    possibleDuplicateOf: { type: Schema.Types.ObjectId, ref: "Lead", default: null }, // duplicate warning, never auto-merge
    deletedAt: { type: Date, default: null, index: true }, // soft delete
  },
  { timestamps: true, collection: "leads" },
);

leadSchema.index({ createdAt: -1 });

export const Lead = mongoose.models.Lead || mongoose.model("Lead", leadSchema);
