"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Zap, Mail, Lock, Eye, EyeOff } from "lucide-react";
import Image from "next/image";//para usar la imagen del logo
import { logAuthEvent } from "./actions";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        toast.error("Error al iniciar sesión con Google: " + error.message);
        await logAuthEvent({
          userId: "anonymous",
          email: "unknown",
          provider: "google",
          status: "failed",
          error: error.message,
        });
        setIsLoading(false);
      }
    } catch (err) {
      toast.error("Error inesperado al iniciar sesión con Google.");
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === "login") {
        toast.loading("Verificando credenciales...", { id: "auth" });
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          toast.error("Credenciales incorrectas. Intenta de nuevo.", { id: "auth" });
          await logAuthEvent({
            userId: "anonymous",
            email: email,
            provider: "email",
            status: "failed",
            error: error.message,
          });
          return;
        }
        toast.success("¡Bienvenido de vuelta!", { id: "auth" });
        
        // Redirigir según el rol almacenado en Supabase user_metadata
        const { data: { user: loggedUser } } = await supabase.auth.getUser();
        
        if (loggedUser) {
          await logAuthEvent({
            userId: loggedUser.id,
            email: loggedUser.email ?? "",
            provider: "email",
            status: "success",
          });
        }

        const rol = loggedUser?.user_metadata?.rol as string | undefined;
        if (rol === "super_admin") {
          router.push("/admin");
        } else if (rol === "repartidor") {
          router.push("/dashboard/pedidos");
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

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">

      {/* Fondo decorativo animado */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black tracking-tighter text-white">
            Route<span className="text-emerald-400">AI</span>
          </h1>
          <p className="text-zinc-500 text-sm mt-2">Sistema de Gestión Logística Inteligente</p>
        </div>

        {/* Card de Login */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl shadow-black/50">

          {/* Tabs de modo */}
          <div className="flex gap-2 bg-zinc-950 rounded-xl p-1 mb-8">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${mode === "login"
                  ? "bg-emerald-500 text-black shadow"
                  : "text-zinc-400 hover:text-white"
                }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => setMode("register")}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${mode === "register"
                  ? "bg-emerald-500 text-black shadow"
                  : "text-zinc-400 hover:text-white"
                }`}
            >
              Crear Cuenta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* Campo Email */}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="email"
                placeholder="correo@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition disabled:opacity-50"
              />
            </div>



            {/* Campo Contraseña */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-12 py-3 text-sm text-white placeholder-zinc-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Botón Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 flex justify-center items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 rounded-xl transition shadow-[0_0_20px_rgba(52,211,153,0.25)] disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {isLoading ? (
                <span className="w-5 h-5 rounded-full border-2 border-black/20 border-t-black animate-spin" />
              ) : (
                <>
                  <Zap className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  {mode === "login" ? "Entrar al Sistema" : "Crear Cuenta Gratis"}
                </>
              )}
            </button>
          </form>

          {mode === "login" && (
            <>
              <div className="flex items-center my-6">
                <div className="flex-grow border-t border-zinc-800" />
                <span className="px-3 text-xs text-zinc-500 uppercase tracking-widest font-semibold">O</span>
                <div className="flex-grow border-t border-zinc-800" />
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-3 bg-zinc-950 border border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700 text-zinc-200 hover:text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Iniciar sesión con Google
              </button>
            </>
          )}

          {/* Footer info */}
          <p className="text-center text-xs text-zinc-600 mt-6">
            Protegido con <span className="text-emerald-500">Supabase Auth</span> · Encriptación de nivel bancario
          </p>
        </div>
      </div>
    </div>
  );
}
