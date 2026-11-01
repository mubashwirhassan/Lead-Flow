"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-xl shadow p-8 space-y-4">
        <h1 className="text-2xl font-bold text-brand-600">AI LeadFlow CRM</h1>
        <p className="text-sm text-slate-500">Sign in with your invited account.</p>
        {error && <p className="text-sm text-red-600 bg-red-50 rounded p-2">{error}</p>}
        <label className="block text-sm font-medium" htmlFor="email">Email
          <input id="email" type="email" required autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </label>
        <label className="block text-sm font-medium" htmlFor="password">Password
          <input id="password" type="password" required autoComplete="current-password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </label>
        <button disabled={busy} type="submit"
          className="w-full bg-brand-600 hover:bg-brand-700 text-white rounded-lg py-2 font-semibold disabled:opacity-50">
          {busy ? "Signing in..." : "Sign in"}
        </button>
        <p className="text-xs text-center text-slate-500">
          <a className="underline" href="/forgot-password">Forgot password?</a>
        </p>
        <p className="text-xs text-center text-slate-400">Accounts are created by admin invitation only.</p>
      </form>
    </div>
  );
}