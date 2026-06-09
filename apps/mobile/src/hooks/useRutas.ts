import { useQuery } from '@tanstack/react-query';
import { getRutaActiva } from '../services/rutas.service';
import { useAuthStore } from '../stores/auth.store';

export const useRutas = () => {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: ['rutaActiva', user?.id],
    queryFn: () => getRutaActiva(user?.id || ''),
    enabled: !!user?.id,
  });
};
