import type { IRuta } from '@ruteai/shared-types';

export const getRutaActiva = async (repartidorId: string): Promise<IRuta | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: 'ruta-1',
        fecha: new Date(),
        estado: 'activa',
        empresaId: 'empresa-1',
        repartidorId,
        createdAt: new Date(),
        updatedAt: new Date(),
        rutaOptimizada: {
          stops: [
            { id: 'ped-1', lat: -33.4285, lng: -70.6120 },
            { id: 'ped-2', lat: -33.4350, lng: -70.6866 },
          ]
        }
      });
    }, 1200);
  });
};
