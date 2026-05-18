import { createClient } from "@/lib/supabaseServer";
import { Shield, Bell, Database, Globe, Lock, ChevronRight } from "lucide-react";

export default async function AdminConfiguracionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const configSections = [
    {
      icon: Shield,
      color: "violet",
      title: "Seguridad",
      description: "Gestión de accesos y autenticación",
      items: [
        { label: "Autenticación",     value: "Supabase Auth — JWT + Row Level Security", badge: "ACTIVO" },
        { label: "Sesiones activas",  value: "Tokens de 1 hora + refresh automático",    badge: "ACTIVO" },
        { label: "2FA",               value: "No configurado",                            badge: "PENDIENTE" },
      ],
    },
    {
      icon: Database,
      color: "blue",
      title: "Base de Datos",
      description: "Configuración de Prisma y PostgreSQL",
      items: [
        { label: "ORM",               value: "Prisma v5.22 con PostgreSQL",               badge: "CONECTADO" },
        { label: "Proveedor",         value: "Supabase PostgreSQL",                        badge: "ACTIVO" },
        { label: "Migraciones",       value: "SQL Manual — schema.prisma sincronizado",   badge: "OK" },
      ],
    },
    {
      icon: Globe,
      color: "emerald",
      title: "Microservicios",
      description: "Estado de los servicios backend",
      items: [
        { label: "Auth Service",      value: "localhost:3002 — Express + Supabase",       badge: "LOCAL" },
        { label: "Core Service",      value: "localhost:3003 — Express + Prisma",         badge: "LOCAL" },
        { label: "AI Service",        value: "localhost:3001 — Algoritmo de rutas",       badge: "LOCAL" },
      ],
    },
    {
      icon: Bell,
      color: "amber",
      title: "Notificaciones",
      description: "Sistema de alertas y toasts",
      items: [
        { label: "Toast UI",          value: "Sonner — Dark mode habilitado",             badge: "ACTIVO" },
        { label: "Alertas en BD",     value: "Modelo Alerta en Prisma",                  badge: "ACTIVO" },
        { label: "Push Notificaciones", value: "No configurado",                          badge: "PENDIENTE" },
      ],
    },
  ];

  const badgeColors: Record<string, string> = {
    "ACTIVO":    "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    "CONECTADO": "bg-blue-500/10 text-blue-400 border-blue-500/30",
    "LOCAL":     "bg-amber-500/10 text-amber-400 border-amber-500/30",
    "OK":        "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    "PENDIENTE": "bg-zinc-700/50 text-zinc-400 border-zinc-600/50",
  };

  const iconColors: Record<string, string> = {
    violet: "bg-violet-600/20 border-violet-500/30 text-violet-400",
    blue:   "bg-blue-600/20 border-blue-500/30 text-blue-400",
    emerald:"bg-emerald-600/20 border-emerald-500/30 text-emerald-400",
    amber:  "bg-amber-600/20 border-amber-500/30 text-amber-400",
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-violet-400 text-sm font-bold tracking-widest uppercase mb-1 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
          Panel de Control
        </p>
        <h1 className="text-4xl font-extrabold tracking-tight text-white">
          Configuración{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-blue-400">
            del Sistema
          </span>
        </h1>
        <p className="text-zinc-500 text-sm mt-2">
          Estado técnico y configuración global de RouteAI
        </p>
      </div>

      {/* Perfil del Super Admin */}
      <div className="rounded-2xl border border-violet-500/20 bg-violet-600/5 p-6 flex items-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-xl font-black text-violet-400 uppercase">
          {user?.email?.charAt(0) ?? "S"}
        </div>
        <div className="flex-1">
          <p className="font-bold text-white text-lg">{user?.email}</p>
          <p className="text-xs text-violet-400 font-bold tracking-widest uppercase mt-0.5">Super Administrador del Sistema</p>
          <p className="text-xs text-zinc-500 mt-1 font-mono">ID: {user?.id?.slice(0, 16)}...</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600/20 border border-violet-500/30">
          <Lock className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-bold text-violet-300 uppercase tracking-wider">Acceso Total</span>
        </div>
      </div>

      {/* Secciones de configuración */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {configSections.map((section) => {
          const Icon = section.icon;
          const colorClass = iconColors[section.color];
          return (
            <div key={section.title} className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 overflow-hidden">
              {/* Cabecera sección */}
              <div className="px-6 py-4 border-b border-zinc-800 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${colorClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">{section.title}</h2>
                  <p className="text-[11px] text-zinc-500">{section.description}</p>
                </div>
              </div>

              {/* Items */}
              <div className="divide-y divide-zinc-800/40">
                {section.items.map((item) => (
                  <div key={item.label} className="px-6 py-4 flex items-center justify-between hover:bg-zinc-800/20 transition-colors group cursor-default">
                    <div className="flex-1 min-w-0 mr-4">
                      <p className="text-xs font-semibold text-zinc-300">{item.label}</p>
                      <p className="text-[11px] text-zinc-500 mt-0.5 truncate">{item.value}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-widest ${badgeColors[item.badge] ?? badgeColors.PENDIENTE}`}>
                        {item.badge}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-700 group-hover:text-zinc-500 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info de versión */}
      <div className="rounded-2xl border border-zinc-800/40 bg-zinc-900/20 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
            <span className="text-sm font-black text-zinc-400">R</span>
          </div>
          <div>
            <p className="text-sm font-bold text-zinc-300">RouteAI v1.0.0</p>
            <p className="text-[11px] text-zinc-600">Next.js 16 · Prisma 5 · Supabase · TypeScript</p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase tracking-widest">
          Producción lista
        </span>
      </div>
    </div>
  );
}
