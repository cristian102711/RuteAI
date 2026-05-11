import { Router, Request, Response } from "express";
import { AuthService } from "../modules/auth/services/auth.service";

export const usersRouter = Router();

usersRouter.get("/users", async (_req: Request, res: Response) => {
  try {
    const users = await AuthService.listarUsuarios();
    res.json({ success: true, data: users, total: users.length });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error interno";
    res.status(500).json({ success: false, error: msg });
  }
});
