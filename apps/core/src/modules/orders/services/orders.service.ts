import { OrdersRepository } from "../repositories/orders.repository";

// ── Service Layer ─────────────────────────────────────────────

export const OrdersService = {
  async listar(
    empresaId: string,
    filtros?: { estado?: string; repartidorId?: string }
  ) {
    return OrdersRepository.findAll(empresaId, filtros);
  },

  async obtener(id: string) {
    const pedido = await OrdersRepository.findById(id);
    if (!pedido) throw new Error(`Pedido ${id} no encontrado.`);
    return pedido;
  },

  async crear(data: {
    empresaId:        string;
    nombreCliente:    string;
    clienteTelefono?: string;
    direccion:        string;
    producto:         string;
    horarioPreferido?: string;
    lat?:             number;
    lng?:             number;
    scoreRiesgo?:     number;
    repartidorId?:    string;
  }) {
    if (!data.nombreCliente || !data.direccion || !data.producto) {
      throw new Error("nombreCliente, direccion y producto son requeridos.");
    }
    return OrdersRepository.create(data);
  },

  async actualizarEstado(id: string, estado: string) {
    const validEstados = ["pendiente", "en_ruta", "entregado", "fallido"];
    if (!validEstados.includes(estado)) {
      throw new Error(`Estado inválido. Válidos: ${validEstados.join(", ")}`);
    }
    return OrdersRepository.updateEstado(id, estado);
  },

  async eliminar(id: string) {
    await OrdersRepository.findById(id); // verifica que existe
    return OrdersRepository.delete(id);
  },
};