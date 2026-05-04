import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../design/tokens';

interface RiskBadgeProps {
  score?: number | null;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ score }) => {
  if (score == null) return null;

  let label = 'Bajo';
  let color = Colors.primary;
  let bg = 'rgba(16, 185, 129, 0.2)'; // emerald-400

  if (score > 0.6) {
    label = 'Alto';
    color = Colors.accentRose;
    bg = 'rgba(244, 63, 94, 0.2)'; // rose-500
  } else if (score > 0.3) {
    label = 'Medio';
    color = Colors.accentAmber;
    bg = 'rgba(251, 191, 36, 0.2)'; // amber-400
  }

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color }]}>Riesgo {label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
});
