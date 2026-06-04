import React from 'react';
import MapView, { Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { StyleSheet } from 'react-native';
import { Colors } from '../../design/tokens';
import { MapMarker } from './MapMarker';

export function MapRenderer({ location, stops, coordinates }: any) {
  return (
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
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
