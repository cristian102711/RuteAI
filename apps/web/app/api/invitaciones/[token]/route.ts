import { NextRequest, NextResponse } from "next/server";
import prisma from "@ruteai/database";

// GET /api/invitaciones/[token] — Valida un token de invitación (público)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const invitacion = await prisma.invitacionRepartidor.findUnique({
      where: { token },
      include: { empresa: { select: { nombre: true } } },
    });

    if (!invitacion) {
      return NextResponse.json({ error: "Invitación no encontrada" }, { status: 404 });
    }

    if (invitacion.usada) {
      return NextResponse.json({ error: "Esta invitación ya fue utilizada" }, { status: 410 });
    }

    if (new Date() > invitacion.expiresAt) {
      return NextResponse.json({ error: "Esta invitación ha expirado" }, { status: 410 });
    }

    return NextResponse.json({
      valid: true,
      email: invitacion.email,
      nombre: invitacion.nombre,
      empresaNombre: invitacion.empresa.nombre,
    });
  } catch (error) {
    console.error("[API/invitaciones/token] Error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
