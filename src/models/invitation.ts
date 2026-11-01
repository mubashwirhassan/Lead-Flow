import mongoose, { Schema } from "mongoose";

export const invitationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    email: { type: String, required: true, lowercase: true, index: true },
    role: { type: String, enum: ["ADMIN", "MANAGER", "AGENT"], required: true },
    tokenHash: { type: String, required: true }, // SHA-256 of raw token; raw never stored
    invitedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    expiresAt: { type: Date, required: true, index: true },
    acceptedAt: { type: Date, default: null },
    revokedAt: { type: Date, default: null },
    accepted: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "invitations" },
);

// A pending invite is unique per email: one open invitation at a time
invitationSchema.index({ email: 1, accepted: 1, revokedAt: 1 });

export const Invitation = mongoose.models.Invitation || mongoose.model("Invitation", invitationSchema);
