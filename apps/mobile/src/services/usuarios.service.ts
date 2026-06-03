import { authApi } from '../lib/apiClient';
import type { IUsuario } from '@ruteai/shared-types';

// Respuesta exacta que devuelve POST /api/v1/auth/login del auth-service
export interface LoginResponse {
  usuario: {
    id: string;
    email: string;
    nombre: string;
    rol: string;
    empresaId: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export const loginUsuario = (
  email: string,
  password: string,
): Promise<LoginResponse> =>
  authApi.post<LoginResponse>('/api/v1/auth/login', { email, password });

// Convertir la respuesta del auth-service al tipo IUsuario de shared-types
export const mapToIUsuario = (data: LoginResponse['usuario']): IUsuario => ({
  id: data.id,
  email: data.email,
  nombre: data.nombre,
  rol: data.rol as IUsuario['rol'],
  empresaId: data.empresaId,
  createdAt: new Date(),
});
