import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI LeadFlow CRM",
  description: "AI-powered lead management and sales workflow",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
