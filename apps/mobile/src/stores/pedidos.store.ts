import { create } from 'zustand';
import type { EstadoPedido } from '@ruteai/shared-types';

interface PedidosState {
  filtroEstado: EstadoPedido | 'todos';
  searchQuery: string;
  setFiltroEstado: (estado: EstadoPedido | 'todos') => void;
  setSearchQuery: (query: string) => void;
}

export const usePedidosStore = create<PedidosState>((set) => ({
  filtroEstado: 'todos',
  searchQuery: '',
  setFiltroEstado: (estado) => set({ filtroEstado: estado }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
