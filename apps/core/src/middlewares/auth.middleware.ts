import type { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma";

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

type ResolvedUser = NonNullable<Request["user"]>;

// ── Caché en memoria por token (#5) ───────────────────────────
// Evita validar contra auth-service + consultar la DB en CADA request.
// TTL corto para que los cambios de rol/empresa se reflejen pronto.
const TOKEN_TTL_MS = 30_000;
const tokenCache = new Map<string, { user: ResolvedUser; expiresAt: number }>();

function cacheGet(token: string): ResolvedUser | null {
  const hit = tokenCache.get(token);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    tokenCache.delete(token);
    return null;
  }
  return hit.user;
}

function cacheSet(token: string, user: ResolvedUser): void {
  tokenCache.set(token, { user, expiresAt: Date.now() + TOKEN_TTL_MS });
  // Limpieza oportunista para que el Map no crezca sin límite.
  if (tokenCache.size > 500) {
    const ahora = Date.now();
    for (const [k, v] of tokenCache) if (ahora > v.expiresAt) tokenCache.delete(k);
  }
}

/**
 * Resuelve el usuario autenticado:
 *  1) Valida el token contra auth-service (identidad Supabase: id + email).
 *  2) Usa la tabla Usuario de la DB como FUENTE DE VERDAD para empresaId/rol/
 *     nombre (#1). Así, aunque el user_metadata del token no traiga empresaId,
 *     el core obtiene el valor correcto y no responde 403 indebidamente.
 *  Si no hay fila en Usuario (p. ej. onboarding pendiente), cae a los valores
 *  del token.
 */
async function resolverUsuario(authHeader: string): Promise<ResolvedUser | null> {
  const response = await fetch(`${AUTH_SERVICE_URL}/api/v1/auth/me`, {
    method: "GET",
    headers: { Authorization: authHeader, "Content-Type": "application/json" },
  });
  if (!response.ok) return null;

  const data = (await response.json()) as AuthMeResponse;
  const base = data.success ? data.data?.usuario : undefined;
  if (!base) return null;

  // DB como fuente de verdad (por id Supabase; fallback por email)
  let dbUser = await prisma.usuario.findUnique({
    where: { id: base.id },
    select: { id: true, email: true, nombre: true, rol: true, empresaId: true },
  });
  if (!dbUser && base.email) {
    dbUser = await prisma.usuario.findUnique({
      where: { email: base.email },
      select: { id: true, email: true, nombre: true, rol: true, empresaId: true },
    });
  }

  return {
    id: base.id,
    email: dbUser?.email ?? base.email,
    nombre: dbUser?.nombre ?? base.nombre,
    rol: dbUser?.rol ?? base.rol,
    empresaId: dbUser?.empresaId ?? base.empresaId,
  };
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ success: false, error: "No autorizado. Token requerido." });
      return;
    }

    const token = authHeader.slice("Bearer ".length);

    let user = cacheGet(token);
    if (!user) {
      user = await resolverUsuario(authHeader);
      if (!user) {
        res.status(401).json({ success: false, error: "Token inválido o expirado" });
        return;
      }
      cacheSet(token, user);
    }

    req.user = user;
    next();
  } catch (error) {
    console.error(JSON.stringify({
      event: "core.auth.error",
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    }));
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
