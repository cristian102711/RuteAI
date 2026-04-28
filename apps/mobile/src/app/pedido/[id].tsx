import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Colors, Spacing } from "../../design/tokens";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { MOCK_PEDIDOS } from "../../services/stubs/fixtures";
import { MapPin, User, Package, AlertTriangle, CheckCircle } from "lucide-react-native";

export default function PedidoDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const pedido = MOCK_PEDIDOS.find(p => p.id === id) || MOCK_PEDIDOS[0];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.orderId}>PEDIDO #{pedido.id.toUpperCase()}</Text>
        <View style={styles.statusRow}>
          <View style={[styles.dot, { backgroundColor: pedido.estado === "entregado" ? Colors.primary : Colors.accentAmber }]} />
          <Text style={styles.statusText}>{pedido.estado.replace("_", " ").toUpperCase()}</Text>
        </View>
      </View>

      <Card variant="solid" style={styles.infoCard}>
        <View style={styles.row}>
          <User size={20} color={Colors.textDim} />
          <View style={styles.rowContent}>
            <Text style={styles.label}>Cliente</Text>
            <Text style={styles.value}>{pedido.nombreCliente}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <MapPin size={20} color={Colors.textDim} />
          <View style={styles.rowContent}>
            <Text style={styles.label}>Dirección de Entrega</Text>
            <Text style={styles.value}>{pedido.direccion}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Package size={20} color={Colors.textDim} />
          <View style={styles.rowContent}>
            <Text style={styles.label}>Producto</Text>
            <Text style={styles.value}>{pedido.producto}</Text>
          </View>
        </View>
      </Card>

      <View style={styles.riskContainer}>
        <View style={styles.riskHeader}>
          <AlertTriangle size={18} color={pedido.scoreRiesgo && pedido.scoreRiesgo > 0.4 ? Colors.accentRose : Colors.primary} />
          <Text style={styles.riskTitle}>Puntuación de Riesgo IA</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { 
            width: `${(pedido.scoreRiesgo || 0.1) * 100}%`,
            backgroundColor: pedido.scoreRiesgo && pedido.scoreRiesgo > 0.4 ? Colors.accentRose : Colors.primary
          }]} />
        </View>
        <Text style={styles.riskLabel}>
          {pedido.scoreRiesgo && pedido.scoreRiesgo > 0.4 ? "Riesgo Moderado" : "Riesgo Bajo"} · {Math.round((pedido.scoreRiesgo || 0) * 100)}%
        </Text>
      </View>

      <View style={styles.actions}>
        {pedido.estado === "pendiente" && (
          <Button 
            title="Iniciar Entrega (En Ruta)" 
            onPress={() => {}} 
            style={styles.actionBtn}
          />
        )}
        {pedido.estado === "en_ruta" && (
          <Button 
            title="Confirmar Entrega" 
            onPress={() => {}} 
            variant="primary"
            style={styles.actionBtn}
          />
        )}
        {pedido.estado === "entregado" && (
          <View style={styles.completedBox}>
             <CheckCircle size={24} color={Colors.primary} />
             <Text style={styles.completedText}>Entrega Completada</Text>
          </View>
        )}
        
        <Button 
          title="Reportar Incidencia" 
          onPress={() => {}} 
          variant="outline" 
          style={styles.actionBtn}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  orderId: {
    fontSize: 12,
    fontWeight: "bold",
    color: Colors.textDim,
    letterSpacing: 1,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 24,
    fontWeight: "900",
    color: Colors.text,
  },
  infoCard: {
    marginBottom: Spacing.xl,
  },
  row: {
    flexDirection: "row",
    gap: Spacing.md,
    alignItems: "flex-start",
  },
  rowContent: {
    flex: 1,
  },
  label: {
    fontSize: 10,
    color: Colors.textDim,
    textTransform: "uppercase",
    fontWeight: "bold",
    marginBottom: 2,
  },
  value: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  riskContainer: {
    backgroundColor: "rgba(0,0,0,0.3)",
    padding: Spacing.lg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
  },
  riskHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: Spacing.md,
  },
  riskTitle: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "bold",
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  riskLabel: {
    fontSize: 12,
    color: Colors.textDim,
  },
  actions: {
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  actionBtn: {
    width: "100%",
  },
  completedBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: Colors.primary + "10",
    padding: Spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
  },
  completedText: {
    color: Colors.primary,
    fontWeight: "bold",
    fontSize: 16,
  },
});
