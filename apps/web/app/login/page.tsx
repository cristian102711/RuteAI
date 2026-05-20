"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Zap, Mail, Lock, Eye, EyeOff, Route, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");

  // Mostrar error si viene en los query params (ej. error de redirección OAuth)
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "oauth_error") {
      toast.error("Error al autenticar con Google. Intenta de nuevo.", { id: "oauth-err" });
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === "login") {
        toast.loading("Verificando credenciales...", { id: "auth" });
        
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          const resData = await response.json() as { error?: string };
          toast.error(resData.error || "Credenciales incorrectas. Intenta de nuevo.", { id: "auth" });
          return;
        }

        const resData = await response.json() as {
          success: boolean;
          usuario: {
            id: string;
            email: string;
            nombre: string;
            rol: string;
            empresaId: string;
          };
        };

        toast.success("¡Bienvenido de vuelta!", { id: "auth" });
        const rol = resData.usuario.rol;
        
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error interno del servidor";
      toast.error(msg, { id: "auth" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      toast.loading("Redirigiendo a Google...", { id: "auth" });
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });

      if (error) {
        toast.error(error.message, { id: "auth" });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al conectar con Google";
      toast.error(msg, { id: "auth" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-amber-500/30">
      
      {/* Estilos locales de grilla */}
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

      {/* Fondos decorativos ambientados (Púrpura y Naranja de la Landing) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />
      </div>

      <div className="w-full max-w-md relative z-10">

        {/* Encabezado Logo */}
        <div className="text-center mb-8 flex flex-col items-center">
          <Link href="/" className="flex items-center gap-2.5 mb-2 hover:opacity-90 transition">
            <div className="h-9 w-9 relative grid place-items-center rounded-xl bg-gradient-to-br from-amber-500 to-purple-600 shadow-[0_0_20px_rgba(245,158,11,0.4)]">
              <Route className="h-1/2 w-1/2 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">
              Route<span className="text-gradient-ai">AI</span>
            </span>
          </Link>
          <p className="text-zinc-500 text-sm">Optimización logística de última milla con IA</p>
        </div>

        {/* Card de Login Premium */}
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl ring-1 ring-inset ring-white/5 relative overflow-hidden group">
          
          {/* Barra de progreso de acento sutil */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-purple-600" />

          {/* Selector de Modo (Tabs) */}
          <div className="flex gap-1.5 bg-zinc-950 rounded-2xl p-1 mb-8 border border-zinc-800/50">
            <button
              onClick={() => setMode("login")}
              disabled={isLoading}
              className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all ${
                mode === "login"
                  ? "bg-gradient-to-r from-amber-500 to-amber-400 text-zinc-950 shadow-[0_0_15px_rgba(245,158,11,0.25)] font-bold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => setMode("register")}
              disabled={isLoading}
              className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all ${
                mode === "register"
                  ? "bg-gradient-to-r from-amber-500 to-amber-400 text-zinc-950 shadow-[0_0_15px_rgba(245,158,11,0.25)] font-bold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Crear Cuenta
            </button>
          </div>

          {/* Botón de Google OAuth */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-white/[0.03] hover:bg-white/[0.08] border border-zinc-800 hover:border-zinc-700 text-zinc-200 font-semibold py-3.5 px-4 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 text-sm mb-6 shadow-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            Continuar con Google
          </button>

          {/* Separador */}
          <div className="relative flex py-2 items-center mb-6">
            <div className="flex-grow border-t border-zinc-800/80"></div>
            <span className="flex-shrink mx-4 text-zinc-600 text-xs font-semibold uppercase tracking-wider">O con correo</span>
            <div className="flex-grow border-t border-zinc-800/80"></div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* Campo Email */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Correo electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="email"
                  placeholder="correo@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full bg-white/[0.03] border border-zinc-800 focus:border-amber-500/40 rounded-xl pl-10 pr-4 py-3 text-sm text-zinc-200 placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition disabled:opacity-50"
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full bg-white/[0.03] border border-zinc-800 focus:border-amber-500/40 rounded-xl pl-10 pr-12 py-3 text-sm text-zinc-200 placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Botón Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="mt-4 flex w-full justify-center items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-400 text-zinc-950 font-bold py-3.5 rounded-xl hover:opacity-95 transition-all shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] disabled:opacity-70 disabled:cursor-not-allowed group active:scale-[0.98]"
            >
              {isLoading ? (
                <span className="w-5 h-5 rounded-full border-2 border-zinc-950/20 border-t-zinc-950 animate-spin" />
              ) : (
                <>
                  <Zap className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-bold tracking-wide">
                    {mode === "login" ? "Entrar al Sistema" : "Registrar Cuenta"}
                  </span>
                  <ArrowRight className="w-4 h-4 opacity-75 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Footer del Formulario */}
          <div className="mt-8 pt-6 border-t border-zinc-800/80 flex flex-col items-center gap-2">
            <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-semibold">
              Protegido por <span className="text-purple-400">Supabase Auth</span>
            </span>
            <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300 underline transition">
              Volver al inicio
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
