// app/api/pedidos/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@ruteai/database";
import { createClient } from "@/lib/supabaseServer";

// Schema Zod para validar la creación de un pedido
const CrearPedidoSchema = z.object({
  nombreCliente: z.string().min(2, "Nombre requerido"),
  clienteTelefono: z.string().optional(),
  direccion: z.string().min(5, "Dirección requerida"),
  producto: z.string().min(1, "Producto requerido"),
  horarioPreferido: z.string().optional(),
  repartidorId: z.string().uuid().optional(),
});

// GET /api/pedidos — Listar pedidos de la empresa
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ data: null, error: "No autorizado" }, { status: 401 });
    }

    const usuarioDB = await prisma.usuario.findUnique({
      where: { id: user.id },
    });

    if (!usuarioDB) {
      return NextResponse.json({ data: null, error: "Usuario no encontrado" }, { status: 404 });
    }

    // Filtros opcionales via query params
    const { searchParams } = new URL(req.url);
    const estado = searchParams.get("estado");
    const repartidorId = searchParams.get("repartidorId");

    const pedidos = await prisma.pedido.findMany({
      where: {
        empresaId: usuarioDB.empresaId,
        ...(estado && { estado }),
        ...(repartidorId && { repartidorId }),
      },
      include: {
        repartidor: { select: { id: true, nombre: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: pedidos, error: null }, { status: 200 });
  } catch (err) {
    console.error("[GET /api/pedidos]", err);
    return NextResponse.json({ data: null, error: "Error interno del servidor" }, { status: 500 });
  }
}

// POST /api/pedidos — Crear un pedido nuevo
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ data: null, error: "No autorizado" }, { status: 401 });
    }

    const usuarioDB = await prisma.usuario.findUnique({
      where: { id: user.id },
    });

    if (!usuarioDB || usuarioDB.rol !== "encargado") {
      return NextResponse.json(
        { data: null, error: "Solo los encargados pueden crear pedidos" },
        { status: 403 }
      );
    }

    // Validar body con Zod
    const body = await req.json();
    const parsed = CrearPedidoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { nombreCliente, clienteTelefono, direccion, producto, horarioPreferido, repartidorId } =
      parsed.data;

    // Geocodificar la dirección con Nominatim de forma asíncrona
    let lat: number | null = null;
    let lng: number | null = null;

    try {
      const query = encodeURIComponent(direccion + ", Chile");
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
        { headers: { "User-Agent": "RouteAI-App/1.0 (contact@ruteai.com)" } }
      );
      const geoData = await geoRes.json();
      if (geoData.length > 0) {
        lat = parseFloat(geoData[0].lat);
        lng = parseFloat(geoData[0].lon);
      }
    } catch {
      // Geocodificación opcional — no bloquea la creación del pedido
    }

    const pedido = await prisma.pedido.create({
      data: {
        nombreCliente,
        clienteTelefono,
        direccion,
        lat,
        lng,
        producto,
        horarioPreferido,
        empresaId: usuarioDB.empresaId,
        ...(repartidorId && { repartidorId }),
      },
    });

    return NextResponse.json({ data: pedido, error: null }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/pedidos]", err);
    return NextResponse.json({ data: null, error: "Error interno del servidor" }, { status: 500 });
  }
}
