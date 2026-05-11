import { Router, Request, Response } from "express";
import { AuthService } from "../modules/auth/services/auth.service";
import { z } from "zod";

export const authRouter = Router();

const SignupSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(8),
});

const LoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

const RefreshSchema = z.object({
  refreshToken: z.string().min(1),
});

// POST /api/v1/auth/signup
authRouter.post("/signup", async (req: Request, res: Response) => {
  try {
    const parsed = SignupSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: "Datos inválidos", details: parsed.error.flatten() });
      return;
    }
    const usuario = await AuthService.registrarUsuario(parsed.data.email, parsed.data.password);
    res.status(201).json({ success: true, data: usuario });
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
