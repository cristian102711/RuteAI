import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors, Spacing } from '../../design/tokens';
import { Card } from '../ui/Card';
import { MapPin, Box } from 'lucide-react-native';
import { RiskBadge } from './RiskBadge';
import type { IPedido } from '@ruteai/shared-types';

interface PedidoCardProps {
  pedido: IPedido;
  onPress: () => void;
}

export const PedidoCard: React.FC<PedidoCardProps> = ({ pedido, onPress }) => {
  return (
    <Pressable onPress={onPress} style={styles.pressable}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.cliente}>{pedido.nombreCliente}</Text>
          <RiskBadge score={pedido.scoreRiesgo} />
        </View>

        <View style={styles.row}>
          <MapPin size={16} color={Colors.textMuted} />
          <Text style={styles.text} numberOfLines={1}>
            {pedido.direccion}
          </Text>
        </View>

        <View style={styles.row}>
          <Box size={16} color={Colors.textMuted} />
          <Text style={styles.text}>{pedido.producto}</Text>
        </View>

        <View style={styles.footer}>
          <View style={[styles.statusBadge, { borderColor: getStatusColor(pedido.estado) }]}>
            <Text style={[styles.statusText, { color: getStatusColor(pedido.estado) }]}>
              {pedido.estado.toUpperCase().replace('_', ' ')}
            </Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
};

const getStatusColor = (estado: string) => {
  switch (estado) {
    case 'pendiente': return Colors.accentAmber;
    case 'en_ruta': return Colors.accentBlue;
    case 'entregado': return Colors.primary;
    case 'fallido': return Colors.accentRose;
    default: return Colors.textMuted;
  }
};

const styles = StyleSheet.create({
  pressable: {
    marginBottom: Spacing.md,
  },
  card: {
    gap: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  cliente: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  text: {
    color: Colors.textMuted,
    fontSize: 14,
    flex: 1,
  },
  footer: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});
