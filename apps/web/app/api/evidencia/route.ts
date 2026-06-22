import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import prisma from "@ruteai/database";
import { minutosAtraso } from "@/lib/logistica";

// POST /api/evidencia — Genera una Signed URL para que el móvil suba la foto
// Body: { pedidoId: string, tipo: "foto" | "firma" }
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    const body = await req.json() as { pedidoId: unknown; tipo: unknown };
    const pedidoId = typeof body.pedidoId === "string" ? body.pedidoId : null;
    const tipo = body.tipo === "foto" || body.tipo === "firma" ? body.tipo : null;

    if (!pedidoId || !tipo) {
      return NextResponse.json(
        { success: false, error: "pedidoId y tipo (foto|firma) son requeridos" },
        { status: 400 }
      );
    }

    // Verificar que el pedido pertenece a la empresa del usuario (seguridad)
    const usuarioDB = await prisma.usuario.findUnique({
      where: { id: user.id },
      select: { empresaId: true },
    });

    if (!usuarioDB) {
      return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });
    }

    const pedido = await prisma.pedido.findFirst({
      where: { id: pedidoId, empresaId: usuarioDB.empresaId },
    });

    if (!pedido) {
      return NextResponse.json({ success: false, error: "Pedido no encontrado" }, { status: 404 });
    }

    // Generar path único en el bucket: evidencias/{empresaId}/{pedidoId}/{tipo}-{timestamp}.jpg
    const timestamp = Date.now();
    const filePath = `${usuarioDB.empresaId}/${pedidoId}/${tipo}-${timestamp}.jpg`;
    const bucketName = "evidencias";

    // Crear una Signed Upload URL (válida por 5 minutos)
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUploadUrl(filePath);

    if (error || !data) {
      console.error("[API/evidencia] Error generando signed URL:", error);
      return NextResponse.json(
        { success: false, error: "Error generando URL de carga" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        signedUrl: data.signedUrl,
        token:     data.token,
        filePath,
        // URL pública que tendrá el archivo una vez subido
        publicUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucketName}/${filePath}`,
      },
    });
  } catch (error) {
    console.error("[API/evidencia] Error:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}

// PATCH /api/evidencia — El móvil confirma que subió la foto y actualiza el pedido
// Body: { pedidoId: string, tipo: "foto" | "firma", publicUrl: string }
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    const body = await req.json() as { pedidoId: unknown; tipo: unknown; publicUrl: unknown };
    const pedidoId = typeof body.pedidoId === "string" ? body.pedidoId : null;
    const tipo = body.tipo === "foto" || body.tipo === "firma" ? body.tipo : null;
    const publicUrl = typeof body.publicUrl === "string" ? body.publicUrl : null;

    if (!pedidoId || !tipo || !publicUrl) {
      return NextResponse.json({ success: false, error: "Faltan parámetros" }, { status: 400 });
    }

    const usuarioDB = await prisma.usuario.findUnique({
      where: { id: user.id },
      select: { empresaId: true, nombre: true },
    });
    if (!usuarioDB) {
      return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });
    }

    const pedido = await prisma.pedido.findFirst({
      where: { id: pedidoId, empresaId: usuarioDB.empresaId },
      select: { id: true, estado: true, fechaEntregaLimite: true },
    });
    if (!pedido) {
      return NextResponse.json({ success: false, error: "Pedido no encontrado" }, { status: 404 });
    }

    // La firma se puede adjuntar sin transición. Para la foto, la entrega
    // se confirma: bloqueamos si el pedido ya es terminal (cancelado/entregado).
    if (tipo === "firma") {
      await prisma.pedido.update({
        where: { id: pedido.id },
        data: { firmaEntregaUrl: publicUrl },
      });
      return NextResponse.json({ success: true });
    }

    if (pedido.estado === "cancelado") {
      return NextResponse.json(
        { success: false, error: "El pedido está cancelado y no admite más cambios." },
        { status: 409 }
      );
    }

    // tipo === "foto": confirmar entrega + sellar tiempo + registrar evento
    const ahora = new Date();
    const atraso = minutosAtraso(
      { estado: "entregado", fechaEntregaLimite: pedido.fechaEntregaLimite, entregadoEn: ahora },
      ahora
    );

    await prisma.$transaction([
      prisma.pedido.update({
        where: { id: pedido.id },
        data: {
          fotoEntregaUrl: publicUrl,
          estado: "entregado",
          entregadoEn: ahora,
          entregaSinFoto: false,
          scoreRiesgo: 0,
        },
      }),
      prisma.eventoPedido.create({
        data: {
          pedidoId: pedido.id,
          tipo: "entregado",
          estadoAnterior: pedido.estado,
          estadoNuevo: "entregado",
          descripcion: "Entrega confirmada con foto",
          actorId: user.id,
          actorNombre: usuarioDB.nombre,
          metadata: { minutosAtraso: atraso, aTiempo: atraso === 0, conFoto: true },
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API/evidencia] PATCH Error:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
