import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import MapView, { Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { Colors, Spacing } from '../../design/tokens';
import { MapMarker } from '../../components/domain/MapMarker';
import { useRutas } from '../../hooks/useRutas';
import { Card } from '../../components/ui/Card';

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
      <MapView
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
        userInterfaceStyle="dark"
      >
        {stops.map((stop: any, index: number) => (
          <MapMarker
            key={stop.id}
            coordinate={{ lat: stop.lat, lng: stop.lng }}
            title={`Parada ${index + 1}`}
            active={index === 0}
          />
        ))}

        <Polyline
          coordinates={coordinates}
          strokeColor={Colors.primary}
          strokeWidth={4}
          lineDashPattern={[1]}
        />
      </MapView>

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
  map: {
    flex: 1,
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
