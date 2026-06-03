import { coreApi } from '../lib/apiClient';
import type { IRuta, EstadoRuta } from '@ruteai/shared-types';

// GET /api/v1/routes?empresaId=xxx
// El endpoint de rutas filtra por empresa. Filtramos por repartidor en el cliente
// porque el core no expone un endpoint /routes?repartidorId=xxx.
export const getRutas = (empresaId: string): Promise<IRuta[]> =>
  coreApi.get<IRuta[]>(`/api/v1/routes?empresaId=${encodeURIComponent(empresaId)}`);

// Devuelve la primera ruta activa o pendiente del repartidor para el día de hoy.
export const getRutaActiva = async (
  empresaId: string,
  repartidorId: string,
): Promise<IRuta | null> => {
  const rutas = await getRutas(empresaId);
  const hoy = new Date().toDateString();

  return (
    rutas.find(
      (r) =>
        r.repartidorId === repartidorId &&
        (r.estado === 'activa' || r.estado === 'pendiente') &&
        new Date(r.fecha).toDateString() === hoy,
    ) ?? null
  );
};

// GET /api/v1/routes/:id
export const getRutaById = (id: string): Promise<IRuta> =>
  coreApi.get<IRuta>(`/api/v1/routes/${id}`);

// PATCH /api/v1/routes/:id/estado
export const updateEstadoRuta = (
  id: string,
  estado: EstadoRuta,
): Promise<IRuta> =>
  coreApi.patch<IRuta>(`/api/v1/routes/${id}/estado`, { estado });
