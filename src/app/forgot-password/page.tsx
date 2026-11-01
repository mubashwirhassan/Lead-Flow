"use client";

import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setMessage(data.message || "Check your email.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-xl shadow p-8 space-y-4">
        <h1 className="text-2xl font-bold text-brand-600">Reset password</h1>
        {message && <p className="text-sm text-slate-700 bg-slate-100 rounded p-2">{message}</p>}
        <label className="block text-sm font-medium" htmlFor="email">Email
          <input id="email" type="email" required value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        <button disabled={busy} type="submit"
          className="w-full bg-brand-600 hover:bg-brand-700 text-white rounded-lg py-2 font-semibold disabled:opacity-50">
          {busy ? "Sending..." : "Send reset link"}
        </button>
        <p className="text-xs text-center"><a className="underline" href="/login">Back to login</a></p>
      </form>
    </div>
  );
}