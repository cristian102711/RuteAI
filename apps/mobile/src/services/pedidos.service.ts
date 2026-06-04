import type { IPedido, EstadoPedido } from '@ruteai/shared-types';

const MOCK_PEDIDOS: IPedido[] = [
  {
    id: 'ped-1',
    nombreCliente: 'María González',
    clienteTelefono: '+56987654321',
    direccion: 'Avenida Providencia 1234, Providencia',
    lat: -33.4285,
    lng: -70.6120,
    producto: 'Caja de Vinos Premium',
    estado: 'pendiente',
    scoreRiesgo: 0.2, // Bajo
    empresaId: 'empresa-1',
    repartidorId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'ped-2',
    nombreCliente: 'Carlos Soto',
    clienteTelefono: '+56911223344',
    direccion: 'San Pablo 4500, Quinta Normal',
    lat: -33.4350,
    lng: -70.6866,
    producto: 'Electrónica',
    estado: 'en_ruta',
    scoreRiesgo: 0.8, // Alto
    empresaId: 'empresa-1',
    repartidorId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'ped-3',
    nombreCliente: 'Ana Silva',
    direccion: 'Apoquindo 5000, Las Condes',
    lat: -33.4110,
    lng: -70.5750,
    producto: 'Ropa',
    estado: 'entregado',
    scoreRiesgo: 0.5, // Medio
    empresaId: 'empresa-1',
    repartidorId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

export const getPedidos = async (): Promise<IPedido[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(MOCK_PEDIDOS);
    }, 800);
  });
};

export const getPedidoById = async (id: string): Promise<IPedido | undefined> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(MOCK_PEDIDOS.find(p => p.id === id));
    }, 600);
  });
};

export const updateEstadoPedido = async (id: string, estado: EstadoPedido): Promise<IPedido> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const pedido = MOCK_PEDIDOS.find(p => p.id === id);
      if (pedido) {
        pedido.estado = estado;
        pedido.updatedAt = new Date();
        resolve({ ...pedido });
      } else {
        reject(new Error('Pedido no encontrado'));
      }
    }, 1000);
  });
};
