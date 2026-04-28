import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Colors, Spacing } from "../../design/tokens";
import { Card } from "../../components/ui/Card";
import { TrendingUp, Package, MapPin, AlertCircle } from "lucide-react-native";

export default function DashboardScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hola, Juan 👋</Text>
        <Text style={styles.date}>Lunes, 27 de Abril</Text>
      </View>

      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Package size={20} color={Colors.accentAmber} />
          <Text style={styles.statValue}>12</Text>
          <Text style={styles.statLabel}>Pendientes</Text>
        </Card>
        <Card style={styles.statCard}>
          <TrendingUp size={20} color={Colors.primary} />
          <Text style={styles.statValue}>85%</Text>
          <Text style={styles.statLabel}>Eficiencia</Text>
        </Card>
      </View>

      <Text style={styles.sectionTitle}>Alertas en Vivo</Text>
      <Card style={styles.alertCard}>
        <View style={styles.alertHeader}>
          <AlertCircle size={20} color={Colors.accentRose} />
          <Text style={styles.alertTitle}>Retraso Detectado</Text>
        </View>
        <Text style={styles.alertMsg}>
          Tráfico pesado en Av. Providencia. ETA aumentado en 15 min.
        </Text>
      </Card>

      <Text style={styles.sectionTitle}>Próxima Parada</Text>
      <Card variant="solid" style={styles.nextStopCard}>
        <View style={styles.nextStopHeader}>
          <MapPin size={24} color={Colors.primary} />
          <View>
            <Text style={styles.clientName}>Ana García</Text>
            <Text style={styles.address}>Av. Providencia 1234</Text>
          </View>
        </View>
        <View style={styles.etaContainer}>
          <Text style={styles.etaLabel}>ETA Estimado</Text>
          <Text style={styles.etaValue}>14:30 PM</Text>
        </View>
      </Card>
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
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.text,
  },
  date: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.md,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.text,
    marginTop: Spacing.sm,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  alertCard: {
    borderColor: "rgba(244, 63, 94, 0.3)",
    marginBottom: Spacing.xl,
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  alertTitle: {
    color: Colors.accentRose,
    fontWeight: "bold",
  },
  alertMsg: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  nextStopCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  nextStopHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  clientName: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "bold",
  },
  address: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  etaContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
    padding: Spacing.md,
    borderRadius: 12,
  },
  etaLabel: {
    color: Colors.textDim,
    fontSize: 12,
    textTransform: "uppercase",
    fontWeight: "bold",
  },
  etaValue: {
    color: Colors.primary,
    fontSize: 18,
    fontWeight: "900",
  },
});
