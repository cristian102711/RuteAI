import React from "react";
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from "react-native";
import { Colors, Spacing, BorderRadius } from "../../design/tokens";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case "secondary":
        return styles.secondary;
      case "outline":
        return styles.outline;
      case "ghost":
        return styles.ghost;
      case "danger":
        return styles.danger;
      default:
        return styles.primary;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case "outline":
      case "ghost":
        return { color: Colors.primary };
      case "primary":
      case "secondary":
      case "danger":
      default:
        return { color: "#000" };
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case "sm":
        return styles.sm;
      case "lg":
        return styles.lg;
      default:
        return styles.md;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.base,
        getVariantStyle(),
        getSizeStyle(),
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "outline" || variant === "ghost" ? Colors.primary : "#000"} />
      ) : (
        <Text style={[styles.text, getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  primary: {
    backgroundColor: Colors.primary,
  },
  secondary: {
    backgroundColor: Colors.accentBlue,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  danger: {
    backgroundColor: Colors.accentRose,
  },
  sm: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  md: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  lg: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  text: {
    fontWeight: "bold",
    fontSize: 16,
  },
  disabled: {
    opacity: 0.5,
  },
});
