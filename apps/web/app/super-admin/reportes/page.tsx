export default function SuperAdminReportes() {
  const chartData = [
    { mes: "Ene", success: 88, fail: 12 },
    { mes: "Feb", success: 90, fail: 10 },
    { mes: "Mar", success: 91, fail: 9 },
    { mes: "Abr", success: 93, fail: 7 },
    { mes: "May", success: 92, fail: 8 },
    { mes: "Jun", success: 95, fail: 5 },
    { mes: "Jul", success: 96, fail: 4 },
    { mes: "Ago", success: 97, fail: 3 },
  ];

  const ranking = [
    { id: 1, nombre: "Mercado Andino", pais: "Colombia", tiempo: "hace 4 min", vol: 18420, pct: 100, color: "bg-amber-500", glow: "shadow-[0_0_10px_rgba(245,158,11,0.6)]" },
    { id: 2, nombre: "Cervecería Tropical", pais: "Panamá", tiempo: "hace 8 min", vol: 12780, pct: 69.3, color: "bg-amber-500", glow: "shadow-[0_0_10px_rgba(245,158,11,0.6)]" },
    { id: 3, nombre: "Sushi Express MX", pais: "México", tiempo: "hace 1 h", vol: 9085, pct: 49.3, color: "bg-amber-500", glow: "shadow-[0_0_10px_rgba(245,158,11,0.6)]" },
    { id: 4, nombre: "Farmacias del Pacífico", pais: "Chile", tiempo: "hace 12 min", vol: 6210, pct: 33.7, color: "bg-amber-500", glow: "shadow-[0_0_10px_rgba(245,158,11,0.6)]" },
    { id: 5, nombre: "Petfood Andes", pais: "Ecuador", tiempo: "hace 2 días", vol: 3120, pct: 16.9, color: "bg-red-500", glow: "shadow-[0_0_10px_rgba(239,68,68,0.6)]" },
    { id: 6, nombre: "Floristería Camelia", pais: "Perú", tiempo: "hace 3 h", vol: 540, pct: 2.9, color: "bg-amber-500", glow: "shadow-[0_0_10px_rgba(245,158,11,0.6)]" },
    { id: 7, nombre: "Repuestos Martínez", pais: "Argentina", tiempo: "hace 14 días", vol: 0, pct: 0, color: "bg-red-500", glow: "shadow-[0_0_10px_rgba(239,68,68,0.6)]" },
  ];

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div>
        <div className="text-xs uppercase tracking-widest text-purple-500">Analítica</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">Reportes globales</h1>
        <p className="mt-1 text-sm text-zinc-400">Salud agregada de toda la plataforma.</p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-white/[0.02] p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Tasa de éxito vs fallo · 8 meses</h3>
            <p className="text-xs text-zinc-400">Suma de todos los tenants</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-300">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-purple-500"></span> Éxito
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-red-500"></span> Fallido
            </span>
          </div>
        </div>
        
        {/* Gráfico de barras apiladas */}
        <div className="mt-6 flex h-64 items-end gap-3">
          {chartData.map((col, idx) => (
            <div key={idx} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-full w-full flex-col justify-end overflow-hidden rounded-md ring-1 ring-inset ring-white/5 bg-white/5">
                {/* Porcentaje Fallido */}
                <div className="bg-red-500/80 w-full transition-all duration-500" style={{ height: `${col.fail}%` }} title={`Fallido ${col.fail}%`}></div>
                {/* Porcentaje Éxito */}
                <div className="bg-gradient-to-t from-amber-500 to-purple-600 w-full transition-all duration-500" style={{ height: `${col.success}%` }} title={`Éxito ${col.success}%`}></div>
              </div>
              <div className="text-[11px] text-zinc-400 font-mono">{col.mes}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tarjetas de Salud */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-white/[0.02] p-5">
          <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-current"></span>Empresas en verde
          </span>
          <div className="mt-3 text-4xl font-semibold tabular-nums text-white">0</div>
          <div className="mt-1 text-xs text-zinc-500">según última actividad</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-white/[0.02] p-5">
          <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium bg-amber-500/10 text-amber-500 ring-1 ring-inset ring-amber-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-current"></span>En amarillo
          </span>
          <div className="mt-3 text-4xl font-semibold tabular-nums text-white">5</div>
          <div className="mt-1 text-xs text-zinc-500">según última actividad</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-white/[0.02] p-5">
          <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium bg-red-500/10 text-red-400 ring-1 ring-inset ring-red-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-current"></span>En rojo
          </span>
          <div className="mt-3 text-4xl font-semibold tabular-nums text-white">2</div>
          <div className="mt-1 text-xs text-zinc-500">según última actividad</div>
        </div>
      </div>

      {/* Ranking de actividad */}
      <div className="rounded-xl border border-zinc-800 bg-white/[0.02]">
        <div className="border-b border-zinc-800 px-5 py-4">
          <h3 className="text-sm font-semibold text-white">Ranking de actividad</h3>
          <p className="text-xs text-zinc-400">Empresas ordenadas por volumen mensual</p>
        </div>
        <ul className="divide-y divide-zinc-800">
          {ranking.map((item) => (
            <li key={item.id} className="flex items-center gap-4 px-5 py-3 hover:bg-white/[0.02] transition-colors">
              <div className="w-6 font-mono text-xs text-zinc-500">#{item.id}</div>
              <div className="grid h-3 w-3 place-items-center">
                <span className={`h-2.5 w-2.5 rounded-full ${item.color} ${item.glow}`}></span>
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm text-white">{item.nombre}</div>
                <div className="text-xs text-zinc-500">{item.pais} · {item.tiempo}</div>
              </div>
              <div className="hidden w-48 sm:block">
                <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full bg-gradient-to-r from-amber-500 to-purple-500" style={{ width: `${item.pct}%` }}></div>
                </div>
              </div>
              <div className="w-24 text-right tabular-nums text-sm text-zinc-300">
                {item.vol.toLocaleString('es-CO')}
              </div>
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}
