"use client";

import { createClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    toast.loading("Cerrando sesión...", { id: "logout" });
    await supabase.auth.signOut();
    toast.success("Sesión cerrada correctamente", { id: "logout" });
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="w-full px-4 py-2 rounded-lg border border-red-500/30 bg-red-500/5 text-sm text-red-400 font-semibold hover:bg-red-500/20 transition flex justify-center items-center gap-2 group"
    >
      <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      Cerrar Sesión
    </button>
  );
}
