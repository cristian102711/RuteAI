import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable, RefreshControl } from 'react-native';
import { Colors, Spacing } from '../../../design/tokens';
import { PedidoCard } from '../../../components/domain/PedidoCard';
import { usePedidos } from '../../../hooks/usePedidos';
import { usePedidosStore } from '../../../stores/pedidos.store';
import { useRouter } from 'expo-router';
import type { EstadoPedido } from '@ruteai/shared-types';

const FILTROS = ['todos', 'pendiente', 'en_ruta', 'entregado', 'fallido'] as const;

export default function PedidosScreen() {
  const router = useRouter();
  const { data: pedidos, isLoading, refetch } = usePedidos();
  const filtroEstado = usePedidosStore((state) => state.filtroEstado);
  const setFiltroEstado = usePedidosStore((state) => state.setFiltroEstado);

  const filteredPedidos = pedidos?.filter(
    (p) => filtroEstado === 'todos' || p.estado === filtroEstado
  ) || [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Pedidos</Text>
        
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTROS}
          style={styles.filtersList}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.filterChip,
                filtroEstado === item && styles.filterChipActive,
              ]}
              onPress={() => setFiltroEstado(item as any)}
            >
              <Text
                style={[
                  styles.filterText,
                  filtroEstado === item && styles.filterTextActive,
                ]}
              >
                {item.toUpperCase().replace('_', ' ')}
              </Text>
            </Pressable>
          )}
        />
      </View>

      <FlatList
        data={filteredPedidos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Colors.primary} />
        }
        renderItem={({ item }) => (
          <PedidoCard
            pedido={item}
            onPress={() => router.push(`/(app)/pedidos/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No hay pedidos para este filtro.</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: Spacing.lg,
    paddingTop: Spacing.xxl,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  filtersList: {
    flexGrow: 0,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: Colors.primary,
  },
  filterText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: 'bold',
  },
  filterTextActive: {
    color: Colors.primary,
  },
  listContent: {
    padding: Spacing.lg,
  },
  emptyContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textMuted,
  },
});
