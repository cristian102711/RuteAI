import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { createAdminClient } from "@/lib/supabaseAdmin";
import prisma from "@ruteai/database";

export async function POST(req: NextRequest) {
  try {
    // Usar el cliente normal solo para autenticar al usuario
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    const usuarioDB = await prisma.usuario.findUnique({
      where: { id: user.id },
      select: { empresaId: true },
    });

    if (!usuarioDB) {
      return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });
    }

    const timestamp = Date.now();
    const filePath = `logos/${usuarioDB.empresaId}/${timestamp}.png`;
    const bucketName = "evidencias";

    // Usar el cliente admin para generar la signed URL (requiere service_role)
    const adminClient = createAdminClient();
    const { data, error } = await adminClient.storage
      .from(bucketName)
      .createSignedUploadUrl(filePath);

    if (error || !data) {
      console.error("[API/logo] Error generando signed URL:", error);
      return NextResponse.json({ success: false, error: error?.message || "Error generando URL de carga (¿existe el bucket 'evidencias'?)" }, { status: 400 });
    }

    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucketName}/${filePath}`;

    return NextResponse.json({
      success: true,
      data: {
        signedUrl: data.signedUrl,
        publicUrl,
      },
    });
  } catch (error: any) {
    console.error("[API/logo] Error:", error);
    return NextResponse.json({ success: false, error: error?.message || String(error) }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    const body = await req.json() as { publicUrl: unknown };
    const publicUrl = typeof body.publicUrl === "string" ? body.publicUrl : null;

    if (!publicUrl) {
      return NextResponse.json({ success: false, error: "publicUrl es requerido" }, { status: 400 });
    }

    const usuarioDB = await prisma.usuario.findUnique({
      where: { id: user.id },
      select: { empresaId: true, empresa: { select: { configuracion: true } } },
    });

    if (!usuarioDB) {
      return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });
    }

    const configActual = (usuarioDB.empresa?.configuracion as Record<string, unknown>) ?? {};
    
    await prisma.empresa.update({
      where: { id: usuarioDB.empresaId },
      data: {
        configuracion: {
          ...configActual,
          logoUrl: publicUrl
        }
      }
    });

    return NextResponse.json({ success: true, logoUrl: publicUrl });
  } catch (error: any) {
    console.error("[API/logo] PATCH Error:", error);
    return NextResponse.json({ success: false, error: error?.message || String(error) }, { status: 400 });
  }
}
