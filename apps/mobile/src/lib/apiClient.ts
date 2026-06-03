// =============================================================================
//  API Client — RouteAI Mobile
// -----------------------------------------------------------------------------
//  Cliente HTTP centralizado para comunicarse con los microservicios:
//    - authApi  → apps/auth  (AUTH_SERVICE_URL)
//    - coreApi  → apps/core  (CORE_SERVICE_URL)
//
//  Flujo de autenticación:
//    1. Adjunta `Authorization: Bearer <accessToken>` en cada request
//    2. Si recibe 401, intenta refresh automático via auth-service
//    3. Si el refresh falla, cierra la sesión del usuario
//    4. Si el refresh tiene éxito, reintenta el request original una vez
//
//  El token se lee de useAuthStore (Zustand), que funciona fuera de React
//  gracias a `.getState()`.
// =============================================================================

import { useAuthStore } from '../stores/auth.store';

const AUTH_BASE = process.env.EXPO_PUBLIC_AUTH_URL ?? 'http://localhost:3002';
const CORE_BASE = process.env.EXPO_PUBLIC_CORE_URL ?? 'http://localhost:3003';

// Shape que devuelven TODOS los endpoints de auth y core
interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  total?: number;
}

// ── Función base ─────────────────────────────────────────────────────────────

async function request<T>(
  base: string,
  path: string,
  options: RequestInit = {},
  isRetry = false,
): Promise<T> {
  const token = useAuthStore.getState().tokens?.accessToken;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers ?? {}),
  };

  const response = await fetch(`${base}${path}`, { ...options, headers });

  // ── Token expirado: intentar refresh y reintentar ─────────────────────────
  if (response.status === 401 && !isRetry) {
    const refreshed = await useAuthStore.getState().refreshSession();

    if (refreshed) {
      // Reintentar con el nuevo token (isRetry=true para no entrar en bucle)
      return request<T>(base, path, options, true);
    } else {
      // Refresh fallido → cerrar sesión y lanzar error legible
      await useAuthStore.getState().logout();
      throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
    }
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({})) as ServiceResponse<T>;
    throw new Error(errorBody.error ?? `Error del servidor (${response.status})`);
  }

  const body: ServiceResponse<T> = await response.json();

  if (!body.success) {
    throw new Error(body.error ?? 'Error inesperado del servidor');
  }

  return body.data as T;
}

// ── Clientes públicos ─────────────────────────────────────────────────────────

export const authApi = {
  get: <T>(path: string) =>
    request<T>(AUTH_BASE, path, { method: 'GET' }),

  post: <T>(path: string, body: unknown) =>
    request<T>(AUTH_BASE, path, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};

export const coreApi = {
  get: <T>(path: string) =>
    request<T>(CORE_BASE, path, { method: 'GET' }),

  post: <T>(path: string, body: unknown) =>
    request<T>(CORE_BASE, path, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  patch: <T>(path: string, body: unknown) =>
    request<T>(CORE_BASE, path, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  delete: <T>(path: string) =>
    request<T>(CORE_BASE, path, { method: 'DELETE' }),
};
