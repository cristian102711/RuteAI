import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { Map, Truck, Navigation, CheckCircle2, AlertTriangle } from "lucide-react";
import { MapaRutas, MapaPlaceholder } from "../components/MapaRutas";

// Función que convierte una dirección en lat/lng usando Google Geocoding API
async function geocodeDireccion(
  direccion: string,
  apiKey: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const query = encodeURIComponent(direccion + ", Chile");
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${apiKey}`,
      { next: { revalidate: 3600 } } // Cache por 1 hora
    );
    const data = await res.json();
    if (data.status === "OK" && data.results[0]) {
      const { lat, lng } = data.results[0].geometry.location;
      return { lat, lng };
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

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? "";
  const tieneApiKey = apiKey.length > 0;

  // Geocodificar direcciones si hay API Key
  interface Parada {
    id: string;
    lat: number;
    lng: number;
    label: string;
    direccion: string;
    cliente: string;
    index: number;
  }

  let paradas: Parada[] = [];
  if (tieneApiKey && pedidosPendientes.length > 0) {
    const geocodedResults = await Promise.all(
      pedidosPendientes.map(async (pedido, i) => {
        const coords = await geocodeDireccion(pedido.direccion, apiKey);
        if (!coords) return null;
        return {
          id: pedido.id,
          lat: coords.lat,
          lng: coords.lng,
          label: pedido.producto,
          direccion: pedido.direccion,
          cliente: pedido.nombreCliente,
          index: i,
        };
      })
    );
    paradas = geocodedResults.filter((p): p is Parada => p !== null);
  }

  return (
    <div className="font-sans px-2">
      <div className="max-w-[85rem] mx-auto">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-zinc-800/50 pb-6">
          <div className="flex flex-col gap-1">
            <span className="text-blue-400 text-sm font-semibold tracking-widest uppercase mb-1 flex items-center gap-2">
              <Navigation className="w-4 h-4" />
              Logística y Desplazamiento
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-2">
              Rutas{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                Inteligentes
              </span>
            </h1>
            <p className="text-zinc-500/90 text-sm md:text-base max-w-xl">
              {tieneApiKey
                ? `${paradas.length} de ${pedidosPendientes.length} despachos geocodificados y listos en el mapa.`
                : "Configura NEXT_PUBLIC_GOOGLE_MAPS_KEY para activar la geocodificación."}
            </p>
          </div>

          {!tieneApiKey && (
            <div className="mt-4 md:mt-0 flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold px-4 py-2.5 rounded-2xl">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              API Key no configurada
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Manifiesto de Ruta */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-3xl p-6 shadow-xl">
              <h2 className="text-sm font-bold tracking-widest uppercase mb-6 text-zinc-300 flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-400" />
                Manifiesto ({pedidosPendientes.length})
              </h2>

              <div className="flex flex-col gap-0 relative">
                <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-zinc-800/80 z-0" />

                {pedidosPendientes.length === 0 ? (
                  <p className="text-zinc-500 text-sm z-10">
                    No hay despachos pendientes.
                  </p>
                ) : (
                  pedidosPendientes.map((pedido, index) => {
                    const geocodificado = paradas.some(
                      (p) => p.id === pedido.id
                    );
                    return (
                      <div
                        key={pedido.id}
                        className="flex gap-4 relative z-10 group mb-6 last:mb-0"
                      >
                        <div
                          className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors shadow-sm ${
                            geocodificado
                              ? "bg-zinc-950 border-blue-500/70 text-blue-400 group-hover:bg-blue-500 group-hover:text-zinc-950"
                              : "bg-zinc-950 border-zinc-700 text-zinc-600"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div className="flex flex-col pt-1">
                          <h4 className="text-zinc-100 font-bold text-sm leading-none">
                            {pedido.direccion}
                          </h4>
                          <p className="text-zinc-500 text-xs mt-1 font-medium flex items-center gap-1">
                            {pedido.nombreCliente}
                            {!geocodificado && tieneApiKey && (
                              <span className="text-amber-400/70 text-[10px]">
                                (sin geocodificar)
                              </span>
                            )}
                          </p>
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
                      <h4 className="text-emerald-400 font-bold text-sm leading-none">
                        Fin del Recorrido
                      </h4>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mapa Interactivo */}
          <div className="lg:col-span-2 bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-3xl overflow-hidden shadow-xl min-h-[520px] relative">
            {tieneApiKey ? (
              <div className="absolute inset-0">
                <MapaRutas paradas={paradas} apiKey={apiKey} />
              </div>
            ) : (
              <div className="absolute inset-0 bg-zinc-950 bg-[url('/grid.svg')] opacity-30 pointer-events-none" />
            )}

            {!tieneApiKey && <MapaPlaceholder />}

            {tieneApiKey && paradas.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Map className="w-12 h-12 text-blue-400 mx-auto mb-3 opacity-50" />
                  <p className="text-zinc-500 text-sm">
                    No hay direcciones geocodificables en este momento.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
