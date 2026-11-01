"use client";

import { useEffect, useState } from "react";

export default function NotificationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);

  async function load() {
    const d = await fetch("/api/v1/notifications").then((r) => r.json());
    setItems(d.items || []);
    setUnread(d.unread || 0);
  }

  useEffect(() => { load(); }, []);

  async function markAllRead() {
    await fetch("/api/v1/notifications", { method: "PATCH" });
    load();
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {unread > 0 && <button onClick={markAllRead} className="text-sm text-brand-600 underline">Mark all read</button>}
      </div>
      {items.length === 0 ? (
        <p className="text-slate-500 bg-white rounded-xl shadow p-6">No notifications.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li key={n._id} className="bg-white rounded-xl shadow p-4">
              <p className={"font-medium text-sm " + (n.isRead ? "text-slate-500" : "text-brand-700")}>{n.title}</p>
              <p className="text-xs text-slate-500">{n.message} - {new Date(n.createdAt).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}