import { RoutesRepository } from "../repositories/routes.repository";

export const RoutesService = {
  async listar(empresaId: string) {
    return RoutesRepository.findAll(empresaId);
  },

  async obtener(id: string, empresaId: string) {
    const ruta = await RoutesRepository.findById(id);
    if (!ruta) throw new Error(`Ruta ${id} no encontrada.`);
    if (ruta.empresaId !== empresaId) {
      throw new Error("No autorizado. La ruta pertenece a otra empresa.");
    }
    return ruta;
  },

  async crear(data: { empresaId: string; repartidorId: string; fecha: Date }) {
    if (!data.repartidorId) throw new Error("repartidorId es requerido.");
    return RoutesRepository.create(data);
  },

  async actualizarEstado(id: string, estado: string, empresaId: string) {
    const validos = ["planificada", "en_curso", "completada", "cancelada"];
    if (!validos.includes(estado)) {
      throw new Error(`Estado inválido. Válidos: ${validos.join(", ")}`);
    }
    const ruta = await RoutesRepository.findById(id);
    if (!ruta) throw new Error(`Ruta ${id} no encontrada.`);
    if (ruta.empresaId !== empresaId) {
      throw new Error("No autorizado. La ruta pertenece a otra empresa.");
    }
    return RoutesRepository.updateEstado(id, estado);
  },
};