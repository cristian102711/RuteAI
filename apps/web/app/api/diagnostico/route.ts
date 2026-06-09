import { NextResponse } from "next/server";

export async function GET() {
  const dbUrl = process.env.DATABASE_URL;
  const authServiceUrl = process.env.AUTH_SERVICE_URL;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Diagnóstico básico de variables de entorno (sin exponer valores)
  const envStatus = {
    DATABASE_URL: dbUrl ? `OK (longitud: ${dbUrl.length})` : "❌ NO DEFINIDA",
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? "OK" : "❌ NO DEFINIDA",
    SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey ? "OK" : "❌ NO DEFINIDA",
    AUTH_SERVICE_URL: authServiceUrl || "usando fallback ruteai-auth.vercel.app",
  };

  // Si no hay DATABASE_URL, retornar diagnóstico sin intentar conectar Prisma
  if (!dbUrl) {
    return NextResponse.json(
      {
        estado: "sin_database_url",
        mensaje: "DATABASE_URL no está configurada en las variables de entorno de Vercel",
        env: envStatus,
      },
      { status: 503 }
    );
  }

  // Si hay DATABASE_URL, intentar conexión con Prisma
  try {
    const { default: prisma } = await import("@ruteai/database");
    const start = Date.now();
    const count = await prisma.usuario.count();
    const duration = Date.now() - start;

    return NextResponse.json({
      estado: "conectado",
      usuarios: count,
      tiempo: `${duration}ms`,
      env: envStatus,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("DIAGNOSTICO ERROR:", err);
    return NextResponse.json(
      {
        estado: "error_de_conexion",
        nombre: err.name,
        mensaje: err.message,
        env: envStatus,
      },
      { status: 500 }
    );
  }
}
