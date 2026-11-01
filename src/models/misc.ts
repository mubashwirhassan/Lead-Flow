import mongoose, { Schema } from "mongoose";

export const agentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    department: { type: String, default: "" },
    designation: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "agents" },
);

export const Agent = mongoose.models.Agent || mongoose.model("Agent", agentSchema);

export const appointmentSchema = new Schema(
  {
    leadId: { type: Schema.Types.ObjectId, ref: "Lead", required: true, index: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", default: null },
    title: { type: String, required: true, trim: true },
    scheduledAt: { type: Date, required: true, index: true },
    status: { type: String, enum: ["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"], default: "SCHEDULED" },
    notes: { type: String, default: "" },
  },
  { timestamps: true, collection: "appointments" },
);

export const Appointment = mongoose.models.Appointment || mongoose.model("Appointment", appointmentSchema);

export const integrationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    provider: { type: String, required: true },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "INACTIVE" },
    config: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: "integrations" },
);

export const Integration = mongoose.models.Integration || mongoose.model("Integration", integrationSchema);

export const apiKeySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    keyHash: { type: String, required: true, unique: true }, // SHA-256 of raw key; raw shown once
    prefix: { type: String, default: "" }, // first chars to identify the key in UI
    lastUsedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "api_keys" },
);

export const ApiKey = mongoose.models.ApiKey || mongoose.model("ApiKey", apiKeySchema);

export const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, default: "" },
    type: { type: String, default: "INFO" },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true, collection: "notifications" },
);

export const Notification = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);

export const companySettingsSchema = new Schema(
  {
    companyName: { type: String, default: "My Company" },
    logoUrl: { type: String, default: "" },
    primaryColor: { type: String, default: "#4f46e5" },
    timezone: { type: String, default: "Asia/Dhaka" },
    currency: { type: String, default: "BDT" },
    aiEnabled: { type: Boolean, default: true },
    knowledgeBase: { type: String, default: "" }, // company description, services, pricing, policies, FAQs
    settings: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: "company_settings" },
);

export const CompanySettings = mongoose.models.CompanySettings || mongoose.model("CompanySettings", companySettingsSchema);

export const auditLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: String, default: null },
    ipAddress: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: "audit_logs" },
);

auditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);
