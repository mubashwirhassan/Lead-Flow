import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Lead, CompanySettings } from "@/models";
import { requireRole } from "@/lib/rbac";
import { ok, fail, handleError, parseBody } from "@/lib/http";
import { aiChat, untrusted, detectLanguage, AiUnavailableError, type ChatMessage } from "@/lib/ai";

const schema = z.object({
  tone: z.enum(["professional", "friendly", "short", "detailed"]).default("professional"),
  language: z.enum(["auto", "Bangla", "English"]).default("auto"),
  instructions: z.string().max(500).optional(),
});

// POST /api/v1/ai/generate-reply/:id : draft a reply. Advisory only - staff review required.
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

    const detected = detectLanguage(lead.message || "");
    const replyLang = body.language === "auto" ? (detected === "BANGLA" ? "Bangla" : "English") : body.language;
    const kb = settings?.knowledgeBase ? "Company knowledge (trusted): " + settings.knowledgeBase.slice(0, 2000) : "";

    const messages: ChatMessage[] = [
      {
        role: "system",
        content:
          "You draft sales replies for a CRM. Tone: " + body.tone + ". Language: " + replyLang +
          ". Use only the company knowledge provided; do not invent prices or promises. " + kb +
          " Output only the reply text, ready to send. It is a draft for staff review.",
      },
      {
        role: "user",
        content:
          "Customer: " + lead.name + " | Service: " + lead.serviceRequired +
          " | Customer message: " + untrusted(lead.message || "(no message)") +
          (body.instructions ? " | Extra staff instructions: " + body.instructions : ""),
      },
    ];
    const result = await aiChat(messages, { userId: user._id.toString(), leadId: lead._id.toString(), kind: "generate_reply" });
    return ok({ draft: result.content, language: replyLang, notice: "Draft only - review before sending to the customer" });
  } catch (e) {
    if (e instanceof AiUnavailableError) return fail(e.message, 503);
    return handleError(e);
  }
}
