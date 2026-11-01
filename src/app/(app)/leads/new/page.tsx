"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewLeadPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", phone: "", email: "", company: "", serviceRequired: "", budget: "", currency: "BDT", message: "", campaign: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload: Record<string, unknown> = { ...form };
      if (form.budget) payload.budget = Number(form.budget); else delete payload.budget;
      if (!form.email) delete payload.email;
      const res = await fetch("/api/v1/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create lead");
      router.push("/leads/" + data.lead._id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create lead");
      setBusy(false);
    }
  }

  const input = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">New lead</h1>
      {error && <p className="mb-4 text-sm text-red-600 bg-red-50 rounded p-2">{error}</p>}
      <form onSubmit={submit} className="bg-white rounded-xl shadow p-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <label className="block text-sm font-medium">Name*
            <input required className={input} value={form.name} onChange={(e) => set("name", e.target.value)} />
          </label>
          <label className="block text-sm font-medium">Phone
            <input className={input} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </label>
          <label className="block text-sm font-medium">Email
            <input type="email" className={input} value={form.email} onChange={(e) => set("email", e.target.value)} />
          </label>
          <label className="block text-sm font-medium">Company
            <input className={input} value={form.company} onChange={(e) => set("company", e.target.value)} />
          </label>
          <label className="block text-sm font-medium">Service required
            <input className={input} value={form.serviceRequired} onChange={(e) => set("serviceRequired", e.target.value)} />
          </label>
          <label className="block text-sm font-medium">Budget
            <input type="number" min="0" className={input} value={form.budget} onChange={(e) => set("budget", e.target.value)} />
          </label>
          <label className="block text-sm font-medium">Currency
            <input className={input} value={form.currency} onChange={(e) => set("currency", e.target.value)} />
          </label>
          <label className="block text-sm font-medium">Campaign
            <input className={input} value={form.campaign} onChange={(e) => set("campaign", e.target.value)} />
          </label>
        </div>
        <label className="block text-sm font-medium">Message
          <textarea rows={4} className={input} value={form.message} onChange={(e) => set("message", e.target.value)} />
        </label>
        <p className="text-xs text-slate-500">At least one contact method (phone or email) is required.</p>
        <button disabled={busy} type="submit" className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50">
          {busy ? "Creating..." : "Create lead"}
        </button>
      </form>
    </div>
  );
}