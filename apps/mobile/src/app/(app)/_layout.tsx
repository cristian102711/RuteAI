import React from 'react';
import { Redirect, Tabs as ExpoTabs } from 'expo-router';
import { useAuthStore } from '../../stores/auth.store';
import { Colors } from '../../design/tokens';
import { Home, Package, Map } from 'lucide-react-native';

export default function AppLayout() {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <ExpoTabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
      }}
    >
      <ExpoTabs.Screen
        name="dashboard"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <ExpoTabs.Screen
        name="pedidos"
        options={{
          title: 'Pedidos',
          tabBarIcon: ({ color, size }) => <Package color={color} size={size} />,
        }}
      />
      <ExpoTabs.Screen
        name="mapa"
        options={{
          title: 'Ruta',
          tabBarIcon: ({ color, size }) => <Map color={color} size={size} />,
        }}
      />
    </ExpoTabs>
  );
}
