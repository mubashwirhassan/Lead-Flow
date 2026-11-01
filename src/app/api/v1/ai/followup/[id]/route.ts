import { connectDB } from "@/lib/db";
import { Lead, Followup, CompanySettings } from "@/models";
import { requireRole } from "@/lib/rbac";
import { ok, fail, handleError } from "@/lib/http";
import { aiJson, untrusted, AiUnavailableError, type ChatMessage } from "@/lib/ai";

// POST /api/v1/ai/followup/:id : suggest next action + reminder interval
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole("ADMIN", "MANAGER", "AGENT");
    await connectDB();
    const lead = await Lead.findOne({ _id: params.id, deletedAt: null });
    if (!lead) return fail("Lead not found", 404);
    if (user.role === "AGENT" && lead.assignedTo?.toString() !== user._id.toString()) return fail("Lead not found", 404);

    const settings = await CompanySettings.findOne();
    if (settings && settings.aiEnabled === false) return fail("AI is disabled in settings", 403);

    const last = await Followup.findOne({ leadId: lead._id, status: "PENDING" }).sort({ dueAt: -1 });
    const system = "You are a sales follow-up assistant. Return JSON with keys: nextAction (short sentence), reminderDays (integer 1-30), reason (short sentence).";
    const messages: ChatMessage[] = [
      { role: "system", content: system },
      {
        role: "user",
        content:
          "Lead: " + lead.name + " | Status: " + lead.status + " | Service: " + lead.serviceRequired +
          " | Pending follow-up: " + (last ? last.title + " due " + last.dueAt.toISOString() : "none") +
          " | Message: " + untrusted(lead.message || "(no message)"),
      },
    ];
    const suggestion = await aiJson(messages, { userId: user._id.toString(), leadId: lead._id.toString(), kind: "followup" });
    return ok({ suggestion });
  } catch (e) {
    if (e instanceof AiUnavailableError) return fail(e.message, 503);
    return handleError(e);
  }
}
