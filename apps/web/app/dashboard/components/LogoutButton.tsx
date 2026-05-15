"use client";

import { createClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogOut } from "lucide-react";

interface LogoutButtonProps {
  compact?: boolean;
}

export function LogoutButton({ compact = false }: LogoutButtonProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    toast.loading("Cerrando sesión...", { id: "logout" });
    await supabase.auth.signOut();
    toast.success("Sesión cerrada correctamente", { id: "logout" });
    router.push("/login");
    router.refresh();
  };

  if (compact) {
    return (
      <button
        onClick={handleLogout}
        title="Cerrar sesión"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-all hover:bg-red-500/10 hover:text-red-400"
      >
        <LogOut className="h-3.5 w-3.5" />
      </button>
    );
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full px-4 py-2 rounded-xl border border-red-500/20 bg-red-500/5 text-sm text-red-400/80 font-semibold hover:bg-red-500/15 hover:text-red-400 transition-all flex justify-center items-center gap-2 group"
    >
      <LogOut className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
      Cerrar Sesión
    </button>
  );
}
