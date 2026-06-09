import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { Colors, Spacing, BorderRadius } from "../../design/tokens";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: "glass" | "solid";
}

export const Card: React.FC<CardProps> = ({ children, style, variant = "glass" }) => {
  return (
    <View style={[
      styles.card, 
      variant === "glass" ? styles.glass : styles.solid,
      style
    ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.xxl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  glass: {
    backgroundColor: Colors.surfaceMuted,
  },
  solid: {
    backgroundColor: Colors.surface,
  },
});
