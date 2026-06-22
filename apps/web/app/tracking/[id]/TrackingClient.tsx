"use client";

import { useEffect, useState, useMemo } from "react";
import { APIProvider, Map, Marker, InfoWindow } from "@vis.gl/react-google-maps";
import { obtenerUbicacionRepartidorPublico } from "../../dashboard/actions";
import { Package, Truck, CheckCircle2, AlertCircle, Clock, ShieldCheck, ImageOff, MapPin, Navigation } from "lucide-react";
import Image from "next/image";

// Estilo oscuro premium para Google Maps (coincide con zinc-950)
const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#09090b" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#71717a" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#09090b" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#27272a" }] },
  { featureType: "administrative.country", elementType: "labels.text.fill", stylers: [{ color: "#a1a1aa" }] },
  { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.neighborhood", stylers: [{ visibility: "off" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#71717a" }] },
  { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#18181b" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#71717a" }] },
  { featureType: "road.arterial", elementType: "geometry.fill", stylers: [{ color: "#27272a" }] },
  { featureType: "road.highway", elementType: "geometry.fill", stylers: [{ color: "#27272a" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#3f3f46" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#020617" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#3f3f46" }] }
];

interface Pedido {
  id: string;
  nombreCliente: string;
  clienteTelefono: string | null;
  direccion: string;
  lat: number | null;
  lng: number | null;
  producto: string;
  horarioPreferido: string | null;
  estado: string;
  fotoEntregaUrl: string | null;
  firmaEntregaUrl: string | null;
  empresa: {
    nombre: string;
  };
}

interface TrackingClientProps {
  pedido: Pedido;
  apiKey: string;
}

export default function TrackingClient({ pedido: initialPedido, apiKey }: TrackingClientProps) {
  const [pedido, setPedido] = useState<Pedido>(initialPedido);
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState<boolean>(true);
  const [showDriverInfo, setShowDriverInfo] = useState<boolean>(true);

  // Polling para la ubicación del repartidor y estado del pedido
  useEffect(() => {
    if (pedido.estado !== "en_ruta") {
      setLoadingLocation(false);
      return;
    }

    const fetchLocation = async () => {
      try {
        const res = await obtenerUbicacionRepartidorPublico(pedido.id);
        if (res.success && res.lat !== null && res.lng !== null) {
          setDriverLocation({ lat: res.lat, lng: res.lng });
        }
      } catch (err) {
        console.error("Error al obtener ubicación en tiempo real:", err);
      } finally {
        setLoadingLocation(false);
      }
    };

    fetchLocation();
    const interval = setInterval(fetchLocation, 12000); // Polling cada 12 segundos

    return () => clearInterval(interval);
  }, [pedido.id, pedido.estado]);

  // Centro del mapa en base a la ubicación del cliente o repartidor
  const mapCenter = useMemo(() => {
    if (driverLocation) return driverLocation;
    if (pedido.lat && pedido.lng) return { lat: pedido.lat, lng: pedido.lng };
    return { lat: -33.4489, lng: -70.6693 };
  }, [driverLocation, pedido.lat, pedido.lng]);

  const hitos = [
    { key: "pendiente", label: "Preparando", icon: Package },
    { key: "en_ruta", label: "En Camino", icon: Truck },
    { key: "entregado", label: "Entregado", icon: CheckCircle2 }
  ];

  const estadoIndex = hitos.findIndex(h => h.key === pedido.estado) !== -1 
      ? hitos.findIndex(h => h.key === pedido.estado) 
      : 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-emerald-500/30 flex flex-col">
      
      {/* HEADER PÚBLICO */}
      <header className="bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-800/60 p-4 sticky top-0 z-50">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div>
            <p className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase mb-0.5">Operado por</p>
            <h2 className="text-lg font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-400">
              {pedido.empresa.nombre}
            </h2>
          </div>
          {pedido.estado === "en_ruta" && (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">En Vivo</span>
            </div>
          )}
        </div>
      </header>

      {/* MAPA DE SEGUIMIENTO EN VIVO */}
      {pedido.estado === "en_ruta" && (
        <section className="w-full relative h-[320px] sm:h-[400px] border-b border-zinc-800/60 bg-zinc-900">
          {apiKey ? (
            <APIProvider apiKey={apiKey}>
              <Map
                defaultCenter={mapCenter}
                defaultZoom={14}
                gestureHandling={"greedy"}
                disableDefaultUI={true}
                styles={DARK_MAP_STYLE}
                className="h-full w-full"
              >
                {/* Marcador de Destino (Cliente) */}
                {pedido.lat && pedido.lng && (
                  <Marker
                    position={{ lat: pedido.lat, lng: pedido.lng }}
                    title="Tu domicilio"
                    icon={{
                      path: "M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z",
                      fillColor: "#10b981", // Emerald-500
                      fillOpacity: 1,
                      strokeColor: "#ffffff",
                      strokeWeight: 2,
                      scale: 1.1
                    }}
                  />
                )}

                {/* Marcador de Repartidor */}
                {driverLocation && (
                  <Marker
                    position={driverLocation}
                    title="Repartidor"
                    onClick={() => setShowDriverInfo(!showDriverInfo)}
                    icon={{
                      path: "M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z",
                      fillColor: "#3b82f6", // Blue-500
                      fillOpacity: 1,
                      strokeColor: "#ffffff",
                      strokeWeight: 2,
                      scale: 1.3
                    }}
                  />
                )}

                {driverLocation && showDriverInfo && (
                  <InfoWindow
                    position={driverLocation}
                    onCloseClick={() => setShowDriverInfo(false)}
                  >
                    <div className="text-zinc-950 p-2 font-sans max-w-[180px]">
                      <div className="font-extrabold text-xs flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                        Repartidor RuteAI
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-1 leading-normal">
                        En ruta hacia tu ubicación en vivo.
                      </p>
                    </div>
                  </InfoWindow>
                )}
              </Map>
            </APIProvider>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-zinc-900 text-zinc-400 p-6 text-center">
              <div className="text-4xl mb-3">🗺️</div>
              <h3 className="text-sm font-semibold text-white">Mapa en preparación</h3>
              <p className="text-xs text-zinc-500 max-w-xs mt-1.5 leading-relaxed">
                Estamos cargando los detalles geográficos de tu entrega. Muy pronto podrás ver al repartidor en tiempo real.
              </p>
            </div>
          )}

          {/* Floating Control Badge */}
          <div className="absolute bottom-4 left-4 z-10 bg-zinc-950/80 backdrop-blur-md border border-zinc-800 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2">
            <Navigation className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[11px] font-medium text-zinc-300">Monitoreo activo</span>
          </div>
        </section>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-md mx-auto p-4 sm:p-6 relative flex-1 w-full">
        <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none opacity-50" />
        
        {/* INFO DEL PEDIDO */}
        <section className="relative z-10 bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-3xl p-5 sm:p-8 shadow-xl mt-2">
          <h1 className="text-2xl font-extrabold mb-1">¡Hola, {pedido.nombreCliente.split(" ")[0]}! 👋</h1>
          <p className="text-sm text-zinc-400 font-medium mb-6 leading-relaxed">
            {pedido.estado === "en_ruta" 
              ? "¡Tu pedido va en camino! Síguelo en vivo en el mapa arriba."
              : "Aquí puedes monitorear en tiempo real el avance de tu entrega."}
          </p>

          <div className="flex flex-col gap-5 border-t border-zinc-800/50 pt-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-zinc-800/50 flex items-center justify-center border border-zinc-700/50 flex-shrink-0">
                <Package className="w-5 h-5 text-zinc-300" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Contenido del Transporte</p>
                <p className="font-bold text-zinc-200 mt-0.5 uppercase tracking-wide">{pedido.producto}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-zinc-800/50 flex items-center justify-center border border-zinc-700/50 flex-shrink-0">
                <Clock className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Ventana de Entrega Solicitada</p>
                <p className="font-bold text-blue-400 mt-0.5">{pedido.horarioPreferido || "Durante el día"}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-zinc-800/50 flex items-center justify-center border border-zinc-700/50 flex-shrink-0">
                <MapPin className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Dirección de Destino</p>
                <p className="font-semibold text-zinc-300 mt-0.5 text-xs sm:text-sm">{pedido.direccion}</p>
              </div>
            </div>
          </div>
        </section>

        {/* TIMELINE DE PROGRESO */}
        <section className="relative z-10 mt-8 mb-10 px-2">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6">Estado de la ruta</h3>
          
          <div className="flex flex-col gap-0 relative">
            <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-zinc-800/80 z-0"></div>
            
            {hitos.map((hito, i) => {
              const isCompleted = i < estadoIndex;
              const isCurrent = i === estadoIndex;
              const Icon = hito.icon;

              return (
                <div key={hito.key} className="flex gap-5 relative z-10 mb-8 last:mb-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                    isCompleted 
                      ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.2)]" 
                      : isCurrent
                        ? "bg-blue-500/10 border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)] animate-pulse"
                        : "bg-zinc-950 border-zinc-800 text-zinc-600"
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col pt-2.5">
                    <h4 className={`font-bold text-sm leading-none ${isCurrent ? "text-zinc-100" : isCompleted ? "text-emerald-400" : "text-zinc-500"}`}>
                      {hito.label}
                    </h4>
                    {isCurrent && hito.key === "en_ruta" && (
                      <p className="text-xs text-blue-400 mt-1.5 font-medium">El repartidor se dirige a tu domicilio.</p>
                    )}
                    {isCurrent && hito.key === "pendiente" && (
                      <p className="text-xs text-zinc-400 mt-1.5 font-medium">Empaquetando en bodega.</p>
                    )}
                    {isCurrent && hito.key === "entregado" && (
                      <p className="text-xs text-emerald-400 mt-1.5 font-medium">¡Pedido entregado con éxito!</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* EVIDENCIA DE ENTREGA */}
        {pedido.estado === "entregado" && (pedido.fotoEntregaUrl || pedido.firmaEntregaUrl) && (
          <section className="relative z-10 mt-6 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                Evidencia de entrega
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Foto de entrega */}
              {pedido.fotoEntregaUrl ? (
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Foto</p>
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900">
                    <Image
                      src={pedido.fotoEntregaUrl}
                      alt="Foto de entrega"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Foto</p>
                  <div className="aspect-[4/3] rounded-2xl border border-zinc-800 bg-zinc-900/50 flex items-center justify-center">
                    <ImageOff className="w-8 h-8 text-zinc-700" />
                  </div>
                </div>
              )}

              {/* Firma */}
              {pedido.firmaEntregaUrl ? (
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Firma</p>
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900">
                    <Image
                      src={pedido.firmaEntregaUrl}
                      alt="Firma de recepción"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Firma</p>
                  <div className="aspect-[4/3] rounded-2xl border border-zinc-800 bg-zinc-900/50 flex items-center justify-center">
                    <ImageOff className="w-8 h-8 text-zinc-700" />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-500/5 border border-emerald-500/15 p-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <p className="text-xs text-emerald-400/80 font-medium">
                Entrega verificada y registrada por RouteAI
              </p>
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
