import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "../services/auth.service";
import { z } from "zod";

const SignupSchema = z.object({
  email:    z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

// ── Controller Layer ──────────────────────────────────────────
// Solo maneja HTTP: parsea input, llama al Service, devuelve respuesta.
// NO contiene lógica de negocio.

export async function signupController(req: NextRequest) {
  try {
    const body   = await req.json();
    const parsed = SignupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const usuario = await AuthService.registrarUsuario(email, password);

    return NextResponse.json({ success: true, data: usuario }, { status: 201 });

  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}