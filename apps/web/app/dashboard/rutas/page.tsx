import prisma from "@ruteai/database";
import { createClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { Truck, Navigation, CheckCircle2 } from "lucide-react";
import { MapaRutas, MapaPlaceholder, type Parada } from "../components/MapaRutas";
import { SimuladorRuta } from "../components/SimuladorRuta";

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
    <div className="px-2 pb-10">
      <div className="max-w-[85rem] mx-auto">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-border-ui pb-8">
          <div className="flex flex-col gap-1.5">
            <span className="text-blue-500 text-xs font-bold tracking-[0.2em] uppercase mb-1 flex items-center gap-2">
              <Navigation className="w-4 h-4" />
              Logística Inteligente
            </span>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground mb-2">
              Rutas <span className="text-blue-600 dark:text-blue-400">Dinámicas</span>
            </h1>
            <p className="text-muted-foreground text-sm font-medium max-w-xl">
              {paradas.length > 0
                ? `${paradas.length} de ${pedidosPendientes.length} paradas geocodificadas con OpenStreetMap.`
                : pedidosPendientes.length === 0
                ? "No hay despachos pendientes para mapear."
                : "Geocodificando direcciones en tiempo real..."}
            </p>
          </div>

          <div className="mt-4 md:mt-0 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-4 py-2.5 rounded-2xl shadow-sm">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Sin API Key · OSM
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Manifiesto de Ruta */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border-ui rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
              <h2 className="text-[10px] font-bold tracking-widest uppercase mb-6 text-muted-foreground flex items-center gap-2">
                <Truck className="w-4 h-4 text-primary" />
                Manifiesto ({pedidosPendientes.length})
              </h2>

              <div className="flex flex-col gap-0 relative">
                <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-border-ui/50 z-0" />

                {pedidosPendientes.length === 0 ? (
                  <p className="text-muted-foreground text-sm font-medium">No hay despachos pendientes.</p>
                ) : (
                  pedidosPendientes.map((pedido, index) => {
                    const geocodificado = paradas.some((p) => p.id === pedido.id);
                    return (
                      <div key={pedido.id} className="flex gap-4 relative z-10 group mb-6 last:mb-0">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-black transition-all duration-300 ${
                          geocodificado
                            ? "bg-primary text-primary-foreground border-primary shadow-sm group-hover:scale-110"
                            : "bg-secondary border-border-ui text-muted-foreground"
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex flex-col pt-0.5">
                          <h4 className="text-foreground font-bold text-sm leading-snug">{pedido.direccion}</h4>
                          <p className="text-muted-foreground text-xs mt-0.5 font-medium">{pedido.nombreCliente}</p>
                          {!geocodificado && (
                            <p className="text-amber-600 dark:text-amber-400 text-[10px] mt-1 font-bold flex items-center gap-1">
                              ⚠ No geocodificado
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

                {pedidosPendientes.length > 0 && (
                  <div className="flex gap-4 relative z-10 mt-6">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500 text-white shadow-md border-2 border-emerald-400 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col pt-1.5">
                      <h4 className="text-emerald-600 dark:text-emerald-400 font-black text-sm uppercase tracking-tight">Fin del Recorrido</h4>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mapa Leaflet */}
          <div className="lg:col-span-2 bg-card border border-border-ui rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 min-h-[520px] relative">
            {paradas.length > 0 ? (
              <div className="absolute inset-0 z-0">
                <SimuladorRuta empresaId={usuarioDB.empresa.id} paradas={paradas} />
                <MapaRutas paradas={paradas} empresaId={usuarioDB.empresa.id} />
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
