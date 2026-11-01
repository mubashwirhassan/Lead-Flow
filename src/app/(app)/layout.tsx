import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Sidebar } from "./sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) return redirect("/login");
  return (
    <div className="flex min-h-screen">
      <Sidebar user={{ id: user._id.toString(), name: user.name, email: user.email, role: user.role }} />
      <main className="flex-1 p-6 lg:p-8 max-w-full overflow-x-hidden">{children}</main>
    </div>
  );
}
