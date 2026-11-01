import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Lead, AiAnalysis, LeadActivity, CompanySettings } from "@/models";
import { requireRole } from "@/lib/rbac";
import { ok, fail, handleError, parseBody } from "@/lib/http";
import { aiJson, untrusted, detectLanguage, AiUnavailableError, type ChatMessage } from "@/lib/ai";
import { env } from "@/lib/env";

const schema = z.object({ refresh: z.boolean().optional() });

// POST /api/v1/ai/analyze-lead/:id : Lead Analyzer (summary, intent, priority, language, next action)
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole("ADMIN", "MANAGER", "AGENT");
    const body = await parseBody(req, schema);
    await connectDB();
    const lead = await Lead.findOne({ _id: params.id, deletedAt: null });
    if (!lead) return fail("Lead not found", 404);
    if (user.role === "AGENT" && lead.assignedTo?.toString() !== user._id.toString()) return fail("Lead not found", 404);

    const settings = await CompanySettings.findOne();
    if (settings && settings.aiEnabled === false) return fail("AI is disabled in settings", 403);

    const existing = await AiAnalysis.findOne({ leadId: lead._id }).sort({ createdAt: -1 });
    if (existing && !body.refresh) return ok({ analysis: existing, cached: true });

    const lang = detectLanguage(lead.message || lead.serviceRequired || "");
    const system = "You are a lead analysis assistant for a CRM. Return JSON with keys: summary, intent, priority (LOW/MEDIUM/HIGH/URGENT), recommendedAction, budgetClues, confidence (0-1). Be concise.";
    const messages: ChatMessage[] = [
      { role: "system", content: system },
      { role: "user", content: "Name: " + lead.name + " | Service: " + lead.serviceRequired + " | Budget: " + lead.budget + " " + lead.currency + " | Message: " + untrusted(lead.message || "(no message)") },
    ];
    const analysis = await aiJson<{ summary: string; intent: string; priority: string; recommendedAction: string; budgetClues: string; confidence: number }>(
      messages,
      { userId: user._id.toString(), leadId: lead._id.toString(), kind: "analyze_lead" },
    );

    const saved = await AiAnalysis.create({
      leadId: lead._id,
      summary: analysis.summary,
      intent: analysis.intent,
      priority: analysis.priority,
      language: lang,
      recommendedAction: analysis.recommendedAction,
      confidence: analysis.confidence,
      budgetClues: analysis.budgetClues,
      model: env.AI_MODEL,
    });
    await LeadActivity.create({ leadId: lead._id, userId: user._id, action: "AI_ANALYZED", description: "AI lead analysis generated" });
    return ok({ analysis: saved, cached: false });
  } catch (e) {
    if (e instanceof AiUnavailableError) return fail(e.message, 503);
    return handleError(e);
  }
}
