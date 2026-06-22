// app/api/dev/simular-gps/route.ts
// Utilidad de DEMO: avanza un "paso" la posición GPS de cada repartidor de la
// empresa hacia su pedido activo más cercano, e inserta una Ubicacion nueva.
// Pensado para ver los camiones moverse en el mapa del admin SIN depender del
// móvil real ni de Supabase Realtime (en local). Requiere sesión de encargado.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import prisma from "@ruteai/database";

const PASO = 0.0016;        // ~150 m por tick
const LLEGADA = 0.0008;     // ~80 m: se considera "llegó" a la parada
const OFFSET_INICIAL = 0.012; // ~1.2 km: desde dónde arranca si no tiene GPS aún

type LatLng = { lat: number; lng: number };
const dist = (a: LatLng, b: LatLng) => Math.hypot(a.lat - b.lat, a.lng - b.lng);

export async function POST() {
  // Guard: no exponer la simulación en producción.
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "No disponible en producción" }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const usuarioDB = await prisma.usuario.findUnique({
    where: { id: user.id },
    select: { empresaId: true, rol: true },
  });
  if (!usuarioDB || !["encargado", "super_admin"].includes(usuarioDB.rol)) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }
  const empresaId = usuarioDB.empresaId;

  // Pedidos activos con coordenadas, asignados a un repartidor.
  const pedidos = await prisma.pedido.findMany({
    where: {
      empresaId,
      estado: { in: ["pendiente", "en_ruta"] },
      repartidorId: { not: null },
      lat: { not: null },
      lng: { not: null },
    },
    select: { repartidorId: true, lat: true, lng: true },
  });

  // Agrupar paradas por repartidor.
  const porRepartidor = new Map<string, LatLng[]>();
  for (const p of pedidos) {
    if (!p.repartidorId || p.lat == null || p.lng == null) continue;
    const arr = porRepartidor.get(p.repartidorId) ?? [];
    arr.push({ lat: p.lat, lng: p.lng });
    porRepartidor.set(p.repartidorId, arr);
  }

  const posiciones: { repartidorId: string; lat: number; lng: number }[] = [];

  for (const [repartidorId, paradas] of porRepartidor) {
    // Posición actual = último GPS, o un punto offset del centroide de sus paradas.
    const ultima = await prisma.ubicacion.findFirst({
      where: { repartidorId },
      orderBy: { timestamp: "desc" },
      select: { lat: true, lng: true },
    });

    let actual: LatLng;
    if (ultima) {
      actual = { lat: ultima.lat, lng: ultima.lng };
    } else {
      const cx = paradas.reduce((s, p) => s + p.lat, 0) / paradas.length;
      const cy = paradas.reduce((s, p) => s + p.lng, 0) / paradas.length;
      actual = { lat: cx + OFFSET_INICIAL, lng: cy + OFFSET_INICIAL };
    }

    // Objetivo: la parada más cercana NO alcanzada; si ya llegó a todas, la más
    // lejana (para que "vuelva" y el movimiento sea continuo).
    const conDist = paradas.map((t) => ({ t, d: dist(actual, t) }));
    const pendientesParada = conDist.filter((x) => x.d > LLEGADA);
    const objetivo =
      pendientesParada.length > 0
        ? pendientesParada.sort((a, b) => a.d - b.d)[0].t
        : conDist.sort((a, b) => b.d - a.d)[0].t;

    // Avanzar un paso hacia el objetivo.
    const dx = objetivo.lat - actual.lat;
    const dy = objetivo.lng - actual.lng;
    const mag = Math.hypot(dx, dy) || 1;
    const paso = Math.min(PASO, mag);
    const next: LatLng = {
      lat: actual.lat + (dx / mag) * paso,
      lng: actual.lng + (dy / mag) * paso,
    };

    await prisma.ubicacion.create({
      data: {
        repartidorId,
        empresaId,
        lat: next.lat,
        lng: next.lng,
      },
    });
    posiciones.push({ repartidorId, lat: next.lat, lng: next.lng });
  }

  return NextResponse.json({ moved: posiciones.length, posiciones });
}
