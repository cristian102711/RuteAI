// =============================================================================
//  Auth Store — RouteAI Mobile
// -----------------------------------------------------------------------------
//  Estado global de autenticación con:
//    - Tokens de sesión (accessToken + refreshToken)
//    - Persistencia cifrada via expo-secure-store
//    - Refresh automático de tokens (llamado por apiClient en 401)
//    - initSession(): restaura sesión al arrancar la app
//
//  El refreshSession() hace un fetch() directo al auth-service (sin usar
//  apiClient) para evitar dependencia circular.
// =============================================================================

import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { IUsuario } from '@ruteai/shared-types';

const SESSION_KEY = 'ruteai_session_v1';
const AUTH_BASE = process.env.EXPO_PUBLIC_AUTH_URL ?? 'http://localhost:3002';

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface StoredSession {
  user: IUsuario;
  tokens: Tokens;
}

interface AuthState {
  user: IUsuario | null;
  tokens: Tokens | null;
  isLoading: boolean;
  isInitialized: boolean;

  // Restaurar sesión desde SecureStore (llamar al arrancar la app)
  initSession: () => Promise<void>;

  // Guardar sesión tras login exitoso
  login: (user: IUsuario, tokens: Tokens) => Promise<void>;

  // Cerrar sesión y limpiar storage
  logout: () => Promise<void>;

  // Refrescar accessToken via auth-service. Retorna true si tuvo éxito.
  // Llamado automáticamente por apiClient cuando recibe 401.
  refreshSession: () => Promise<boolean>;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  tokens: null,
  isLoading: false,
  isInitialized: false,

  initSession: async () => {
    set({ isLoading: true });
    try {
      const raw = await SecureStore.getItemAsync(SESSION_KEY);
      if (raw) {
        const session: StoredSession = JSON.parse(raw);
        // Restaurar con fechas correctas (JSON.parse convierte Date a string)
        const user: IUsuario = {
          ...session.user,
          createdAt: new Date(session.user.createdAt),
        };
        set({ user, tokens: session.tokens });
      }
    } catch {
      // Si SecureStore falla (primer arranque, dato corrupto), empezar limpio
    } finally {
      set({ isLoading: false, isInitialized: true });
    }
  },

  login: async (user, tokens) => {
    const session: StoredSession = { user, tokens };
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
    set({ user, tokens });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(SESSION_KEY);
    set({ user: null, tokens: null });
  },

  refreshSession: async () => {
    const { tokens, user } = get();
    if (!tokens?.refreshToken) return false;

    try {
      const response = await fetch(`${AUTH_BASE}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });

      if (!response.ok) return false;

      const body = await response.json();
      if (!body.success || !body.data) return false;

      const newTokens: Tokens = {
        accessToken: body.data.accessToken,
        refreshToken: body.data.refreshToken,
        expiresIn: body.data.expiresIn,
      };

      // Persistir sesión actualizada
      if (user) {
        await SecureStore.setItemAsync(
          SESSION_KEY,
          JSON.stringify({ user, tokens: newTokens }),
        );
      }

      set({ tokens: newTokens });
      return true;
    } catch {
      return false;
    }
  },
}));
