import { Menu, MapPin, Package, Navigation, Phone, Sparkles, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function RepartidorView() {
  const paradasRestantes = [
    {
      id: 3,
      nombre: "Sofía Hernández",
      direccion: "Av. Santa Fe 1234",
      hora: "11:34"
    },
    {
      id: 4,
      nombre: "Carlos Mendoza",
      direccion: "Av. Javier Prado Este 4200",
      hora: "12:01"
    },
    {
      id: 5,
      nombre: "Valentina Ortiz",
      direccion: "Av. Providencia 2594",
      hora: "12:28"
    },
    {
      id: 6,
      nombre: "Joaquín Vega",
      direccion: "Calle 50, Obarrio",
      hora: "12:55"
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-md bg-zinc-950 min-h-screen relative shadow-2xl">
        
        {/* Cabecera pegajosa */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-4 py-3 backdrop-blur-xl">
          <button className="grid h-9 w-9 place-items-center rounded-md border border-zinc-800 bg-white/5 hover:bg-white/10 transition-colors">
            <Menu className="h-4 w-4" />
          </button>
          <div className="text-xs">
            <span className="text-zinc-500">Ruta de hoy · </span>
            <span className="font-mono text-white">1/6</span>
          </div>
          <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-purple-600 to-amber-500 text-xs font-bold text-white shadow-sm">
            CR
          </div>
        </header>

        <div className="space-y-5 px-4 py-5 pb-10">
          
          {/* Progreso de la ruta */}
          <div className="rounded-xl border border-zinc-800 bg-white/[0.02] p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">Progreso de ruta</span>
              <span className="font-mono text-white">17% · 3 h 14 min restantes</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
              <div className="h-full bg-gradient-to-r from-amber-500 to-purple-500" style={{ width: "16%" }}></div>
            </div>
          </div>

          {/* Tarjeta de Próxima Parada (Glow Effect) */}
          <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-b from-purple-500/[0.08] to-transparent p-5 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-purple-500/20 blur-3xl"></div>
            
            <div className="text-xs font-medium uppercase tracking-widest text-purple-400">
              Próxima parada
            </div>
            
            <div className="mt-3 flex items-start gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-purple-600 text-lg font-bold text-white shadow-md">
                2
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-lg font-semibold leading-tight text-white">
                  Andrés Quintero
                </div>
                <div className="mt-1 flex items-start gap-1.5 text-sm text-zinc-400">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                  <span>Cra. 13 #93-40, Bogotá</span>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between rounded-lg border border-zinc-800/50 bg-black/40 px-3 py-2.5 text-xs">
              <div>
                <span className="text-zinc-500">ETA</span>
                <div className="font-mono text-base text-white">11:08</div>
              </div>
              <div>
                <span className="text-zinc-500">Distancia</span>
                <div className="font-mono text-base text-white">2.4 km</div>
              </div>
              <div>
                <span className="text-zinc-500">Producto</span>
                <div className="text-white flex items-center gap-1 mt-0.5">
                  <Package className="h-3.5 w-3.5 text-amber-500" /> 1 ud
                </div>
              </div>
            </div>

            {/* Acciones de la parada */}
            <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-amber-500 py-4 text-base font-bold text-white active:scale-[0.98] transition-transform shadow-lg">
              <Navigation className="h-5 w-5" /> Abrir en Google Maps
            </button>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <button className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-700 bg-white/5 py-2.5 text-sm hover:bg-white/10 transition-colors text-white">
                <Navigation className="h-4 w-4" /> Waze
              </button>
              <button className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-700 bg-white/5 py-2.5 text-sm hover:bg-white/10 transition-colors text-white">
                <Phone className="h-4 w-4" /> Llamar
              </button>
            </div>

            <button className="mt-3 w-full rounded-lg bg-white/5 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition-colors border border-transparent">
              Confirmar entrega
            </button>
          </div>

          {/* Tip de la IA */}
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-3 shadow-inner">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <div className="text-xs">
              <div className="font-medium text-amber-400">Tip de la IA</div>
              <div className="text-zinc-400 mt-0.5 leading-relaxed">
                Edificio con portería en sótano. Llamar al timbre 2B antes de entrar.
              </div>
            </div>
          </div>

          {/* Resto de la ruta */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Restantes en tu ruta</h3>
              <span className="text-xs text-zinc-500">4 paradas</span>
            </div>
            
            <ul className="space-y-2">
              {paradasRestantes.map((parada) => (
                <li key={parada.id} className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-white/[0.02] p-3 active:bg-white/[0.04] transition-colors cursor-pointer group">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/5 text-xs font-bold text-zinc-500 ring-1 ring-inset ring-white/10 group-hover:text-white transition-colors">
                    {parada.id}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">
                      {parada.nombre}
                    </div>
                    <div className="truncate text-xs text-zinc-500 mt-0.5">
                      {parada.direccion}
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div className="text-xs font-mono text-zinc-400">{parada.hora}</div>
                    <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                  </div>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}
