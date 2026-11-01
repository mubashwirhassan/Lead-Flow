import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Lead, Followup, AiConversation, AiMessage, CompanySettings } from "@/models";
import { requireRole } from "@/lib/rbac";
import { ok, fail, handleError, parseBody } from "@/lib/http";
import { aiChat, AiUnavailableError, type ChatMessage } from "@/lib/ai";
import { env } from "@/lib/env";

const schema = z.object({
  conversationId: z.string().optional(),
  message: z.string().min(1).max(2000),
});

// POST /api/v1/ai/chat : permission-aware assistant. The model gets only allowlisted,
// role-scoped aggregate facts - never raw records, never database access.
export async function POST(req: Request) {
  try {
    const user = await requireRole("ADMIN", "MANAGER", "AGENT");
    const body = await parseBody(req, schema);
    await connectDB();
    const settings = await CompanySettings.findOne();
    if (settings && settings.aiEnabled === false) return fail("AI is disabled in settings", 403);

    let conv = body.conversationId ? await AiConversation.findById(body.conversationId) : null;
    if (conv && conv.userId.toString() !== user._id.toString()) return fail("Conversation not found", 404);
    if (!conv) conv = await AiConversation.create({ userId: user._id, title: body.message.slice(0, 60) });
    await AiMessage.create({ conversationId: conv._id, role: "user", content: body.message });

    const scope = user.role === "AGENT" ? { assignedTo: user._id, deletedAt: null } : { deletedAt: null };
    const counts = await Promise.all([
      Lead.countDocuments(scope),
      Lead.countDocuments({ ...scope, status: "NEW" }),
      Lead.countDocuments({ ...scope, status: "WON" }),
      Lead.countDocuments({ ...scope, status: "LOST" }),
      Followup.countDocuments({ status: "PENDING" }),
    ]);
    const facts =
      "CRM facts (only these may be referenced): total: " + counts[0] +
      ", new: " + counts[1] + ", won: " + counts[2] + ", lost: " + counts[3] +
      ", pending followups: " + counts[4] + ".";

    const history = await AiMessage.find({ conversationId: conv._id }).sort({ createdAt: 1 }).limit(20).lean();
    const messages: ChatMessage[] = [];
    messages.push({
      role: "system",
      content:
        "You are the CRM assistant. Answer ONLY from CRM facts and company knowledge. If not present, say you cannot answer. " +
        (settings?.knowledgeBase ? settings.knowledgeBase.slice(0, 2000) : ""),
    });
    for (const m of history) messages.push({ role: m.role, content: m.content });
    messages.push({ role: "user", content: facts + " Question: " + body.message });

    const result = await aiChat(messages, { userId: user._id.toString(), kind: "chat", temperature: 0.3 });
    await AiMessage.create({ conversationId: conv._id, role: "assistant", content: result.content, model: env.AI_MODEL });
    return ok({ conversationId: conv._id, reply: result.content });
  } catch (e) {
    if (e instanceof AiUnavailableError) return fail(e.message, 503);
    return handleError(e);
  }
}
