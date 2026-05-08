import { IPedido, IAlerta, IUsuario } from "@ruteai/shared-types";

export const MOCK_USER: IUsuario = {
  id: "repartidor-123",
  nombre: "Juan Repartidor",
  email: "juan@ruteai.com",
  rol: "repartidor",
  empresaId: "empresa-alpha",
  createdAt: new Date(),
};

export const MOCK_PEDIDOS: IPedido[] = [
  {
    id: "p1",
    nombreCliente: "Ana García",
    direccion: "Av. Providencia 1234, Santiago",
    producto: "Laptop Dell XPS 15",
    estado: "pendiente",
    empresaId: "empresa-alpha",
    repartidorId: "repartidor-123",
    scoreRiesgo: 0.15,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "p2",
    nombreCliente: "Pedro Soto",
    direccion: "Alameda 456, Santiago",
    producto: "Monitor LG 27\"",
    estado: "en_ruta",
    empresaId: "empresa-alpha",
    repartidorId: "repartidor-123",
    scoreRiesgo: 0.45,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "p3",
    nombreCliente: "Marta López",
    direccion: "Las Condes 789, Santiago",
    producto: "Silla Ergonómica",
    estado: "entregado",
    empresaId: "empresa-alpha",
    repartidorId: "repartidor-123",
    scoreRiesgo: 0.05,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const MOCK_ALERTAS: IAlerta[] = [
  {
    id: "a1",
    tipo: "riesgo_alto",
    mensaje: "Pedido p2 presenta riesgo por zona de alta congestión",
    leida: false,
    empresaId: "empresa-alpha",
    repartidorId: "repartidor-123",
    pedidoId: "p2",
    createdAt: new Date(),
  },
];
