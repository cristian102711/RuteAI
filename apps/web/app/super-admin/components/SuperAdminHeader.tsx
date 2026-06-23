"use client";

import { useState } from "react";
import { Search, Bell, X, ShieldAlert, Cpu, AlertTriangle, LogOut } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { toast } from "sonner";

export function SuperAdminHeader() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [showNotifications, setShowNotifications] = useState(false);

  // Notificaciones mock de auditoría del sistema
  const [notifications, setNotifications] = useState([
    { id: 1, type: "warning", message: "Cervecería Tropical alcanzó 80% de su cuota de plan", time: "Hace 22 min" },
    { id: 2, type: "error", message: "Repuestos Martínez sin actividad por más de 14 días", time: "Hace 1 hora" },
    { id: 3, type: "info", message: "Mercado Andino importó 1.240 pedidos vía API", time: "Hace 4 horas" }
  ]);

  const handleLogout = async () => {
    toast.loading("Cerrando sesión...", { id: "logout" });
    await supabase.auth.signOut();
    toast.success("Sesión cerrada correctamente", { id: "logout" });
    router.push("/login");
    router.refresh();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/super-admin/empresas?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push(`/super-admin/empresas`);
    }
  };

  const removeNotification = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-zinc-800 bg-zinc-950/70 px-5 backdrop-blur-xl">
      
      {/* Search Input */}
      <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar empresas por nombre o país (Presiona Enter)..." 
          className="h-9 w-full rounded-md border border-zinc-800 bg-white/[0.03] pl-9 pr-16 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-shadow"
        />
        <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded border border-zinc-700 bg-zinc-900 px-1.5 py-0.5 text-[10px] text-zinc-400 sm:inline-flex">
          Enter
        </kbd>
      </form>
      
      {/* Notifications & Logout Buttons */}
      <div className="flex items-center gap-2 ml-auto">
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative grid h-9 w-9 place-items-center rounded-md border border-zinc-800 bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Bell className="h-4 w-4" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-zinc-950 animate-pulse" />
            )}
          </button>

          {/* Dropdown de Notificaciones */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-zinc-800 bg-zinc-950 p-4 shadow-2xl z-50">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <span className="text-xs font-semibold text-white uppercase tracking-wider">Alertas de Plataforma</span>
                <button 
                  onClick={() => setShowNotifications(false)}
                  className="text-zinc-500 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              {notifications.length === 0 ? (
                <div className="py-6 text-center text-xs text-zinc-500">
                  No hay notificaciones pendientes.
                </div>
              ) : (
                <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n.id} className="relative flex gap-2.5 rounded-lg bg-white/[0.02] p-2.5 text-xs border border-zinc-900">
                      <div className="mt-0.5">
                        {n.type === "error" ? (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        ) : n.type === "warning" ? (
                          <ShieldAlert className="h-4 w-4 text-amber-500" />
                        ) : (
                          <Cpu className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                      <div className="flex-1 pr-4">
                        <p className="text-zinc-200 leading-relaxed">{n.message}</p>
                        <span className="text-[10px] text-zinc-500 block mt-1">{n.time}</span>
                      </div>
                      <button 
                        onClick={() => removeNotification(n.id)}
                        className="absolute top-2 right-2 text-zinc-600 hover:text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          title="Cerrar sesión"
          className="grid h-9 w-9 place-items-center rounded-md border border-zinc-800 bg-white/[0.03] text-zinc-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
