import type { Request, Response, NextFunction } from "express";

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

// URL del microservicio de Auth
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL;

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
      res.status(401).json({ success: false, error: "No autorizado. Token requerido." });
      return;
    }

    if (process.env.NODE_ENV === 'production' && !AUTH_SERVICE_URL) {
      console.error('[CONFIG] AUTH_SERVICE_URL no está definida.');
      res.status(500).json({ success: false, error: 'Configuración del servidor incompleta' });
      return;
    }
    const finalAuthUrl = AUTH_SERVICE_URL || 'http://localhost:3002';

    // Interrogar al microservicio Auth
    const response = await fetch(`${finalAuthUrl}/api/v1/auth/me`, {
      method: "GET",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      res.status(401).json({ success: false, error: "Token inválido o expirado" });
      return;
    }

    const data = await response.json() as AuthMeResponse;
    if (!data.success || !data.data?.usuario) {
      res.status(401).json({ success: false, error: "Token inválido" });
      return;
    }

    // Inyectar el usuario validado en la Request
    req.user = data.data.usuario;
    next();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      res.status(503).json({ success: false, error: 'Servicio de autenticación no disponible' });
      return;
    }
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
