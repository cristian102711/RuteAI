import { LocationsRepository } from "../repositories/locations.repository";

export const LocationsService = {
  async listar(empresaId: string) {
    return LocationsRepository.findAll(empresaId);
  },

  async registrar(data: {
    empresaId:    string;
    repartidorId: string;
    lat:          number;
    lng:          number;
    velocidad?:   number;
  }) {
    if (data.lat < -90 || data.lat > 90 || data.lng < -180 || data.lng > 180) {
      throw new Error("Coordenadas GPS inválidas.");
    }
    return LocationsRepository.create(data);
  },

  async ultimaUbicacion(repartidorId: string) {
    const ubicacion = await LocationsRepository.findLatestByRepartidor(repartidorId);
    if (!ubicacion) throw new Error(`Sin ubicación para repartidor ${repartidorId}`);
    return ubicacion;
  },
};