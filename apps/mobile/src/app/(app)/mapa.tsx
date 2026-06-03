import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { Colors, Spacing } from '../../design/tokens';
import { useRutas } from '../../hooks/useRutas';
import { useAuthStore } from '../../stores/auth.store';
import { Card } from '../../components/ui/Card';
import { MapRenderer } from '../../components/domain/MapRenderer';
import { registrarUbicacion } from '../../services/locations.service';

const GPS_INTERVAL_MS = 5000;

export default function MapaScreen() {
  const { data: ruta, isLoading } = useRutas();
  const user = useAuthStore((state) => state.user);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Solicitar permiso y obtener ubicación inicial ────────────────────────
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permiso de ubicación denegado');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    })();
  }, []);

  // ── Ping GPS cada 5 segundos → core-service /api/v1/locations ───────────
  useEffect(() => {
    if (!location || !user) return;

    intervalRef.current = setInterval(async () => {
      try {
        const currentLoc = await Location.getCurrentPositionAsync({});
        setLocation(currentLoc);

        await registrarUbicacion({
          empresaId: user.empresaId,
          repartidorId: user.id,
          lat: currentLoc.coords.latitude,
          lng: currentLoc.coords.longitude,
          velocidad: currentLoc.coords.speed ?? undefined,
        });
      } catch {
        // Silencioso: no interrumpir la UI si falla un ping GPS puntual
      }
    }, GPS_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [location, user]);

  // ── Estados de carga / error ─────────────────────────────────────────────
  if (errorMsg) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{errorMsg}</Text>
      </View>
    );
  }

  if (isLoading || !location) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Cargando mapa...</Text>
      </View>
    );
  }

  const stops = (ruta?.rutaOptimizada as any)?.stops ?? [];
  const coordinates = [
    { latitude: location.coords.latitude, longitude: location.coords.longitude },
    ...stops.map((s: any) => ({ latitude: s.lat, longitude: s.lng })),
  ];

  return (
    <View style={styles.container}>
      <MapRenderer location={location} stops={stops} coordinates={coordinates} />

      <View style={styles.overlay}>
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>Ruta Activa</Text>
          <Text style={styles.infoSubtitle}>
            {stops.length > 0
              ? `${stops.length} paradas restantes`
              : 'Sin paradas asignadas'}
          </Text>
        </Card>
      </View>
    </View>
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
  loadingText: {
    color: Colors.textMuted,
    marginTop: Spacing.md,
  },
  errorText: {
    color: Colors.accentRose,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  overlay: {
    position: 'absolute',
    bottom: Spacing.xxl,
    left: Spacing.lg,
    right: Spacing.lg,
  },
  infoCard: {
    backgroundColor: 'rgba(24, 24, 27, 0.9)',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  infoSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 4,
  },
});
