"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AcceptInvitePage() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [state, setState] = useState<"checking" | "valid" | "invalid">("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) { setState("invalid"); return; }
    fetch("/api/v1/auth/invitations/verify?token=" + encodeURIComponent(token))
      .then((r) => r.json())
      .then((d) => setState(d.valid ? "valid" : "invalid"))
      .catch(() => setState("invalid"));
  }, [token]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords do not match"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/v1/auth/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Accept failed");
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Accept failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow p-8 space-y-4">
        <h1 className="text-2xl font-bold text-brand-600">Accept invitation</h1>
        {state === "checking" && <p className="text-sm text-slate-500">Checking your invitation...</p>}
        {state === "invalid" && (
          <p className="text-sm text-red-600 bg-red-50 rounded p-2">
            This invitation link is invalid, expired, or already used. Ask an admin to resend it.
          </p>
        )}
        {state === "valid" && (
          <form onSubmit={submit} className="space-y-4">
            {error && <p className="text-sm text-red-600 bg-red-50 rounded p-2">{error}</p>}
            <label className="block text-sm font-medium" htmlFor="password">Create a password (min 8 characters)
              <input id="password" type="password" required minLength={8} value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
            <label className="block text-sm font-medium" htmlFor="confirm">Confirm password
              <input id="confirm" type="password" required minLength={8} value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
            <button disabled={busy} type="submit"
              className="w-full bg-brand-600 hover:bg-brand-700 text-white rounded-lg py-2 font-semibold disabled:opacity-50">
              {busy ? "Saving..." : "Set password and activate account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}