// app/api/pedidos/route.ts
// BFF: orquesta geocoding/IA y persiste. Usa core-service si disponible, Prisma directo como fallback.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { callCore, CoreServiceError, obtenerTokenSesion } from "@/lib/coreServiceClient";
import { geocodificarDireccion } from "@/lib/geocodingService";
import { createClient } from "@/lib/supabaseServer";
import prisma from "@ruteai/database";

const CrearPedidoSchema = z.object({
  nombreCliente: z.string().min(2, "Nombre requerido"),
  clienteTelefono: z.string().optional(),
  direccion: z.string().min(5, "Dirección requerida"),
  producto: z.string().min(1, "Producto requerido"),
  horarioPreferido: z.string().optional(),
  fechaEntregaLimite: z.string().datetime().optional(),
  repartidorId: z.string().uuid().optional(),
});

// GET /api/pedidos
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Intentar core-service
    if (process.env.CORE_SERVICE_URL) {
      try {
        const pedidos = await callCore("/api/v1/orders", {
          query: {
            estado: searchParams.get("estado") ?? undefined,
            repartidorId: searchParams.get("repartidorId") ?? undefined,
          },
        });
        return NextResponse.json({ data: pedidos, error: null }, { status: 200 });
      } catch {
        console.warn("[GET /api/pedidos] core-service no disponible, usando Prisma");
      }
    }

    // Fallback Prisma directo
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ data: null, error: "No autenticado" }, { status: 401 });

    const usuarioDB = await prisma.usuario.findUnique({
      where: { id: user.id },
      select: { empresaId: true },
    });
    if (!usuarioDB) return NextResponse.json({ data: null, error: "Usuario no registrado" }, { status: 403 });

    const where: any = { empresaId: usuarioDB.empresaId };
    const estado = searchParams.get("estado");
    if (estado) where.estado = estado;
    const repartidorId = searchParams.get("repartidorId");
    if (repartidorId) where.repartidorId = repartidorId;

    const pedidos = await prisma.pedido.findMany({ where, orderBy: { createdAt: "desc" } });
    return NextResponse.json({ data: pedidos, error: null }, { status: 200 });

  } catch (err) {
    console.error("[GET /api/pedidos]", err);
    return NextResponse.json({ data: null, error: "Error interno del servidor" }, { status: 500 });
  }
}

// POST /api/pedidos
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CrearPedidoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { nombreCliente, clienteTelefono, direccion, producto, horarioPreferido, fechaEntregaLimite, repartidorId } = parsed.data;
    const coords = await geocodificarDireccion(direccion);

    // Intentar core-service
    if (process.env.CORE_SERVICE_URL) {
      try {
        const pedido = await callCore("/api/v1/orders", {
          method: "POST",
          body: {
            nombreCliente, clienteTelefono, direccion, producto, horarioPreferido,
            ...(fechaEntregaLimite && { fechaEntregaLimite }),
            lat: coords?.lat ?? undefined, lng: coords?.lng ?? undefined,
            ...(repartidorId && { repartidorId }),
          },
        });
        return NextResponse.json({ data: pedido, error: null }, { status: 201 });
      } catch {
        console.warn("[POST /api/pedidos] core-service no disponible, usando Prisma");
      }
    }

    // Fallback Prisma directo
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ data: null, error: "No autenticado" }, { status: 401 });

    const usuarioDB = await prisma.usuario.findUnique({ where: { id: user.id }, select: { empresaId: true } });
    if (!usuarioDB) return NextResponse.json({ data: null, error: "Usuario no registrado" }, { status: 403 });

    const pedido = await prisma.pedido.create({
      data: {
        nombreCliente, direccion, producto,
        clienteTelefono: clienteTelefono || null,
        horarioPreferido: horarioPreferido || null,
        fechaEntregaLimite: fechaEntregaLimite ? new Date(fechaEntregaLimite) : null,
        lat: coords?.lat ?? null, lng: coords?.lng ?? null,
        repartidorId: repartidorId || null,
        estado: "pendiente",
        empresaId: usuarioDB.empresaId,
      },
    });
    return NextResponse.json({ data: pedido, error: null }, { status: 201 });

  } catch (err) {
    console.error("[POST /api/pedidos]", err);
    return NextResponse.json({ data: null, error: "Error interno del servidor" }, { status: 500 });
  }
}
