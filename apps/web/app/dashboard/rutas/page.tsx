import prisma from "@ruteai/database";
import { createClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { Layers, Maximize2, Navigation, Sparkles } from "lucide-react";

export default async function RutasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const usuarioDB = await prisma.usuario.findUnique({
    where: { id: user.id },
    include: { empresa: true },
  });

  if (!usuarioDB || !usuarioDB.empresa) {
    redirect("/login");
  }

  const paradas = [
    {
      id: 1,
      cliente: "María Fernanda Castillo",
      hora: "10:42",
      direccion: "Av. Insurgentes Sur 1602",
      status: "completada",
      posLeft: "26%",
      posTop: "58%"
    },
    {
      id: 2,
      cliente: "Andrés Quintero",
      hora: "11:08",
      direccion: "Cra. 13 #93-40",
      status: "en_curso",
      tiempoRestante: "4 min restantes",
      posLeft: "40%",
      posTop: "70%"
    },
    {
      id: 3,
      cliente: "Sofía Hernández",
      hora: "11:34",
      direccion: "Av. Santa Fe 1234",
      status: "pendiente",
      posLeft: "55%",
      posTop: "44%"
    },
    {
      id: 4,
      cliente: "Carlos Mendoza",
      hora: "12:01",
      direccion: "Av. Javier Prado Este 4200",
      status: "pendiente",
      posLeft: "68%",
      posTop: "60%"
    },
    {
      id: 5,
      cliente: "Valentina Ortiz",
      hora: "12:28",
      direccion: "Av. Providencia 2594",
      status: "pendiente",
      posLeft: "82%",
      posTop: "32%"
    },
    {
      id: 6,
      cliente: "Joaquín Vega",
      hora: "12:55",
      direccion: "Calle 50, Obarrio",
      status: "pendiente",
      posLeft: "90%",
      posTop: "18%"
    }
  ];

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-zinc-950 overflow-hidden">
      
      {/* Vista Principal - Mapa SVG Simulado */}
      <div className="relative flex-1">
        <div className="relative overflow-hidden bg-white/5 backdrop-blur-xl h-full w-full rounded-none border-0">
          
          {/* Fondos */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
          <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl"></div>
          <div className="absolute -bottom-20 -right-10 h-72 w-72 rounded-full bg-amber-500/20 blur-3xl"></div>
          
          {/* Líneas de cuadrícula y ruta */}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full opacity-30">
            <path d="M0,82 L100,82" stroke="rgba(255,255,255,0.08)" strokeWidth="0.3"></path>
            <path d="M0,46 L100,46" stroke="rgba(255,255,255,0.08)" strokeWidth="0.3"></path>
            <path d="M22,0 L22,100" stroke="rgba(255,255,255,0.08)" strokeWidth="0.3"></path>
            <path d="M58,0 L58,100" stroke="rgba(255,255,255,0.08)" strokeWidth="0.3"></path>
            <path d="M84,0 L84,100" stroke="rgba(255,255,255,0.08)" strokeWidth="0.3"></path>
          </svg>
          
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
            <defs>
              <linearGradient id="routeGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#f59e0b"></stop>
                <stop offset="100%" stopColor="#a855f7"></stop>
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="1.2"></feGaussianBlur>
              </filter>
            </defs>
            <path d="M12,78 C20,68 22,62 26,58 S36,72 40,70 S52,48 55,44 S64,58 68,60 S78,38 82,32 S88,22 90,18" fill="none" stroke="url(#routeGrad)" strokeWidth="0.7" filter="url(#glow)" opacity="0.7"></path>
            <path d="M12,78 C20,68 22,62 26,58 S36,72 40,70 S52,48 55,44 S64,58 68,60 S78,38 82,32 S88,22 90,18" fill="none" stroke="url(#routeGrad)" strokeWidth="0.4" strokeDasharray="1.5 1.2"></path>
            <circle r="0.9" fill="#f59e0b">
              <animateMotion dur="6s" repeatCount="indefinite" path="M12,78 C20,68 22,62 26,58 S36,72 40,70 S52,48 55,44 S64,58 68,60 S78,38 82,32 S88,22 90,18"></animateMotion>
            </circle>
          </svg>

          {/* Marcadores de paradas */}
          <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: "12%", top: "78%" }}>
            <div className="relative h-3 w-3 rounded-full ring-2 bg-amber-500 ring-amber-500/30">
              <span className="absolute inset-0 rounded-full animate-ping bg-amber-500/60"></span>
            </div>
            <div className="absolute left-4 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-zinc-900/80 px-1.5 py-0.5 text-[10px] font-medium text-white ring-1 ring-white/10 backdrop-blur">
              Depósito
            </div>
          </div>

          {paradas.map(p => {
            const isCompleted = p.status === "completada";
            const isInProgress = p.status === "en_curso";
            const colorClass = isCompleted ? "bg-purple-500 ring-purple-500/30" : isInProgress ? "bg-amber-500 ring-amber-500/30" : "bg-white ring-white/20";
            const pingClass = isCompleted ? "bg-purple-500/60" : isInProgress ? "bg-amber-500/60" : "bg-white/30";
            
            return (
              <div key={p.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: p.posLeft, top: p.posTop }}>
                <div className={`relative h-3 w-3 rounded-full ring-2 ${colorClass}`}>
                  <span className={`absolute inset-0 rounded-full animate-ping ${pingClass}`}></span>
                </div>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-zinc-900/80 px-1.5 py-0.5 text-[10px] font-medium text-white ring-1 ring-white/10 backdrop-blur">
                  {p.cliente.split(' ').pop()}
                </div>
              </div>
            );
          })}

          {/* Botones de Control de Mapa */}
          <div className="absolute left-4 top-4 flex flex-col gap-2">
            <button className="grid h-9 w-9 place-items-center rounded-md bg-white/5 backdrop-blur-md text-white hover:bg-white/10 transition-colors border border-white/5">
              <Layers className="h-4 w-4" />
            </button>
            <button className="grid h-9 w-9 place-items-center rounded-md bg-white/5 backdrop-blur-md text-white hover:bg-white/10 transition-colors border border-white/5">
              <Maximize2 className="h-4 w-4" />
            </button>
            <button className="grid h-9 w-9 place-items-center rounded-md bg-white/5 backdrop-blur-md text-white hover:bg-white/10 transition-colors border border-white/5">
              <Navigation className="h-4 w-4" />
            </button>
          </div>

          {/* Overlay Inferior */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-xl bg-zinc-900/60 backdrop-blur-lg border border-white/5 px-4 py-2.5 text-xs">
            <div className="flex items-center gap-4">
              <span className="text-zinc-400">Distancia total: <span className="font-mono text-white">42.8 km</span></span>
              <span className="text-zinc-400">Tiempo: <span className="font-mono text-white">3 h 14 min</span></span>
              <span className="text-zinc-400">Combustible: <span className="font-mono text-white">3.2 L</span></span>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded bg-purple-500/15 px-2 py-0.5 font-semibold text-purple-400 ring-1 ring-inset ring-purple-500/20">
              <Sparkles className="h-3 w-3" /> Optimizada por IA · ahorro 22%
            </span>
          </div>

        </div>
      </div>
      
      {/* Sidebar Derecha - Timeline de la Ruta */}
      <aside className="hidden w-[380px] shrink-0 flex-col border-l border-zinc-800 bg-zinc-950/50 backdrop-blur-xl lg:flex z-10 shadow-2xl">
        <div className="border-b border-zinc-800 p-5">
          <div className="text-xs uppercase tracking-widest text-amber-500 font-bold">Ruta de hoy</div>
          <h2 className="mt-1 text-xl font-semibold text-white">Camila Ríos · Bogotá Norte</h2>
          <p className="mt-1 text-xs text-zinc-400">6 paradas · iniciada 09:48</p>
          <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-400 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:opacity-90 transition-opacity">
            <Sparkles className="h-4 w-4" /> Re-optimizar con IA
          </button>
        </div>

        <ol className="flex-1 overflow-y-auto p-3 relative space-y-1 scrollbar-hide">
          {paradas.map((p, index) => {
            const isCompleted = p.status === "completada";
            const isInProgress = p.status === "en_curso";
            
            return (
              <li key={p.id} className="relative flex gap-3 rounded-lg p-3 hover:bg-white/[0.03] transition-colors group">
                {/* Línea conectora */}
                {index !== paradas.length - 1 && (
                  <div className="absolute left-[1.85rem] top-10 bottom-0 w-px bg-zinc-800"></div>
                )}
                
                {/* Punto indicador */}
                <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold z-10 ${
                  isCompleted ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-inset ring-emerald-500/30" : 
                  isInProgress ? "bg-amber-500 text-white shadow-[0_0_10px_rgba(245,158,11,0.5)]" : 
                  "bg-white/5 text-zinc-500 ring-1 ring-inset ring-white/10 group-hover:text-zinc-300"
                }`}>
                  {p.id}
                </div>
                
                {/* Contenido parada */}
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex items-center justify-between">
                    <div className={`truncate text-sm font-medium ${isCompleted || isInProgress ? 'text-white' : 'text-zinc-300'}`}>
                      {p.cliente}
                    </div>
                    <div className="text-xs font-mono text-zinc-500">{p.hora}</div>
                  </div>
                  <div className="truncate text-xs text-zinc-400 mt-0.5">{p.direccion}</div>
                  
                  {isInProgress && (
                    <div className="mt-2.5 inline-flex items-center gap-1.5 rounded bg-purple-500/15 px-2 py-0.5 text-[10px] font-semibold text-purple-400 ring-1 ring-inset ring-purple-500/20">
                      En curso · {p.tiempoRestante}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </aside>

    </div>
  );
}
