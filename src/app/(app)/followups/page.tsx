"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function FollowupsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [status, setStatus] = useState("PENDING");

  useEffect(() => {
    fetch("/api/v1/followups?status=" + status)
      .then((r) => r.json())
      .then((d) => setItems(d.items || []));
  }, [status]);

  async function complete(id: string) {
    await fetch("/api/v1/followups/" + id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "COMPLETED" }),
    });
    setItems((prev) => prev.filter((f) => f._id !== id));
  }

  const now = new Date();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Follow-ups</h1>
      <div className="flex gap-2">
        {["PENDING", "COMPLETED", "CANCELLED"].map((s) => (
          <button key={s} onClick={() => setStatus(s)}
            className={"px-3 py-1.5 rounded-lg text-sm " + (status === s ? "bg-brand-600 text-white" : "bg-white border")}>
            {s}
          </button>
        ))}
      </div>
      {items.length === 0 ? (
        <p className="text-slate-500 bg-white rounded-xl shadow p-6">No follow-ups.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((f) => {
            const overdue = f.status === "PENDING" && new Date(f.dueAt) < now;
            return (
              <li key={f._id} className="bg-white rounded-xl shadow p-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{f.title} {overdue && <span className="text-xs text-red-600">(overdue)</span>}</p>
                  <p className="text-xs text-slate-500">Due {new Date(f.dueAt).toLocaleString()}</p>
                  {f.leadId?.leadNumber && <p className="text-xs"><Link className="underline" href={"/leads/" + f.leadId._id}>{f.leadId.leadNumber}</Link></p>}
                </div>
                {f.status === "PENDING" && (
                  <button onClick={() => complete(f._id)} className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1.5 rounded-lg">Complete</button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}