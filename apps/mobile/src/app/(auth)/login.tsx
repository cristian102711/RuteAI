import React from "react";
import { View, Text, StyleSheet, KeyboardAvoidingView, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Colors, Spacing } from "../../design/tokens";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useAuth } from "../../hooks/useAuth";

const loginSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  
  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data);
      router.replace("/(app)/dashboard");
    } catch (err) {
      console.log("Error al iniciar sesión", err);
      // Opcional: mostrar un Toast/Error Visual
    }
  };

  return (
    <KeyboardAvoidingView
      behavior="height"
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
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Correo Electrónico"
                placeholder="repartidor@ruteai.cl"
                value={value}
                onChangeText={onChange}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}
          />
          {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Contraseña"
                placeholder="••••••••"
                value={value}
                onChangeText={onChange}
                secureTextEntry
              />
            )}
          />
          {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}

          <Button
            title="Entrar al Sistema"
            onPress={handleSubmit(onSubmit)}
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
  errorText: {
    color: Colors.accentRose,
    fontSize: 12,
    marginBottom: Spacing.sm,
    marginTop: -8,
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
