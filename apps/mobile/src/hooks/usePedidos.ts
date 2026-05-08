import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPedidos, getPedidoById, updateEstadoPedido } from '../services/pedidos.service';
import type { EstadoPedido } from '@ruteai/shared-types';

export const usePedidos = () => {
  return useQuery({
    queryKey: ['pedidos'],
    queryFn: getPedidos,
  });
};

export const usePedido = (id: string) => {
  return useQuery({
    queryKey: ['pedidos', id],
    queryFn: () => getPedidoById(id),
    enabled: !!id,
  });
};

export const useUpdateEstadoPedido = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: EstadoPedido }) => updateEstadoPedido(id, estado),
    onSuccess: (updatedPedido) => {
      // Invalidate both lists and single item cache
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos', updatedPedido.id] });
    },
  });
};
