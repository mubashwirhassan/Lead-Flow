import { env } from "@/lib/env";

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!env.EMAIL_API_KEY) {
    // Email not configured: log the message so links remain recoverable in dev.
    console.log("[email:disabled] to=" + to + " subject=" + subject);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + env.EMAIL_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: env.EMAIL_FROM, to, subject, html }),
    });
    if (!res.ok) {
      console.error("[email] provider error:", res.status, await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error("[email] send failed:", e);
    return false;
  }
}

function layout(title: string, body: string): string {
  return '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto"><h2 style="color:#4f46e5">' + title + "</h2>" + body + '<p style="color:#6b7280;font-size:12px">Sent by ' + env.APP_NAME + "</p></div>";
}

export function inviteEmail(name: string, link: string, hours: number): { subject: string; html: string } {
  return {
    subject: "You are invited to " + env.APP_NAME,
    html: layout(
      "Welcome, " + name + "!",
      "<p>You have been invited to join " + env.APP_NAME + ".</p><p><a href=" + link + ' style="background:#4f46e5;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none">Accept invitation</a></p><p>This link expires in ' + hours + " hours and can be used once.</p>",
    ),
  };
}

export function resetEmail(name: string, link: string): { subject: string; html: string } {
  return {
    subject: "Reset your " + env.APP_NAME + " password",
    html: layout(
      "Password reset",
      "<p>Hi " + name + ", use the button below to set a new password. The link expires in 1 hour.</p><p><a href=" + link + ' style="background:#4f46e5;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none">Reset password</a></p>',
    ),
  };
}
