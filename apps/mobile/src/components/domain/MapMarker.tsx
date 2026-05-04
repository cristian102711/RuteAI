import React from 'react';
import { Marker } from 'react-native-maps';
import { View, StyleSheet } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { Colors } from '../../design/tokens';

interface MapMarkerProps {
  coordinate: { lat: number; lng: number };
  title?: string;
  description?: string;
  active?: boolean;
}

export const MapMarker: React.FC<MapMarkerProps> = ({ coordinate, title, description, active }) => {
  return (
    <Marker
      coordinate={{ latitude: coordinate.lat, longitude: coordinate.lng }}
      title={title}
      description={description}
    >
      <View style={[styles.markerContainer, active && styles.activeMarker]}>
        <MapPin size={24} color={active ? Colors.background : Colors.primary} />
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    backgroundColor: Colors.surface,
    padding: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  activeMarker: {
    backgroundColor: Colors.primary,
    borderColor: Colors.surface,
  },
});
