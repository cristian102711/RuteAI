import { LocationsRepository } from "../repositories/locations.repository";
import prisma from "../../../lib/prisma";

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
  }, empresaId: string) {
    if (data.empresaId !== empresaId) {
      throw new Error("No autorizado. Empresa incorrecta.");
    }
    if (data.lat < -90 || data.lat > 90 || data.lng < -180 || data.lng > 180) {
      throw new Error("Coordenadas GPS inválidas.");
    }
    return LocationsRepository.create(data);
  },

  async ultimaUbicacion(repartidorId: string, empresaId: string) {
    // Verificar que el repartidor pertenece a la empresa
    const repartidor = await prisma.usuario.findUnique({
      where: { id: repartidorId },
      select: { empresaId: true },
    });
    if (!repartidor) {
      throw new Error(`Repartidor ${repartidorId} no encontrado.`);
    }
    if (repartidor.empresaId !== empresaId) {
      throw new Error("No autorizado. El repartidor pertenece a otra empresa.");
    }

    const ubicacion = await LocationsRepository.findLatestByRepartidor(repartidorId);
    if (!ubicacion) throw new Error(`Sin ubicación para repartidor ${repartidorId}`);
    return ubicacion;
  },
};