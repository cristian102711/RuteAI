import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";

// Tipo para extender el Request de Express con el usuario
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        nombre: string;
        rol: string;
        empresaId: string;
      };
    }
  }
}

// URL del microservicio de Auth (por defecto localhost:3002)
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL ?? 
  (process.env.NODE_ENV === 'production' 
    ? 'https://ruteai-auth.vercel.app' 
    : 'http://localhost:3002');

// Tipo de la respuesta del endpoint /api/v1/auth/me
interface AuthMeResponse {
  success: boolean;
  data?: {
    usuario: {
      id: string;
      email: string;
      nombre: string;
      rol: string;
      empresaId: string;
    };
  };
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      logger.warn("Intento de acceso sin token Bearer");
      res.status(401).json({ success: false, error: "No autorizado. Token requerido." });
      return;
    }

    // Interrogar al microservicio Auth
    const response = await fetch(`${AUTH_SERVICE_URL}/api/v1/auth/me`, {
      method: "GET",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      logger.warn("Fallo de autenticación con el servicio de auth");
      res.status(401).json({ success: false, error: "Token inválido o expirado" });
      return;
    }

    const data = await response.json() as AuthMeResponse;
    if (!data.success || !data.data?.usuario) {
      logger.warn("Servicio de auth no retornó datos de usuario válidos");
      res.status(401).json({ success: false, error: "Token inválido" });
      return;
    }

    // Inyectar el usuario validado en la Request
    req.user = data.data.usuario;
    
    logger.info("Usuario autenticado en Core", {
      userId: req.user.id,
      email: req.user.email,
      rol: req.user.rol,
      empresaId: req.user.empresaId,
    });

    next();
  } catch (error) {
    logger.error("Excepción en requireAuth middleware", error);
    res.status(500).json({ success: false, error: "Error validando la sesión" });
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: "No autorizado" });
      return;
    }
    if (!allowedRoles.includes(req.user.rol)) {
      res.status(403).json({ success: false, error: "Acceso denegado. Rol insuficiente." });
      return;
    }
    next();
  };
}
