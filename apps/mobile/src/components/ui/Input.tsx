import React from "react";
import { View, TextInput, Text, StyleSheet, ViewStyle, TextInputProps } from "react-native";
import { Colors, Spacing, BorderRadius } from "../../design/tokens";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({ label, error, containerStyle, ...props }) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, error ? styles.inputError : null]}
        placeholderTextColor={Colors.textDim}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
    width: "100%",
  },
  label: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: "rgba(0,0,0,0.3)",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: 16,
  },
  inputError: {
    borderColor: Colors.accentRose,
  },
  errorText: {
    color: Colors.accentRose,
    fontSize: 12,
    marginTop: Spacing.xs,
  },
});
