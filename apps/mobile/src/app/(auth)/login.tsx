import React, { useState } from "react";
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Colors, Spacing } from "../../design/tokens";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    setIsLoading(true);
    // Simular login
    setTimeout(() => {
      setIsLoading(false);
      router.replace("/(tabs)");
    }, 1000);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.logoText}>
            Route<Text style={styles.logoAccent}>AI</Text>
          </Text>
          <Text style={styles.subtitle}>Logística Inteligente para Repartidores</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Correo Electrónico"
            placeholder="ejemplo@ruteai.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input
            label="Contraseña"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Button
            title="Entrar al Sistema"
            onPress={handleLogin}
            loading={isLoading}
            style={styles.loginButton}
          />

          <Text style={styles.footerText}>
            Protegido con <Text style={styles.footerAccent}>Supabase Auth</Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: Spacing.xl,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.xxl,
  },
  logoText: {
    fontSize: 48,
    fontWeight: "900",
    color: Colors.text,
    letterSpacing: -2,
  },
  logoAccent: {
    color: Colors.primary,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 14,
    marginTop: Spacing.sm,
  },
  form: {
    width: "100%",
  },
  loginButton: {
    marginTop: Spacing.lg,
  },
  footerText: {
    textAlign: "center",
    color: Colors.textDim,
    fontSize: 12,
    marginTop: Spacing.xxl,
  },
  footerAccent: {
    color: Colors.primary,
  },
});
