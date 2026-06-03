import React from 'react';
import MapView, { Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { StyleSheet } from 'react-native';
import { Colors } from '../../design/tokens';
import { MapMarker } from './MapMarker';

export function MapRenderer({ location, stops, coordinates }: any) {
  return (
    <MapView
      // Fuerza Google Maps en Android e iOS (en iOS, sin esto usaría Apple Maps).
      // Requiere la API Key configurada en app.config.js (ver apps/mobile/.env).
      provider={PROVIDER_GOOGLE}
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
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
