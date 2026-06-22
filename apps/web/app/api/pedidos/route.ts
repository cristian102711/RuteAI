// app/api/pedidos/route.ts
// BFF: el web orquesta (geocoding) y delega la persistencia en core-service.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { callCore, CoreServiceError } from "@/lib/coreServiceClient";
import { geocodificarDireccion } from "@/lib/geocodingService";

// Schema Zod para validar la creación de un pedido
const CrearPedidoSchema = z.object({
  nombreCliente: z.string().min(2, "Nombre requerido"),
  clienteTelefono: z.string().optional(),
  direccion: z.string().min(5, "Dirección requerida"),
  producto: z.string().min(1, "Producto requerido"),
  horarioPreferido: z.string().optional(),
  fechaEntregaLimite: z.string().datetime().optional(),
  repartidorId: z.string().uuid().optional(),
});

// GET /api/pedidos — Listar pedidos de la empresa (vía core)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pedidos = await callCore("/api/v1/orders", {
      query: {
        estado: searchParams.get("estado") ?? undefined,
        repartidorId: searchParams.get("repartidorId") ?? undefined,
      },
    });
    return NextResponse.json({ data: pedidos, error: null }, { status: 200 });
  } catch (err) {
    if (err instanceof CoreServiceError) {
      return NextResponse.json({ data: null, error: err.message }, { status: err.status });
    }
    console.error("[GET /api/pedidos]", err);
    return NextResponse.json({ data: null, error: "Error interno del servidor" }, { status: 500 });
  }
}

// POST /api/pedidos — Crear un pedido nuevo (geocodifica en el BFF, persiste en core)
export async function POST(req: NextRequest) {
  try {
    // Validar body con Zod
    const body = await req.json();
    const parsed = CrearPedidoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { nombreCliente, clienteTelefono, direccion, producto, horarioPreferido, fechaEntregaLimite, repartidorId } =
      parsed.data;

    // Geocodificación (orquestada por el BFF) — opcional, no bloquea la creación
    const coords = await geocodificarDireccion(direccion);

    const pedido = await callCore("/api/v1/orders", {
      method: "POST",
      body: {
        nombreCliente,
        clienteTelefono,
        direccion,
        producto,
        horarioPreferido,
        ...(fechaEntregaLimite && { fechaEntregaLimite }),
        lat: coords?.lat ?? undefined,
        lng: coords?.lng ?? undefined,
        ...(repartidorId && { repartidorId }),
      },
    });

    return NextResponse.json({ data: pedido, error: null }, { status: 201 });
  } catch (err) {
    if (err instanceof CoreServiceError) {
      return NextResponse.json({ data: null, error: err.message }, { status: err.status });
    }
    console.error("[POST /api/pedidos]", err);
    return NextResponse.json({ data: null, error: "Error interno del servidor" }, { status: 500 });
  }
}
