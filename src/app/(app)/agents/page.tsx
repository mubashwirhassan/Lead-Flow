"use client";

import { useEffect, useState } from "react";

export default function AgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/v1/agents")
      .then((r) => r.json())
      .then((d) => setAgents(d.agents || []));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Team</h1>
      <p className="text-sm text-slate-500">Agents are created through the admin invite flow (Settings &gt; Users).</p>
      {agents.length === 0 ? (
        <p className="text-slate-500 bg-white rounded-xl shadow p-6">No agents yet.</p>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left"><tr><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Role</th><th className="p-3">Department</th><th className="p-3">Designation</th></tr></thead>
            <tbody>
              {agents.map((a) => (
                <tr key={a._id} className="border-t border-slate-100">
                  <td className="p-3">{a.userId?.name || "-"}</td>
                  <td className="p-3">{a.userId?.email || "-"}</td>
                  <td className="p-3">{a.userId?.role || "-"}</td>
                  <td className="p-3">{a.department || "-"}</td>
                  <td className="p-3">{a.designation || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}