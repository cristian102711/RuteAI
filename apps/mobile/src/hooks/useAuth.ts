import { useMutation } from '@tanstack/react-query';
import { loginUsuario, mapToIUsuario } from '../services/usuarios.service';
import { useAuthStore } from '../stores/auth.store';

export const useAuth = () => {
  const { login, logout, user, isLoading } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      loginUsuario(email, password),
    onSuccess: async (data) => {
      const usuario = mapToIUsuario(data.usuario);
      await login(usuario, data.tokens);
    },
  });

  return {
    login: loginMutation.mutateAsync,
    logout,
    isLoading: loginMutation.isPending || isLoading,
    error: loginMutation.error,
    user,
  };
};
