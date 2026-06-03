import { coreApi } from '../lib/apiClient';
import type { IPedido, EstadoPedido } from '@ruteai/shared-types';

// GET /api/v1/orders
// El core-service extrae el empresaId del token JWT (auth middleware),
// por lo que no necesitamos enviarlo explícitamente.
export const getPedidos = (): Promise<IPedido[]> =>
  coreApi.get<IPedido[]>('/api/v1/orders');

// GET /api/v1/orders/:id
export const getPedidoById = (id: string): Promise<IPedido> =>
  coreApi.get<IPedido>(`/api/v1/orders/${id}`);

// PATCH /api/v1/orders/:id/estado
export const updateEstadoPedido = (
  id: string,
  estado: EstadoPedido,
): Promise<IPedido> =>
  coreApi.patch<IPedido>(`/api/v1/orders/${id}/estado`, { estado });
