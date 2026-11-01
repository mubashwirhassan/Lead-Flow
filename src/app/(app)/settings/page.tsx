"use client";

import { useEffect, useState } from "react";

const TABS = ["Company", "Users", "AI", "API Keys"];

export default function SettingsPage() {
  const [tab, setTab] = useState("Company");
  const [role, setRole] = useState("");
  const [settings, setSettings] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [keys, setKeys] = useState<any[]>([]);
  const [invite, setInvite] = useState({ name: "", email: "", role: "AGENT" });
  const [inviteLink, setInviteLink] = useState("");
  const [newKey, setNewKey] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/v1/auth/me").then((r) => r.json()).then((d) => setRole(d.user?.role || ""));
    fetch("/api/v1/settings").then((r) => r.json()).then((d) => setSettings(d.settings));
  }, []);

  useEffect(() => {
    if (role !== "ADMIN") return;
    fetch("/api/v1/users").then((r) => r.json()).then((d) => setUsers(d.users || []));
    fetch("/api/v1/api-keys").then((r) => r.json()).then((d) => setKeys(d.keys || []));
  }, [role]);

  const isAdmin = role === "ADMIN";

  async function saveSettings() {
    setMsg("");
    const res = await fetch("/api/v1/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    setMsg(data.error ? data.error : "Settings saved");
  }

  async function sendInvite() {
    setMsg("");
    setInviteLink("");
    const res = await fetch("/api/v1/users/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invite),
    });
    const data = await res.json();
    if (data.error) { setMsg(data.error); return; }
    if (data.inviteLink) setInviteLink(data.inviteLink);
    setMsg("Invitation created" + (data.inviteLink ? " - copy the link below (email provider not configured)" : " and emailed"));
    setInvite({ name: "", email: "", role: "AGENT" });
    fetch("/api/v1/users").then((r) => r.json()).then((d) => setUsers(d.users || []));
  }

  async function createKey() {
    setMsg("");
    setNewKey("");
    const res = await fetch("/api/v1/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Website form" }),
    });
    const data = await res.json();
    if (data.error) { setMsg(data.error); return; }
    setNewKey(data.apiKey);
    fetch("/api/v1/api-keys").then((r) => r.json()).then((d) => setKeys(d.keys || []));
  }

  async function revokeKey(id: string) {
    await fetch("/api/v1/api-keys/" + id, { method: "DELETE" });
    fetch("/api/v1/api-keys").then((r) => r.json()).then((d) => setKeys(d.keys || []));
  }

  if (!settings) return <p className="text-slate-500">Loading settings...</p>;

  return (
    <div className="max-w-4xl space-y-4">
      <h1 className="text-2xl font-bold">Settings</h1>
      <div className="flex gap-2">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={"px-3 py-1.5 rounded-lg text-sm " + (tab === t ? "bg-brand-600 text-white" : "bg-white border")}>
            {t}
          </button>
        ))}
      </div>
      {msg && <p className="text-sm bg-slate-100 rounded p-2">{msg}</p>}

      {tab === "Company" && (
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <label className="block text-sm font-medium">Company name
            <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={settings.companyName || ""} onChange={(e) => setSettings({ ...settings, companyName: e.target.value })} />
          </label>
          <label className="block text-sm font-medium">Timezone
            <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={settings.timezone || ""} onChange={(e) => setSettings({ ...settings, timezone: e.target.value })} />
          </label>
          <label className="block text-sm font-medium">Currency
            <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={settings.currency || ""} onChange={(e) => setSettings({ ...settings, currency: e.target.value })} />
          </label>
          {!isAdmin ? <p className="text-xs text-slate-500">Only admins can save company settings.</p> : (
            <button onClick={saveSettings} className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-semibold">Save</button>
          )}
        </div>
      )}

      {tab === "Users" && (
        <div className="space-y-4">
          {!isAdmin ? <p className="text-red-600 text-sm">Only admins can manage users and invitations.</p> : (
            <>
              <div className="bg-white rounded-xl shadow p-6 space-y-3">
                <h2 className="font-semibold">Invite a user</h2>
                <div className="grid md:grid-cols-3 gap-3">
                  <input placeholder="Name" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={invite.name}
                    onChange={(e) => setInvite({ ...invite, name: e.target.value })} />
                  <input placeholder="Email" type="email" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={invite.email}
                    onChange={(e) => setInvite({ ...invite, email: e.target.value })} />
                  <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={invite.role}
                    onChange={(e) => setInvite({ ...invite, role: e.target.value })}>
                    <option value="AGENT">Sales Agent</option>
                    <option value="MANAGER">Sales Manager</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <button onClick={sendInvite} className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-semibold">Send invite</button>
                {inviteLink && <div className="text-xs bg-amber-50 border border-amber-200 rounded p-2 break-all">{inviteLink}</div>}
              </div>
              <div className="bg-white rounded-xl shadow overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left"><tr><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Role</th><th className="p-3">Status</th></tr></thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id} className="border-t border-slate-100">
                        <td className="p-3">{u.name}</td>
                        <td className="p-3">{u.email}</td>
                        <td className="p-3">{u.role}</td>
                        <td className="p-3">{u.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {tab === "AI" && (
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={settings.aiEnabled !== false}
              onChange={(e) => setSettings({ ...settings, aiEnabled: e.target.checked })} />
            AI enabled
          </label>
          <label className="block text-sm font-medium">Company knowledge base (services, pricing, policies, FAQs)
            <textarea rows={6} className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm"
              value={settings.knowledgeBase || ""} onChange={(e) => setSettings({ ...settings, knowledgeBase: e.target.value })} />
          </label>
          {!isAdmin ? <p className="text-xs text-slate-500">Only admins can save AI settings.</p> : (
            <button onClick={saveSettings} className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-semibold">Save</button>
          )}
        </div>
      )}

      {tab === "API Keys" && (
        <div className="space-y-4">
          {!isAdmin ? <p className="text-red-600 text-sm">Only admins can manage API keys.</p> : (
            <>
              <div className="bg-white rounded-xl shadow p-6 space-y-3">
                <h2 className="font-semibold">Create an API key</h2>
                <p className="text-xs text-slate-500">Used by external systems to submit leads to POST /api/v1/public/leads.</p>
                <button onClick={createKey} className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-semibold">Create key</button>
                {newKey && <div className="text-xs bg-amber-50 border border-amber-200 rounded p-2 break-all">{newKey}<p className="mt-1">Save this key now - shown only once.</p></div>}
              </div>
              <div className="bg-white rounded-xl shadow overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left"><tr><th className="p-3">Name</th><th className="p-3">Prefix</th><th className="p-3">Created</th><th className="p-3">Status</th><th className="p-3"></th></tr></thead>
                  <tbody>
                    {keys.map((k) => (
                      <tr key={k._id} className="border-t border-slate-100">
                        <td className="p-3">{k.name}</td>
                        <td className="p-3">{k.prefix}...</td>
                        <td className="p-3">{new Date(k.createdAt).toLocaleDateString()}</td>
                        <td className="p-3">{k.revokedAt ? "Revoked" : "Active"}</td>
                        <td className="p-3">{!k.revokedAt && <button onClick={() => revokeKey(k._id)} className="text-red-600 underline text-xs">Revoke</button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}