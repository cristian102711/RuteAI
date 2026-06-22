// app/api/rutas/route.ts
// BFF de planificación de rutas: orquesta ai-service (/optimize) y persiste en core.
import { NextRequest, NextResponse } from "next/server";
import { callCore, CoreServiceError } from "@/lib/coreServiceClient";
import { optimizarRuta, type PuntoRuta } from "@/lib/aiServiceClient";

interface PedidoCore {
  id: string;
  estado: string;
  lat: number | null;
  lng: number | null;
  repartidorId: string | null;
  fechaEntregaLimite?: string | null;
}

// GET /api/rutas — Listar rutas de la empresa
export async function GET() {
  try {
    const rutas = await callCore("/api/v1/routes");
    return NextResponse.json({ data: rutas, error: null }, { status: 200 });
  } catch (err) {
    if (err instanceof CoreServiceError) {
      return NextResponse.json({ data: null, error: err.message }, { status: err.status });
    }
    console.error("[GET /api/rutas]", err);
    return NextResponse.json({ data: null, error: "Error interno del servidor" }, { status: 500 });
  }
}

// POST /api/rutas — Optimiza los pedidos activos y crea la ruta del día.
// Body opcional: { repartidorId }. Si no se entrega, se infiere del pedido
// activo más frecuente; si no hay ninguno asignado, devuelve solo la previsualización.
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { repartidorId?: string };

    const pedidos = await callCore<PedidoCore[]>("/api/v1/orders");
    const activos = pedidos
      .filter(
        (p) =>
          ["pendiente", "en_ruta"].includes(p.estado) &&
          p.lat !== null &&
          p.lng !== null
      )
      .slice(0, 20);

    if (activos.length === 0) {
      return NextResponse.json(
        { data: null, error: "No hay pedidos activos con coordenadas para optimizar" },
        { status: 400 }
      );
    }

    const puntos: PuntoRuta[] = activos.map((p) => ({
      id: p.id,
      lat: p.lat as number,
      lng: p.lng as number,
      fechaEntregaLimite: p.fechaEntregaLimite ?? null,
    }));

    const { rutaOptimizada, algoritmo, resumen, razon } = await optimizarRuta(puntos[0], puntos);

    // Determinar repartidor: explícito o el más frecuente entre los activos
    const repartidorId = body.repartidorId ?? repartidorMasFrecuente(activos);

    if (!repartidorId) {
      // Previsualización sin persistir (no hay repartidor asignado)
      return NextResponse.json(
        { data: { rutaOptimizada, algoritmo, resumen, razon, persistida: false }, error: null },
        { status: 200 }
      );
    }

    const ruta = await callCore("/api/v1/routes", {
      method: "POST",
      body: {
        repartidorId,
        fecha: new Date().toISOString(),
        rutaOptimizada: { stops: rutaOptimizada, algoritmo, resumen, razon },
      },
    });

    return NextResponse.json(
      { data: { ruta, rutaOptimizada, algoritmo, resumen, razon, persistida: true }, error: null },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof CoreServiceError) {
      return NextResponse.json({ data: null, error: err.message }, { status: err.status });
    }
    console.error("[POST /api/rutas]", err);
    return NextResponse.json({ data: null, error: "Error interno del servidor" }, { status: 500 });
  }
}

function repartidorMasFrecuente(pedidos: PedidoCore[]): string | null {
  const conteo = new Map<string, number>();
  for (const p of pedidos) {
    if (p.repartidorId) conteo.set(p.repartidorId, (conteo.get(p.repartidorId) ?? 0) + 1);
  }
  let mejor: string | null = null;
  let max = 0;
  for (const [rep, n] of conteo) {
    if (n > max) {
      max = n;
      mejor = rep;
    }
  }
  return mejor;
}
