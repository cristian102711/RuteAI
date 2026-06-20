import { Router, Request, Response } from "express";
import { AuthService } from "../modules/auth/services/auth.service";

export const usersRouter = Router();

usersRouter.get("/users", async (req: Request, res: Response): Promise<void> => {
  // Verificar token Bearer — mismo patrón que GET /api/v1/auth/me
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ success: false, error: "Token no proporcionado" });
    return;
  }
  const token = authHeader.split(" ")[1];

  // Paso 1: validar el token y extraer el empresaId del caller
  let empresaIdCaller: string;
  try {
    const caller = await AuthService.verificarToken(token);
    empresaIdCaller = caller.empresaId;
  } catch (error) {
    res.status(401).json({
      success: false,
      error: error instanceof Error ? error.message : "Token inválido",
    });
    return;
  }

  // Paso 2: listar SOLO usuarios de esa empresa (el caller no controla el filtro)
  try {
    const users = await AuthService.listarUsuarios(empresaIdCaller);
    res.json({ success: true, data: users, total: users.length });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error interno";
    res.status(500).json({ success: false, error: msg });
  }
});
