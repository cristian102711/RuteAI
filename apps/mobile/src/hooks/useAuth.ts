import { useMutation } from '@tanstack/react-query';
import { loginUsuario } from '../services/usuarios.service';
import { useAuthStore } from '../stores/auth.store';

export const useAuth = () => {
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: Record<string, string>) => loginUsuario(email, password),
    onSuccess: (user) => {
      login(user);
    },
  });

  return {
    login: loginMutation.mutateAsync,
    logout,
    isLoading: loginMutation.isPending,
    error: loginMutation.error,
  };
};
