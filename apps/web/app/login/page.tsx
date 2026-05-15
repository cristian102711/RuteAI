"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles, Mail, Lock, Eye, EyeOff, Route, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === "login") {
        toast.loading("Verificando credenciales...", { id: "auth" });
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          toast.error("Credenciales incorrectas. Intenta de nuevo.", { id: "auth" });
          return;
        }
        toast.success("¡Bienvenido de vuelta!", { id: "auth" });
        const { data: { user: loggedUser } } = await supabase.auth.getUser();
        const rol = loggedUser?.user_metadata?.rol as string | undefined;
        if (rol === "super_admin") {
          router.push("/super-admin");
        } else if (rol === "repartidor") {
          router.push("/repartidor");
        } else {
          router.push("/dashboard");
        }
        router.refresh();
      } else {
        toast.loading("Creando tu cuenta...", { id: "auth" });
        const { data, error } = await supabase.auth.signUp({ email, password });

        if (error) {
          toast.error(error.message, { id: "auth" });
          return;
        }

        toast.success("¡Cuenta creada! Entra al sistema para configurar tu empresa.", { id: "auth" });
        setMode("login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      if (error) throw error;
      // No hacemos setIsLoading(false) aquí porque la página se va a redirigir
    } catch (error: any) {
      toast.error(error.message || "Error al iniciar sesión con Google");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col relative overflow-hidden font-sans selection:bg-amber-500/30">
      
      {/* Estilos Globales de la Vista (Heredados del Landing) */}
      <style dangerouslySetInnerHTML={{__html: `
        .bg-grid {
          background-size: 40px 40px;
          background-image: linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
        }
        .text-gradient-ai {
          background: linear-gradient(to right, #a855f7, #ec4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}} />

      {/* Navbar simplificado */}
      <header className="absolute top-0 inset-x-0 z-40 border-b border-zinc-800 bg-zinc-950/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-6">
          <Link href="/" className="flex items-center gap-2.5 transition-transform hover:scale-105">
            <div className="h-8 w-8 relative grid place-items-center rounded-lg bg-gradient-to-br from-amber-500 to-purple-600 shadow-[0_0_15px_rgba(245,158,11,0.4)]">
              <Route className="h-1/2 w-1/2 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-semibold tracking-tight text-white">
              Route<span className="text-gradient-ai">AI</span>
            </span>
          </Link>
        </div>
      </header>

      {/* Fondo decorativo animado */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />
      </div>

      {/* Contenedor Principal */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-10 pt-20">
        <div className="w-full max-w-md">
          
          {/* Header del Formulario */}
          <div className="text-center mb-8 flex flex-col items-center">
            <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">
              {mode === "login" ? "Bienvenido de vuelta" : "Crea tu cuenta gratis"}
            </h1>
            <p className="text-zinc-400 text-sm">
              {mode === "login" 
                ? "Ingresa a tu dashboard para optimizar tus rutas." 
                : "Comienza a reducir costos logísticos hoy mismo."}
            </p>
          </div>

          {/* Card de Auth */}
          <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl ring-1 ring-inset ring-white/5">
            {/* Tabs de modo */}
            <div className="flex gap-2 bg-zinc-950/50 rounded-lg p-1.5 mb-8 border border-zinc-800/50">
              <button
                onClick={() => setMode("login")}
                className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
                  mode === "login"
                    ? "bg-white/10 text-white shadow ring-1 ring-inset ring-white/10"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => setMode("register")}
                className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
                  mode === "register"
                    ? "bg-white/10 text-white shadow ring-1 ring-inset ring-white/10"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Crear Cuenta
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Campo Email */}
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="email"
                  placeholder="correo@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full bg-white/[0.03] border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/40 transition disabled:opacity-50"
                />
              </div>

              {/* Campo Contraseña */}
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full bg-white/[0.03] border border-zinc-800 rounded-xl pl-10 pr-10 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/40 transition disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Botón Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 flex w-full justify-center items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-4 py-3 text-sm font-semibold text-black shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:opacity-95 transition disabled:opacity-70 disabled:cursor-not-allowed group active:scale-95"
              >
                {isLoading ? (
                  <span className="w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    {mode === "login" ? "Entrar al sistema" : "Crear cuenta"}
                    <ArrowRight className="w-4 h-4 ml-1 opacity-70 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="relative mt-6 mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-zinc-900/40 px-2 text-zinc-500 backdrop-blur-xl">O continúa con</span>
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
              type="button"
              disabled={isLoading}
              className="flex w-full justify-center items-center gap-2 rounded-xl bg-white/[0.03] border border-zinc-800 px-4 py-3 text-sm font-medium text-white hover:bg-white/[0.06] transition active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
              {isLoading ? "Conectando..." : "Google"}
            </button>

            {/* Opciones extra (Forgot password, etc.) */}

            {mode === "login" && (
              <div className="mt-6 text-center">
                <a href="#" className="text-xs font-medium text-zinc-500 hover:text-amber-400 transition-colors">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            )}
          </div>

          {/* Footer info */}
          <p className="text-center text-[11px] text-zinc-600 mt-8">
            Protegido con <span className="text-zinc-400">Supabase Auth</span> · Encriptación AES-256
          </p>
        </div>
      </div>
    </div>
  );
}
