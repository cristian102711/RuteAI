import { Router, Request, Response } from "express";
import { AuthService } from "../modules/auth/services/auth.service";
import { z } from "zod";

export const authRouter = Router();

const SignupSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(8),
});

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
    const msg = error instanceof Error ? error.message : "Error interno";
    res.status(500).json({ success: false, error: msg });
  }
});
