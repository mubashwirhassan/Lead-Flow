"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const COLUMNS = ["NEW", "CONTACTED", "INTERESTED", "FOLLOW_UP", "WON", "LOST"];

export default function PipelinePage() {
  const [columns, setColumns] = useState<Record<string, any[]>>({});

  useEffect(() => {
    Promise.all(
      COLUMNS.map((s) => fetch("/api/v1/leads?status=" + s + "&limit=50").then((r) => r.json())),
    ).then((results) => {
      const map: Record<string, any[]> = {};
      COLUMNS.forEach((s, i) => (map[s] = results[i].items || []));
      setColumns(map);
    });
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Pipeline</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {COLUMNS.map((s) => (
          <div key={s} className="bg-white rounded-xl shadow p-3">
            <h2 className="font-semibold text-sm mb-2">{s} ({(columns[s] || []).length})</h2>
            <div className="space-y-2">
              {(columns[s] || []).slice(0, 10).map((l) => (
                <Link key={l._id} href={"/leads/" + l._id}
                  className="block bg-slate-50 hover:bg-brand-50 rounded-lg p-2 text-xs">
                  <p className="font-medium">{l.name}</p>
                  <p className="text-slate-500">{l.serviceRequired || l.leadNumber}</p>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}