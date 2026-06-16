// app/api/rutas/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { callCore, CoreServiceError } from "@/lib/coreServiceClient";

// GET /api/rutas/[id] — Detalle de una ruta
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ruta = await callCore(`/api/v1/routes/${id}`);
    return NextResponse.json({ data: ruta, error: null }, { status: 200 });
  } catch (err) {
    if (err instanceof CoreServiceError) {
      return NextResponse.json({ data: null, error: err.message }, { status: err.status });
    }
    console.error("[GET /api/rutas/[id]]", err);
    return NextResponse.json({ data: null, error: "Error interno del servidor" }, { status: 500 });
  }
}

// PATCH /api/rutas/[id] — Cambiar estado de la ruta
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await req.json()) as { estado: string };

    const estadosValidos = ["planificada", "en_curso", "completada", "cancelada"];
    if (!estadosValidos.includes(body.estado)) {
      return NextResponse.json(
        { data: null, error: `Estado inválido. Válidos: ${estadosValidos.join(", ")}` },
        { status: 400 }
      );
    }

    const ruta = await callCore(`/api/v1/routes/${id}/estado`, {
      method: "PATCH",
      body: { estado: body.estado },
    });

    return NextResponse.json({ data: ruta, error: null }, { status: 200 });
  } catch (err) {
    if (err instanceof CoreServiceError) {
      return NextResponse.json({ data: null, error: err.message }, { status: err.status });
    }
    console.error("[PATCH /api/rutas/[id]]", err);
    return NextResponse.json({ data: null, error: "Error interno del servidor" }, { status: 500 });
  }
}
