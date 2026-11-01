import mongoose, { Schema } from "mongoose";

export const aiAnalysisSchema = new Schema(
  {
    leadId: { type: Schema.Types.ObjectId, ref: "Lead", required: true, index: true },
    summary: { type: String, default: "" },
    intent: { type: String, default: "" },
    priority: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "URGENT"], default: "MEDIUM" },
    language: { type: String, enum: ["BANGLA", "ENGLISH", "BANGLISH"], default: "ENGLISH" },
    recommendedAction: { type: String, default: "" },
    confidence: { type: Number, default: 0 },
    budgetClues: { type: String, default: "" },
    model: { type: String, default: "" },
    tokenUsage: {
      promptTokens: { type: Number, default: 0 },
      completionTokens: { type: Number, default: 0 },
      estCostUsd: { type: Number, default: 0 },
    },
  },
  { timestamps: true, collection: "ai_analyses" },
);

export const AiAnalysis = mongoose.models.AiAnalysis || mongoose.model("AiAnalysis", aiAnalysisSchema);

export const conversationSchema = new Schema(
  {
    leadId: { type: Schema.Types.ObjectId, ref: "Lead", required: true, index: true },
    channel: { type: String, default: "MANUAL" },
    direction: { type: String, enum: ["IN", "OUT"], required: true },
    message: { type: String, required: true },
    sentBy: { type: String, default: "" },
  },
  { timestamps: true, collection: "conversations" },
);

export const Conversation = mongoose.models.Conversation || mongoose.model("Conversation", conversationSchema);

export const aiConversationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, default: "New chat" },
  },
  { timestamps: true, collection: "ai_conversations" },
);

export const AiConversation = mongoose.models.AiConversation || mongoose.model("AiConversation", aiConversationSchema);

export const aiMessageSchema = new Schema(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "AiConversation", required: true, index: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    model: { type: String, default: "" },
  },
  { timestamps: true, collection: "ai_messages" },
);

export const AiMessage = mongoose.models.AiMessage || mongoose.model("AiMessage", aiMessageSchema);

export const aiUsageSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    leadId: { type: Schema.Types.ObjectId, ref: "Lead", default: null },
    kind: { type: String, required: true }, // analyze_lead, generate_reply, chat, followup
    model: { type: String, required: true },
    promptTokens: { type: Number, default: 0 },
    completionTokens: { type: Number, default: 0 },
    estCostUsd: { type: Number, default: 0 },
    latencyMs: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "ai_usage" },
);

export const AiUsage = mongoose.models.AiUsage || mongoose.model("AiUsage", aiUsageSchema);
