import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../design/tokens';

export function MapRenderer() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vista de Mapa (Web)</Text>
      <Text style={styles.text}>
        El mapa interactivo usa `react-native-maps` y solo está disponible en la aplicación nativa (iOS/Android).
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 18, fontWeight: 'bold', color: Colors.primary, marginBottom: 8 },
  text: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
});
