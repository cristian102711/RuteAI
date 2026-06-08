import { OrdersRepository } from "../repositories/orders.repository";

// ── Service Layer ─────────────────────────────────────────────

export const OrdersService = {
  async listar(empresaId: string) {
    return OrdersRepository.findAll(empresaId);
  },

  async obtener(id: string, empresaId: string) {
    const pedido = await OrdersRepository.findById(id);
    if (!pedido) throw new Error(`Pedido ${id} no encontrado.`);
    if (pedido.empresaId !== empresaId) {
      throw new Error("No autorizado. El pedido pertenece a otra empresa.");
    }
    return pedido;
  },

  async crear(data: {
    empresaId:       string;
    nombreCliente:   string;
    clienteTelefono?: string;
    direccion:       string;
    producto:        string;
    lat?:            number;
    lng?:            number;
  }) {
    if (!data.nombreCliente || !data.direccion || !data.producto) {
      throw new Error("nombreCliente, direccion y producto son requeridos.");
    }
    return OrdersRepository.create(data);
  },

  async actualizarEstado(id: string, estado: string, empresaId: string) {
    const validEstados = ["pendiente", "en_ruta", "entregado", "fallido"];
    if (!validEstados.includes(estado)) {
      throw new Error(`Estado inválido. Válidos: ${validEstados.join(", ")}`);
    }
    const pedido = await OrdersRepository.findById(id);
    if (!pedido) throw new Error(`Pedido ${id} no encontrado.`);
    if (pedido.empresaId !== empresaId) {
      throw new Error("No autorizado. El pedido pertenece a otra empresa.");
    }
    return OrdersRepository.updateEstado(id, estado);
  },

  async eliminar(id: string, empresaId: string) {
    const pedido = await OrdersRepository.findById(id); // verifica que existe
    if (!pedido) throw new Error(`Pedido ${id} no encontrado.`);
    if (pedido.empresaId !== empresaId) {
      throw new Error("No autorizado. El pedido pertenece a otra empresa.");
    }
    return OrdersRepository.delete(id);
  },
};