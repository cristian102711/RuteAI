import { Redirect } from 'expo-router';
import { useAuthStore } from '../stores/auth.store';

export default function Index() {
  const user = useAuthStore((state) => state.user);

  // _layout.tsx espera a isInitialized antes de renderizar esta pantalla,
  // así que aquí el estado ya es definitivo (no hay flash de redirect).
  if (user) {
    return <Redirect href="/(app)/dashboard" />;
  }

  return <Redirect href="/(auth)/login" />;
}
