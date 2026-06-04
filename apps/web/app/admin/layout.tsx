import { ReactNode } from "react";
import { createClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { AdminSidebar } from "./components/AdminSidebar";
import { AdminTopbar } from "./components/AdminTopbar";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const isSuperAdmin = user.user_metadata?.rol === "super_admin";
  if (!isSuperAdmin) redirect("/dashboard");

  return (
    <div className="flex h-screen bg-zinc-950 text-white font-sans overflow-hidden">
      <AdminSidebar userEmail={user.email || ""} />
      <main className="flex-1 overflow-y-auto relative flex flex-col">
        {/* Topbar sticky */}
        <AdminTopbar />

        {/* Fondo decorativo */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-violet-900/10 to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="p-8 relative z-10 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
