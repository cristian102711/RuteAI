import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { Colors, Spacing } from "../../design/tokens";
import { MapPin, Navigation } from "lucide-react-native";

export default function MapaScreen() {
  return (
    <View style={styles.container}>
      {/* Mock Map Background */}
      <View style={styles.mockMap}>
        <View style={styles.gridLineH} />
        <View style={[styles.gridLineH, { top: "40%" }]} />
        <View style={[styles.gridLineH, { top: "70%" }]} />
        <View style={styles.gridLineV} />
        <View style={[styles.gridLineV, { left: "40%" }]} />
        <View style={[styles.gridLineV, { left: "70%" }]} />
        
        {/* Mock Route Polyline */}
        <View style={styles.routeLine} />

        {/* Mock Markers */}
        <View style={[styles.marker, { top: "20%", left: "15%" }]}>
          <View style={[styles.pin, { backgroundColor: Colors.primary }]}>
             <Text style={styles.pinText}>1</Text>
          </View>
        </View>

        <View style={[styles.marker, { top: "50%", left: "45%" }]}>
          <View style={[styles.pin, { backgroundColor: Colors.accentBlue }]}>
             <Text style={styles.pinText}>2</Text>
          </View>
        </View>

        {/* Current Position */}
        <View style={[styles.marker, { top: "35%", left: "30%" }]}>
          <View style={styles.currentPos}>
            <Navigation size={16} color="#000" fill="#000" />
          </View>
        </View>
      </View>

      <View style={styles.overlay}>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Ruta Optimizada</Text>
          <Text style={styles.infoSubtitle}>3 paradas restantes · 4.2 km</Text>
          
          <View style={styles.divider} />
          
          <View style={styles.nextStep}>
            <View style={styles.stepDot} />
            <Text style={styles.stepText}>Próximo: Av. Providencia 1234</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
  },
  mockMap: {
    flex: 1,
    backgroundColor: "#18181b",
    position: "relative",
  },
  gridLineH: {
    position: "absolute",
    height: 1,
    width: "100%",
    backgroundColor: "#27272a",
    top: "20%",
  },
  gridLineV: {
    position: "absolute",
    width: 1,
    height: "100%",
    backgroundColor: "#27272a",
    left: "20%",
  },
  routeLine: {
    position: "absolute",
    height: 4,
    width: "50%",
    backgroundColor: Colors.primary,
    top: "25%",
    left: "18%",
    borderRadius: 2,
    transform: [{ rotate: "35deg" }],
    opacity: 0.6,
  },
  marker: {
    position: "absolute",
  },
  pin: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  pinText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#fff",
  },
  currentPos: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  overlay: {
    position: "absolute",
    bottom: Spacing.xl,
    left: Spacing.lg,
    right: Spacing.lg,
  },
  infoCard: {
    backgroundColor: "rgba(0,0,0,0.85)",
    borderRadius: 20,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "bold",
  },
  infoSubtitle: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  nextStep: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  stepText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: "bold",
  },
});
