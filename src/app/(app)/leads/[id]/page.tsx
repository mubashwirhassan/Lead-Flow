"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

const STATUSES = ["NEW", "CONTACTED", "INTERESTED", "FOLLOW_UP", "WON", "LOST"];

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [lead, setLead] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [note, setNote] = useState("");
  const [activities, setActivities] = useState<any[]>([]);
  const [msg, setMsg] = useState("");
  const [draft, setDraft] = useState("");

  const load = useCallback(async () => {
    const [l, a] = await Promise.all([
      fetch("/api/v1/leads/" + id).then((r) => r.json()),
      fetch("/api/v1/leads/" + id + "/activities").then((r) => r.json()),
    ]);
    setLead(l.lead || null);
    setActivities(a.activities || []);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function changeStatus(status: string) {
    await fetch("/api/v1/leads/" + id + "/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function addNote() {
    if (!note.trim()) return;
    await fetch("/api/v1/leads/" + id + "/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    });
    setNote("");
    load();
  }

  async function analyze() {
    setMsg("Analyzing...");
    const res = await fetch("/api/v1/ai/analyze-lead/" + id, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    const data = await res.json();
    setMsg("");
    if (data.error) { setMsg(data.error); return; }
    setAnalysis(data.analysis);
  }

  async function generateReply() {
    setMsg("Drafting...");
    const res = await fetch("/api/v1/ai/generate-reply/" + id, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tone: "professional" }) });
    const data = await res.json();
    setMsg("");
    if (data.error) { setMsg(data.error); return; }
    setDraft(data.draft);
  }

  if (!lead) return <p className="text-slate-500">Loading lead...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{lead.name}</h1>
          <p className="text-sm text-slate-500">{lead.leadNumber} - {lead.email || lead.phone}</p>
        </div>
        <select value={lead.status} onChange={(e) => changeStatus(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white">
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      {msg && <p className="text-sm text-brand-700 bg-brand-50 rounded p-2">{msg}</p>}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow p-4 text-sm space-y-1">
            <p><strong>Company:</strong> {lead.company || "-"}</p>
            <p><strong>Service:</strong> {lead.serviceRequired || "-"}</p>
            <p><strong>Budget:</strong> {lead.budget || "-"} {lead.currency}</p>
            <p><strong>Status:</strong> {lead.status} - <strong>Priority:</strong> {lead.priority}</p>
            <p><strong>Message:</strong> {lead.message || "(none)"}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <h2 className="font-semibold mb-2">Add a note</h2>
            <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2 text-sm" placeholder="Call outcome, next steps..." />
            <button onClick={addNote} className="mt-2 bg-brand-600 hover:bg-brand-700 text-white text-sm px-3 py-1.5 rounded-lg">Add note</button>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow p-4">
            <h2 className="font-semibold mb-2">AI actions</h2>
            <div className="flex gap-2">
              <button onClick={analyze} className="bg-brand-50 text-brand-700 text-sm px-3 py-1.5 rounded-lg hover:bg-brand-100">Analyze lead</button>
              <button onClick={generateReply} className="bg-brand-50 text-brand-700 text-sm px-3 py-1.5 rounded-lg hover:bg-brand-100">Draft reply</button>
            </div>
            {analysis && (
              <div className="mt-3 text-sm space-y-1 border-t pt-2">
                <p><strong>Summary:</strong> {analysis.summary}</p>
                <p><strong>Intent:</strong> {analysis.intent}</p>
                <p><strong>Priority:</strong> {analysis.priority} - <strong>Language:</strong> {analysis.language}</p>
                <p><strong>Next action:</strong> {analysis.recommendedAction}</p>
              </div>
            )}
            {draft && (
              <div className="mt-3 text-sm border-t pt-2">
                <p className="text-xs text-amber-600 mb-1">Draft only - review before sending</p>
                <p className="whitespace-pre-wrap bg-slate-50 rounded p-2">{draft}</p>
              </div>
            )}
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <h2 className="font-semibold mb-2">Activity timeline</h2>
            <ul className="text-sm space-y-2">
              {activities.map((a) => (
                <li key={a._id} className="border-l-2 border-brand-200 pl-3">
                  <p className="font-medium">{a.action}</p>
                  <p className="text-xs text-slate-500">{a.description} - {new Date(a.createdAt).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}