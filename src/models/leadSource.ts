import mongoose, { Schema } from "mongoose";

export const leadSourceSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    type: { type: String, enum: ["WEBSITE", "MANUAL", "API"], required: true },
    isActive: { type: Boolean, default: true },
    allowedOrigins: { type: [String], default: [] }, // for WEBSITE type: CORS allowlist
  },
  { timestamps: true, collection: "lead_sources" },
);

export const LeadSource = mongoose.models.LeadSource || mongoose.model("LeadSource", leadSourceSchema);
