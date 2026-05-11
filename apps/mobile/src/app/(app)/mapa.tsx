import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { Colors, Spacing } from '../../design/tokens';
import { useRutas } from '../../hooks/useRutas';
import { Card } from '../../components/ui/Card';
import { MapRenderer } from '../../components/domain/MapRenderer';

export default function MapaScreen() {
  const { data: ruta, isLoading } = useRutas();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permiso de ubicación denegado');
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    })();
  }, []);

  if (isLoading || !location) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Cargando mapa...</Text>
      </View>
    );
  }

  const stops = (ruta?.rutaOptimizada as any)?.stops || [];
  
  // Coordinates for the polyline
  const coordinates = [
    { latitude: location.coords.latitude, longitude: location.coords.longitude },
    ...stops.map((stop: any) => ({ latitude: stop.lat, longitude: stop.lng }))
  ];

  return (
    <View style={styles.container}>
      <MapRenderer 
        location={location} 
        stops={stops} 
        coordinates={coordinates} 
      />

      <View style={styles.overlay}>
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>Ruta Activa</Text>
          <Text style={styles.infoSubtitle}>
            {stops.length} paradas restantes
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
  overlay: {
    position: 'absolute',
    bottom: Spacing.xxl,
    left: Spacing.lg,
    right: Spacing.lg,
  },
  infoCard: {
    backgroundColor: 'rgba(24, 24, 27, 0.9)', // surface with opacity
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
