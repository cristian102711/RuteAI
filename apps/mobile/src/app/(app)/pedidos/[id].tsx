import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing } from '../../../design/tokens';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { usePedido, useUpdateEstadoPedido } from '../../../hooks/usePedidos';
import { RiskBadge } from '../../../components/domain/RiskBadge';
import { User, Phone, MapPin, Box, Clock } from 'lucide-react-native';

export default function PedidoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: pedido, isLoading } = usePedido(id!);
  const updateEstado = useUpdateEstadoPedido();

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.textMuted}>Cargando pedido...</Text>
      </View>
    );
  }

  if (!pedido) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.textMuted}>Pedido no encontrado</Text>
        <Button title="Volver" onPress={() => router.back()} style={{ marginTop: 16 }} />
      </View>
    );
  }

  const handleEntregar = async () => {
    try {
      await updateEstado.mutateAsync({ id: pedido.id, estado: 'entregado' });
      Alert.alert('Éxito', 'Pedido marcado como entregado');
      router.back();
    } catch (e) {
      Alert.alert('Error', 'No se pudo actualizar el estado');
    }
  };

  const handleFallido = async () => {
    try {
      await updateEstado.mutateAsync({ id: pedido.id, estado: 'fallido' });
      Alert.alert('Aviso', 'Pedido marcado como fallido');
      router.back();
    } catch (e) {
      Alert.alert('Error', 'No se pudo actualizar el estado');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Detalle del Pedido</Text>
        <RiskBadge score={pedido.scoreRiesgo} />
      </View>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Información del Cliente</Text>
        
        <View style={styles.row}>
          <User size={20} color={Colors.textMuted} />
          <Text style={styles.text}>{pedido.nombreCliente}</Text>
        </View>

        {pedido.clienteTelefono && (
          <View style={styles.row}>
            <Phone size={20} color={Colors.textMuted} />
            <Text style={styles.text}>{pedido.clienteTelefono}</Text>
          </View>
        )}

        <View style={styles.row}>
          <MapPin size={20} color={Colors.textMuted} />
          <Text style={styles.text}>{pedido.direccion}</Text>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Detalles del Envío</Text>
        
        <View style={styles.row}>
          <Box size={20} color={Colors.textMuted} />
          <Text style={styles.text}>{pedido.producto}</Text>
        </View>

        <View style={styles.row}>
          <Clock size={20} color={Colors.textMuted} />
          <Text style={styles.text}>Horario Preferido: {pedido.horarioPreferido || 'Cualquiera'}</Text>
        </View>
      </Card>

      {pedido.estado !== 'entregado' && pedido.estado !== 'fallido' && (
        <View style={styles.actions}>
          <Button
            title="Confirmar Entrega"
            onPress={handleEntregar}
            loading={updateEstado.isPending}
            style={styles.btnEntregar}
          />
          <Button
            title="Reportar Problema"
            onPress={handleFallido}
            variant="outline"
            disabled={updateEstado.isPending}
            style={styles.btnFallido}
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  card: {
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  text: {
    color: Colors.textMuted,
    fontSize: 16,
    flex: 1,
  },
  textMuted: {
    color: Colors.textMuted,
  },
  actions: {
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  btnEntregar: {
    backgroundColor: Colors.primary,
  },
  btnFallido: {
    borderColor: Colors.accentRose,
  },
});
