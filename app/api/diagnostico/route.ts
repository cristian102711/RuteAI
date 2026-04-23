import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Intentamos hacer una consulta básica para ver qué choca
    const start = Date.now();
    const count = await prisma.usuario.count();
    const duration = Date.now() - start;
    
    return NextResponse.json({
      estado: "conectado",
      usuarios: count,
      tiempo: duration,
      urlDb: process.env.DATABASE_URL ? "Existe (longitud: " + process.env.DATABASE_URL.length + ")" : "NO EXISTE"
    });
  } catch (error: any) {
    // Devolvemos el error EXACTO y completo
    console.error("DIAGNOSTICO ERROR:", error);
    return NextResponse.json({
      estado: "error_de_conexion",
      nombre: error.name,
      mensaje: error.message,
      stack: error.stack,
      urlDb: process.env.DATABASE_URL ? "Existe (longitud: " + process.env.DATABASE_URL.length + ")" : "NO EXISTE"
    }, { status: 500 });
  }
}
