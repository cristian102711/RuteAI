import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { Truck, Navigation, CheckCircle2 } from "lucide-react";
import { MapaRutas, MapaPlaceholder, type Parada } from "../components/MapaRutas";

// Geocodificación gratuita con Nominatim (OpenStreetMap) — sin API key
async function geocodeDireccion(
  direccion: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const query = encodeURIComponent(direccion + ", Chile");
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
      {
        headers: {
          // Nominatim requiere un User-Agent identificable
          "User-Agent": "RouteAI-App/1.0 (contact@ruteai.com)",
        },
        next: { revalidate: 3600 }, // Cache por 1 hora
      }
    );
    const data = await res.json();
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
    return null;
  } catch {
    return null;
  }
}

export default async function RutasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const usuarioDB = await prisma.usuario.findUnique({
    where: { id: user.id },
    include: { empresa: true },
  });

  if (!usuarioDB || !usuarioDB.empresa) redirect("/dashboard");

  const pedidosPendientes = await prisma.pedido.findMany({
    where: { empresaId: usuarioDB.empresa.id, estado: "pendiente" },
    orderBy: { createdAt: "asc" },
  });

  // Geocodificar con Nominatim — sin API key, completamente gratis
  let paradas: Parada[] = [];
  if (pedidosPendientes.length > 0) {
    const results = await Promise.all(
      pedidosPendientes.map(async (pedido, i) => {
        const coords = await geocodeDireccion(pedido.direccion);
        if (!coords) return null;
        return {
          id: pedido.id,
          lat: coords.lat,
          lng: coords.lng,
          label: pedido.producto,
          direccion: pedido.direccion,
          cliente: pedido.nombreCliente,
          index: i,
        } satisfies Parada;
      })
    );
    paradas = results.filter((p): p is Parada => p !== null);
  }

  return (
    <div className="font-sans px-2">
      <div className="max-w-[85rem] mx-auto">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-zinc-800/50 pb-6">
          <div className="flex flex-col gap-1">
            <span className="text-blue-400 text-sm font-semibold tracking-widest uppercase mb-1 flex items-center gap-2">
              <Navigation className="w-4 h-4" />
              OpenStreetMap · Nominatim
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-2">
              Rutas{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                Inteligentes
              </span>
            </h1>
            <p className="text-zinc-500/90 text-sm md:text-base max-w-xl">
              {paradas.length > 0
                ? `${paradas.length} de ${pedidosPendientes.length} despachos geocodificados en el mapa.`
                : pedidosPendientes.length === 0
                ? "No hay despachos pendientes para mapear."
                : "Geocodificando direcciones con OpenStreetMap..."}
            </p>
          </div>

          <div className="mt-4 md:mt-0 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold px-4 py-2.5 rounded-2xl">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            OpenStreetMap · Sin API Key
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Manifiesto de Ruta */}
          <div className="lg:col-span-1">
            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-3xl p-6 shadow-xl">
              <h2 className="text-sm font-bold tracking-widest uppercase mb-6 text-zinc-300 flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-400" />
                Manifiesto ({pedidosPendientes.length})
              </h2>

              <div className="flex flex-col gap-0 relative">
                <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-zinc-800/80 z-0" />

                {pedidosPendientes.length === 0 ? (
                  <p className="text-zinc-500 text-sm">No hay despachos pendientes.</p>
                ) : (
                  pedidosPendientes.map((pedido, index) => {
                    const geocodificado = paradas.some((p) => p.id === pedido.id);
                    return (
                      <div key={pedido.id} className="flex gap-4 relative z-10 group mb-6 last:mb-0">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors ${
                          geocodificado
                            ? "bg-zinc-950 border-blue-500/70 text-blue-400 group-hover:bg-blue-500 group-hover:text-white"
                            : "bg-zinc-950 border-zinc-700 text-zinc-600"
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex flex-col pt-1">
                          <h4 className="text-zinc-100 font-bold text-sm leading-snug">{pedido.direccion}</h4>
                          <p className="text-zinc-500 text-xs mt-0.5">{pedido.nombreCliente}</p>
                          {!geocodificado && (
                            <p className="text-amber-400/70 text-[10px] mt-0.5 flex items-center gap-1">
                              ⚠ Dirección no encontrada en OSM
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

                {pedidosPendientes.length > 0 && (
                  <div className="flex gap-4 relative z-10 mt-6">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-950 border-2 border-emerald-500/50 flex items-center justify-center text-emerald-500">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col pt-1.5">
                      <h4 className="text-emerald-400 font-bold text-sm">Fin del Recorrido</h4>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mapa Leaflet */}
          <div className="lg:col-span-2 bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-3xl overflow-hidden shadow-xl min-h-[520px] relative">
            {paradas.length > 0 ? (
              <div className="absolute inset-0">
                <MapaRutas paradas={paradas} />
              </div>
            ) : (
              <MapaPlaceholder
                mensaje={
                  pedidosPendientes.length === 0
                    ? "Sin despachos para mapear"
                    : "No se pudieron geocodificar las direcciones"
                }
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
