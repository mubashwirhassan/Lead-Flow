"use client";

import { useEffect, useState } from "react";

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<any>(null);
  const [agents, setAgents] = useState<any>(null);

  useEffect(() => {
    fetch("/api/v1/analytics/overview").then((r) => r.json()).then(setOverview);
    fetch("/api/v1/analytics/agents").then((r) => r.json()).then(setAgents).catch(() => {});
  }, []);

  if (!overview) return <p className="text-slate-500">Loading analytics...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Analytics</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow p-4"><p className="text-sm text-slate-500">Total leads</p><p className="text-2xl font-bold text-brand-600">{overview.total}</p></div>
        <div className="bg-white rounded-xl shadow p-4"><p className="text-sm text-slate-500">Won</p><p className="text-2xl font-bold text-green-600">{overview.won}</p></div>
        <div className="bg-white rounded-xl shadow p-4"><p className="text-sm text-slate-500">Conversion %</p><p className="text-2xl font-bold text-brand-600">{overview.conversionRate}</p></div>
        <div className="bg-white rounded-xl shadow p-4"><p className="text-sm text-slate-500">Overdue follow-ups</p><p className="text-2xl font-bold text-red-600">{overview.overdueFollowups}</p></div>
      </div>
      {agents && (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <h2 className="font-semibold p-4">Agent performance</h2>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left"><tr><th className="p-3">Agent</th><th className="p-3">Leads</th><th className="p-3">Won</th><th className="p-3">Lost</th></tr></thead>
            <tbody>
              {(agents.leads || []).map((row: any) => (
                <tr key={String(row._id)} className="border-t border-slate-100">
                  <td className="p-3">{String(row._id)}</td>
                  <td className="p-3">{row.leads}</td>
                  <td className="p-3 text-green-700">{row.won}</td>
                  <td className="p-3 text-red-700">{row.lost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}