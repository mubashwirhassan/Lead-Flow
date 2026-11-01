import mongoose, { Schema } from "mongoose";

export const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, default: "" }, // empty until invite accepted
    role: { type: String, enum: ["ADMIN", "MANAGER", "AGENT"], required: true },
    status: { type: String, enum: ["INVITED", "ACTIVE", "DISABLED"], default: "INVITED", index: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    mustChangePassword: { type: Boolean, default: false },
    resetTokenHash: { type: String, default: "" },
    resetTokenExpiresAt: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "users" },
);

// Only ACTIVE users can ever be authenticated as the current user.
userSchema.index({ email: 1, status: 1 });

export const User = mongoose.models.User || mongoose.model("User", userSchema);
