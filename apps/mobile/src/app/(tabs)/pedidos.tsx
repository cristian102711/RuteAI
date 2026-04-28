import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Colors, Spacing } from "../../design/tokens";
import { Card } from "../../components/ui/Card";
import { MOCK_PEDIDOS } from "../../services/stubs/fixtures";
import { ChevronRight, Clock, MapPin } from "lucide-react-native";

export default function PedidosScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState("todos");

  const filteredPedidos = filter === "todos" 
    ? MOCK_PEDIDOS 
    : MOCK_PEDIDOS.filter(p => p.estado === filter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "entregado": return Colors.primary;
      case "en_ruta": return Colors.accentBlue;
      case "fallido": return Colors.accentRose;
      default: return Colors.accentAmber;
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity onPress={() => router.push(`/pedido/${item.id}`)}>
      <Card style={styles.pedidoCard}>
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.estado) + "20" }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.estado) }]}>
              {item.estado.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.timestamp}>Hace 2h</Text>
        </View>
        
        <Text style={styles.clientName}>{item.nombreCliente}</Text>
        
        <View style={styles.infoRow}>
          <MapPin size={14} color={Colors.textDim} />
          <Text style={styles.infoText} numberOfLines={1}>{item.direccion}</Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.infoRow}>
            <Clock size={14} color={Colors.textDim} />
            <Text style={styles.infoText}>Entrega hoy</Text>
          </View>
          <ChevronRight size={20} color={Colors.textDim} />
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.filterBar}>
        {["todos", "pendiente", "en_ruta", "entregado"].map((f) => (
          <TouchableOpacity 
            key={f} 
            onPress={() => setFilter(f)}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
          >
            <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1).replace("_", " ")}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredPedidos}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No hay pedidos para mostrar.</Text>
          </View>
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
  filterBar: {
    flexDirection: "row",
    padding: Spacing.md,
    gap: Spacing.sm,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  filterTab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterTabText: {
    color: Colors.textDim,
    fontSize: 12,
    fontWeight: "bold",
  },
  filterTabTextActive: {
    color: "#000",
  },
  listContent: {
    padding: Spacing.lg,
  },
  pedidoCard: {
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  timestamp: {
    fontSize: 10,
    color: Colors.textDim,
  },
  clientName: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  emptyState: {
    padding: Spacing.xxl,
    alignItems: "center",
  },
  emptyText: {
    color: Colors.textDim,
  },
});
