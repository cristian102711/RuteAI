import { Building2, TrendingUp, Users, Package, DollarSign, Activity } from "lucide-react";

export default function SuperAdminDashboard() {
  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Header Section */}
      <div>
        <div className="text-xs uppercase tracking-widest text-purple-500">Visión global</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">Buenos días, Julián.</h1>
        <p className="mt-1 text-sm text-zinc-400">Hoy la red procesó 2.418 entregas en 7 países.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* Tenants */}
        <div className="rounded-xl border border-zinc-800 bg-white/[0.02] p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-400">
              <Building2 className="h-3.5 w-3.5" /> Tenants activos
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-500">
              <TrendingUp className="h-3 w-3" /> +2 esta semana
            </span>
          </div>
          <div className="mt-3 text-3xl font-semibold tabular-nums text-white">6</div>
        </div>

        {/* Users */}
        <div className="rounded-xl border border-zinc-800 bg-white/[0.02] p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-400">
              <Users className="h-3.5 w-3.5" /> Usuarios totales
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-500">
              <TrendingUp className="h-3 w-3" /> +18%
            </span>
          </div>
          <div className="mt-3 text-3xl font-semibold tabular-nums text-white">136</div>
        </div>

        {/* Entregas */}
        <div className="rounded-xl border border-zinc-800 bg-white/[0.02] p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-400">
              <Package className="h-3.5 w-3.5" /> Entregas / mes
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-500">
              <TrendingUp className="h-3 w-3" /> +11%
            </span>
          </div>
          <div className="mt-3 text-3xl font-semibold tabular-nums text-white">50.155</div>
        </div>

        {/* MRR */}
        <div className="rounded-xl border border-zinc-800 bg-white/[0.02] p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-400">
              <DollarSign className="h-3.5 w-3.5" /> MRR
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-500">
              <TrendingUp className="h-3 w-3" /> +9.4%
            </span>
          </div>
          <div className="mt-3 text-3xl font-semibold tabular-nums text-white">$48.2K</div>
        </div>

      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Entregas Globales Chart */}
        <div className="rounded-xl border border-zinc-800 bg-white/[0.02] p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Entregas globales · últimos 14 días</h3>
              <p className="text-xs text-zinc-400">Suma de todos los tenants</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-current"></span>Estable
            </span>
          </div>
          <svg viewBox="0 0 320 100" className="mt-5 h-40 w-full">
            <defs>
              <linearGradient id="spk" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.5"></stop>
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0"></stop>
              </linearGradient>
            </defs>
            <line x1="0" y1="20" x2="320" y2="20" stroke="rgba(255,255,255,0.05)"></line>
            <line x1="0" y1="40" x2="320" y2="40" stroke="rgba(255,255,255,0.05)"></line>
            <line x1="0" y1="60" x2="320" y2="60" stroke="rgba(255,255,255,0.05)"></line>
            <line x1="0" y1="80" x2="320" y2="80" stroke="rgba(255,255,255,0.05)"></line>
            <polyline fill="none" stroke="#f59e0b" strokeWidth="2" points="0,72.6 24.6,66.7 49.2,68.6 73.8,60.8 98.4,62.1 123,53 147.6,54.3 172.3,44.5 196.9,46.5 221.5,37.3 246.1,38.6 270.7,29.5 295.3,21 320,10"></polyline>
            <polygon fill="url(#spk)" points="0,100 0,72.6 24.6,66.7 49.2,68.6 73.8,60.8 98.4,62.1 123,53 147.6,54.3 172.3,44.5 196.9,46.5 221.5,37.3 246.1,38.6 270.7,29.5 295.3,21 320,10 320,100"></polygon>
          </svg>
        </div>

        {/* Plataforma Salud */}
        <div className="rounded-xl border border-zinc-800 bg-white/[0.02] p-5">
          <h3 className="text-sm font-semibold text-white">Plataforma</h3>
          <p className="text-xs text-zinc-400">Salud del sistema</p>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-center justify-between">
              <span className="text-zinc-400">API Gateway</span>
              <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-current"></span>p95 124 ms
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-zinc-400">Optimizador IA</span>
              <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-current"></span>p95 812 ms
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-zinc-400">GPS ingest</span>
              <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-current"></span>98.97%
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-zinc-400">Webhooks</span>
              <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium bg-amber-500/10 text-amber-500 ring-1 ring-inset ring-amber-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-current"></span>2 reintentos
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Actividad Reciente */}
      <div className="rounded-xl border border-zinc-800 bg-white/[0.02]">
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Actividad reciente</h3>
            <p className="text-xs text-zinc-400">Eventos críticos de los tenants</p>
          </div>
          <Activity className="h-4 w-4 text-zinc-500" />
        </div>
        <ul className="divide-y divide-zinc-800">
          <li className="flex items-center justify-between px-5 py-3 text-sm">
            <div>
              <span className="font-medium text-white">Mercado Andino</span> <span className="text-zinc-400">subió 1.240 pedidos vía API</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium bg-blue-500/10 text-blue-400 ring-1 ring-inset ring-blue-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-current"></span>evento
              </span>
              <span className="text-xs text-zinc-500">hace 4 min</span>
            </div>
          </li>
          <li className="flex items-center justify-between px-5 py-3 text-sm">
            <div>
              <span className="font-medium text-white">Cervecería Tropical</span> <span className="text-zinc-400">alcanzó 80% de su cuota Business</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium bg-amber-500/10 text-amber-500 ring-1 ring-inset ring-amber-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-current"></span>evento
              </span>
              <span className="text-xs text-zinc-500">hace 22 min</span>
            </div>
          </li>
          <li className="flex items-center justify-between px-5 py-3 text-sm">
            <div>
              <span className="font-medium text-white">Repuestos Martínez</span> <span className="text-zinc-400">sin actividad por 14 días</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium bg-red-500/10 text-red-400 ring-1 ring-inset ring-red-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-current"></span>evento
              </span>
              <span className="text-xs text-zinc-500">ahora</span>
            </div>
          </li>
          <li className="flex items-center justify-between px-5 py-3 text-sm">
            <div>
              <span className="font-medium text-white">Sushi Express MX</span> <span className="text-zinc-400">actualizó modelo IA a v2.1</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium bg-purple-500/10 text-purple-400 ring-1 ring-inset ring-purple-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-current"></span>evento
              </span>
              <span className="text-xs text-zinc-500">hace 1 h</span>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}
