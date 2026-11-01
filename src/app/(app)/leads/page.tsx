"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Lead = { _id: string; leadNumber: string; name: string; email: string; phone: string; company: string; status: string; priority: string; assignedTo?: { name?: string } | null };

const STATUSES = ["NEW", "CONTACTED", "INTERESTED", "FOLLOW_UP", "WON", "LOST"];

export default function LeadsPage() {
  const [items, setItems] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    const res = await fetch("/api/v1/leads?" + params.toString());
    const data = await res.json();
    setItems(data.items || []);
    setTotal(data.total || 0);
    setBusy(false);
  }, [page, q, status]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Leads</h1>
        <Link href="/leads/new" className="bg-brand-600 hover:bg-brand-700 text-white text-sm px-4 py-2 rounded-lg font-semibold">New lead</Link>
      </div>
      <div className="flex flex-wrap gap-2">
        <input placeholder="Search name, email, phone, company" value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          className="flex-1 min-w-[220px] rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      {busy ? <p className="text-slate-500">Loading...</p> : items.length === 0 ? (
        <p className="text-slate-500 bg-white rounded-xl shadow p-6">No leads found.</p>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="p-3">Lead #</th><th className="p-3">Name</th><th className="p-3">Contact</th>
                <th className="p-3">Status</th><th className="p-3">Priority</th><th className="p-3">Agent</th>
              </tr>
            </thead>
            <tbody>
              {items.map((l) => (
                <tr key={l._id} className="border-t border-slate-100 hover:bg-brand-50/50">
                  <td className="p-3"><Link className="text-brand-600 underline" href={"/leads/" + l._id}>{l.leadNumber}</Link></td>
                  <td className="p-3">{l.name}</td>
                  <td className="p-3">{l.email || l.phone}</td>
                  <td className="p-3"><span className="px-2 py-1 rounded bg-slate-100 text-xs">{l.status}</span></td>
                  <td className="p-3 text-xs">{l.priority}</td>
                  <td className="p-3 text-xs">{l.assignedTo?.name || "Unassigned"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">{total} leads - page {page} of {Math.max(1, Math.ceil(total / 20))}</span>
        <div className="space-x-2">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1 rounded-lg border disabled:opacity-40">Prev</button>
          <button disabled={page * 20 >= total} onClick={() => setPage(page + 1)} className="px-3 py-1 rounded-lg border disabled:opacity-40">Next</button>
        </div>
      </div>
    </div>
  );
}