import { Router, Request, Response } from "express";
import { AuthService } from "../modules/auth/services/auth.service";
import { z } from "zod";

export const authRouter = Router();

const SignupSchema = z.object({
  email:     z.string().email(),
  password:  z.string().min(8),
  nombre:    z.string().min(1).default("Usuario"),
  rol:       z.enum(["super_admin", "encargado", "repartidor"]).default("encargado"),
  empresaId: z.string().default(""),
});

const LoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

const RefreshSchema = z.object({
  refreshToken: z.string().min(1),
});

const LogSchema = z.object({
  evento:    z.string(),
  userId:    z.string(),
  email:     z.string(),
  provider:  z.string(),
  status:    z.string(),
  error:     z.string().optional(),
  timestamp: z.string(),
});

// POST /api/v1/auth/signup
authRouter.post("/signup", async (req: Request, res: Response) => {
  try {
    const parsed = SignupSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: "Datos inválidos", details: parsed.error.flatten() });
      return;
    }
    const { email, password, nombre, rol, empresaId } = parsed.data;
    const usuario = await AuthService.registrarUsuario(email, password, { nombre, rol, empresaId });
    res.status(201).json({ success: true, data: { usuario } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Error interno" });
  }
});

// POST /api/v1/auth/login
authRouter.post("/login", async (req: Request, res: Response) => {
  try {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: "Datos inválidos", details: parsed.error.flatten() });
      return;
    }
    const resultado = await AuthService.iniciarSesion(parsed.data.email, parsed.data.password);
    res.status(200).json({ success: true, data: resultado });
  } catch (error) {
    res.status(401).json({ success: false, error: error instanceof Error ? error.message : "Error de autenticación" });
  }
});

// POST /api/v1/auth/refresh
authRouter.post("/refresh", async (req: Request, res: Response) => {
  try {
    const parsed = RefreshSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: "refreshToken requerido" });
      return;
    }
    const tokens = await AuthService.refrescarSesion(parsed.data.refreshToken);
    res.status(200).json({ success: true, data: tokens });
  } catch (error) {
    res.status(401).json({ success: false, error: error instanceof Error ? error.message : "Token inválido" });
  }
});

// GET /api/v1/auth/me
// Endpoint para que otros microservicios validen el token
authRouter.get("/me", async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ success: false, error: "Token no proporcionado" });
      return;
    }
    const token = authHeader.split(" ")[1];
    const usuario = await AuthService.verificarToken(token);
    res.status(200).json({ success: true, data: { usuario } });
  } catch (error) {
    res.status(401).json({ success: false, error: error instanceof Error ? error.message : "Token inválido" });
  }
});

// POST /api/v1/auth/logs
authRouter.post("/logs", async (req: Request, res: Response) => {
  try {
    const parsed = LogSchema.safeParse(req.body);
    if (!parsed.success) {
      console.warn(JSON.stringify({
        event: "auth.logs.invalid_payload",
        errors: parsed.error.flatten(),
        timestamp: new Date().toISOString(),
      }));
      res.status(400).json({ success: false, error: "Datos de log inválidos", details: parsed.error.flatten() });
      return;
    }

    const { evento, userId, email, provider, status, error, timestamp } = parsed.data;

    // Log estructurado — visible en Vercel → ruteai-auth → Functions logs
    console.log(JSON.stringify({
      event: `auth.event.${status}`,
      evento,
      userId,
      email,
      provider,
      status,
      ...(error ? { error } : {}),
      timestamp,
      receivedAt: new Date().toISOString(),
    }));

    // Guardar en la base de datos (LogAcceso)
    const dbEstado = status === "success" ? "exito" : "error";
    const dbDetalles = `Evento: ${evento} | Proveedor: ${provider}${error ? ` | Error: ${error}` : ""}`;
    await AuthService.registrarLog(email, dbEstado, dbDetalles);

    res.status(200).json({ success: true });
  } catch (err) {
    console.error(JSON.stringify({
      event: "auth.logs.handler_error",
      error: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    }));
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Error al procesar log" });
  }
});
