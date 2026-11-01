"use client";

import { useState } from "react";

export default function AiPage() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [busy, setBusy] = useState(false);

  async function send() {
    if (!input.trim() || busy) return;
    const text = input;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setBusy(true);
    try {
      const res = await fetch("/api/v1/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, conversationId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setConversationId(data.conversationId);
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: (e as Error).message }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold">AI Assistant</h1>
      <p className="text-sm text-slate-500">Ask about your CRM data - answers use only permission-checked facts and company knowledge.</p>
      <div className="bg-white rounded-xl shadow p-4 space-y-3 min-h-[300px]">
        {messages.length === 0 && <p className="text-sm text-slate-400">Start a conversation, e.g. &quot;How many new leads this month?&quot;</p>}
        {messages.map((m, i) => (
          <div key={i} className={"text-sm rounded-lg p-3 " + (m.role === "user" ? "bg-brand-50 ml-16" : "bg-slate-100 mr-16")}>
            <p className="whitespace-pre-wrap">{m.content}</p>
          </div>
        ))}
        {busy && <p className="text-sm text-slate-400">Thinking...</p>}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about your leads..."
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <button disabled={busy} type="submit" className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50">Send</button>
      </form>
    </div>
  );
}