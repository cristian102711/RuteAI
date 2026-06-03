import { coreApi } from '../lib/apiClient';

interface RegisterLocationInput {
  empresaId: string;
  repartidorId: string;
  lat: number;
  lng: number;
  velocidad?: number;
}

// POST /api/v1/locations
// Registra el ping GPS del repartidor. Llamado cada 5 segundos desde mapa.tsx.
// No retorna datos útiles para la UI; ignoramos el resultado.
export const registrarUbicacion = (input: RegisterLocationInput): Promise<unknown> =>
  coreApi.post('/api/v1/locations', input);
