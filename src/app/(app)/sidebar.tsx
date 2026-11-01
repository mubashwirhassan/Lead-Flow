"use client";

import Link from "next/link";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/leads", label: "Leads" },
  { href: "/leads/pipeline", label: "Pipeline" },
  { href: "/followups", label: "Follow-ups" },
  { href: "/agents", label: "Team" },
  { href: "/ai", label: "AI Assistant" },
  { href: "/analytics", label: "Analytics" },
  { href: "/notifications", label: "Notifications" },
  { href: "/settings", label: "Settings" },
];

const ADMIN_ONLY = ["/settings"];

export function Sidebar({ user }: { user: { id: string; name: string; email: string; role: string } }) {
  return (
    <aside className="w-60 bg-white border-r border-slate-200 flex flex-col">
      <div className="p-4 border-b border-slate-200">
        <p className="font-bold text-brand-600">AI LeadFlow CRM</p>
        <p className="text-xs text-slate-500 mt-1">{user.name} ({user.role})</p>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {NAV.filter((n) => user.role === "ADMIN" || !ADMIN_ONLY.includes(n.href)).map((n) => (
          <Link key={n.href} href={n.href}
            className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-brand-50 hover:text-brand-700">
            {n.label}
          </Link>
        ))}
      </nav>
      <button
        onClick={async () => {
          await fetch("/api/v1/auth/logout", { method: "POST" });
          window.location.href = "/login";
        }}
        className="m-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50"
      >
        Sign out
      </button>
    </aside>
  );
}