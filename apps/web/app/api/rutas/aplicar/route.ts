import { NextRequest, NextResponse } from "next/server";
import prisma from "@ruteai/database";
import { createClient } from "@/lib/supabaseServer";
import { z } from "zod";

const AplicarRutaSchema = z.object({
  rutaOptimizada: z.array(
    z.object({
      id: z.string(),
      score: z.number(),
      nivel: z.string(),
    })
  ),
  ahorroEstimadoMin: z.number().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const usuarioDB = await prisma.usuario.findUnique({
      where: { id: user.id },
      include: { empresa: true },
    });
    if (!usuarioDB?.empresa)
      return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });

    // Solo encargados pueden aplicar rutas
    if (usuarioDB.rol !== "encargado") {
      return NextResponse.json(
        { error: "Solo los encargados pueden aplicar rutas optimizadas" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = AplicarRutaSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const { rutaOptimizada, ahorroEstimadoMin } = parsed.data;
    const empresaId = usuarioDB.empresa.id;

    // Buscar si ya existe un repartidor principal de la empresa (primer repartidor activo)
    const primerRepartidor = await prisma.usuario.findFirst({
      where: { empresaId, rol: "repartidor" },
      orderBy: { createdAt: "asc" },
    });

    // Upsert: actualizar Ruta del día si ya existe, si no crearla
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // Guardar el orden optimizado en la tabla Ruta del día
    // Si ya hay una ruta de hoy, la actualizamos; si no, la creamos.
    const rutaExistente = await prisma.ruta.findFirst({
      where: {
        empresaId,
        fecha: hoy,
        estado: { in: ["pendiente", "activa"] },
      },
    });

    const ordenParaGuardar = {
      generadoEn: new Date().toISOString(),
      ahorroEstimadoMin: ahorroEstimadoMin ?? 0,
      paradas: rutaOptimizada.map((p, idx) => ({
        orden: idx + 1,
        pedidoId: p.id,
        score: p.score,
        nivel: p.nivel,
      })),
    };

    let ruta;
    if (rutaExistente) {
      ruta = await prisma.ruta.update({
        where: { id: rutaExistente.id },
        data: {
          rutaOptimizada: ordenParaGuardar,
          estado: "activa",
          updatedAt: new Date(),
        },
      });
    } else {
      ruta = await prisma.ruta.create({
        data: {
          fecha: hoy,
          estado: "activa",
          empresaId,
          repartidorId: primerRepartidor?.id ?? usuarioDB.id,
          rutaOptimizada: ordenParaGuardar,
        },
      });
    }

    // Actualizar el scoreRiesgo real en cada pedido desde el resultado de IA
    const updatePromises = rutaOptimizada.map((p) =>
      prisma.pedido.update({
        where: { id: p.id },
        data: {
          scoreRiesgo: p.score / 100, // Normalizar a 0.0–1.0
          rutaId: ruta.id,            // Asociar pedido a esta ruta
        },
      }).catch(() => null) // Si el pedido no existe, ignorar silenciosamente
    );

    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      rutaId: ruta.id,
      pedidosActualizados: rutaOptimizada.length,
      mensaje: `Ruta optimizada aplicada con ${rutaOptimizada.length} paradas. Ahorro estimado: ${ahorroEstimadoMin ?? 0} min.`,
    });
  } catch (error) {
    console.error("[/api/rutas/aplicar] Error:", error);
    return NextResponse.json(
      { success: false, error: "Error al aplicar la ruta optimizada" },
      { status: 500 }
    );
  }
}
