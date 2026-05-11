import { NextResponse } from "next/server";
import { AuthService } from "@/modules/auth/services/auth.service";

export async function GET() {
  try {
    const users = await AuthService.listarUsuarios();
    return NextResponse.json({ success: true, data: users, total: users.length });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}