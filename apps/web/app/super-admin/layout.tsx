import { SuperAdminSidebar } from "./components/SuperAdminSidebar";
import { SuperAdminHeader } from "./components/SuperAdminHeader";
import { createClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const rol = user.user_metadata?.rol;
  if (rol !== "super_admin") {
    if (rol === "repartidor") {
      redirect("/repartidor/dashboard");
    } else {
      redirect("/dashboard");
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-zinc-950 text-zinc-100">
      <SuperAdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <SuperAdminHeader />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
