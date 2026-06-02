"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Zap, Mail, Lock, Eye, EyeOff, Route, ArrowRight, User, Building2, Globe, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { logAuthEvent } from "./actions";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [nombreEmpresa, setNombreEmpresa] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [rememberMe, setRememberMe] = useState(true);

  // Mostrar error si viene en los query params (ej. error de redirección OAuth)
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "oauth_error" || errorParam === "auth_failed") {
      toast.error("Error al autenticar con Google. Intenta de nuevo.", { id: "oauth-err" });
    }
  }, [searchParams]);

  const handleGoogleLogin = async () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      toast.error("Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY. Asegúrate de agregarlas en el panel de Vercel y realizar un REDEPLOY con limpieza de caché.", { id: "auth" });
      return;
    }

    try {
      setIsLoading(true);
      toast.loading("Redirigiendo a Google...", { id: "auth" });

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${appUrl}/auth/callback`,
        },
      });

      if (error) {
        toast.error(error.message, { id: "auth" });
        await logAuthEvent({
          userId: "anonymous",
          email: "unknown",
          provider: "google",
          status: "failed",
          error: error.message,
        });
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      toast.error("No se pudo iniciar el flujo de Google OAuth. Intenta de nuevo.", { id: "auth" });
      await logAuthEvent({
        userId: "anonymous",
        email: "unknown",
        provider: "google",
        status: "failed",
        error: "No OAuth redirect URL returned",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al conectar con Google";
      toast.error(msg, { id: "auth" });
    } finally {
      setIsLoading(false);
    }
  };

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
          await logAuthEvent({
            userId: "anonymous",
            email: email,
            provider: "email",
            status: "failed",
            error: resData.error ?? "Credenciales inválidas",
          });
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

        await logAuthEvent({
          userId: resData.usuario.id,
          email: resData.usuario.email,
          provider: "email",
          status: "success",
        });

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
        if (!nombreCompleto || !nombreEmpresa) {
          toast.error("Por favor completa tu nombre y el de tu empresa.", { id: "auth" });
          setIsLoading(false);
          return;
        }

        localStorage.setItem("onboarding_nombre", nombreCompleto);
        localStorage.setItem("onboarding_empresa", nombreEmpresa);

        toast.loading("Creando tu cuenta...", { id: "auth" });

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nombre: nombreCompleto,
              empresa: nombreEmpresa,
              rol: "encargado"
            }
          }
        });

        if (error) {
          toast.error(error.message, { id: "auth" });
          return;
        }

        toast.success("¡Cuenta creada con éxito! Entrando al sistema...", { id: "auth" });
        
        if (data?.session) {
          router.push("/onboarding");
        } else {
          setMode("login");
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error interno del servidor";
      toast.error(msg, { id: "auth" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-50 flex flex-col lg:flex-row relative overflow-hidden font-sans selection:bg-amber-500/30">

      {/* Override de estilos para el autofill de Google Chrome e inputs */}
      <style dangerouslySetInnerHTML={{__html: `
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px #131316 inset !important;
          -webkit-text-fill-color: #f4f4f5 !important;
          transition: background-color 5000s ease-in-out 0s;
        }
        .text-gradient-pink-purple {
          background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}} />

      {/* Iluminación de fondo radial suave y moderna (sin cuadricula) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-15%] w-[850px] h-[850px] bg-amber-500/[0.04] rounded-full blur-[140px] animate-pulse" style={{ animationDuration: '14s' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[900px] h-[900px] bg-purple-600/[0.05] rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }} />
      </div>

      {/* Botón Volver al Sitio (Top Right Absoluto) */}
      <div className="absolute top-6 right-6 lg:top-8 lg:right-12 z-50">
        <Link href="/" className="text-zinc-400 hover:text-zinc-200 transition-colors text-xs font-semibold flex items-center gap-1.5 bg-[#121214]/60 backdrop-blur-md px-4 py-2.5 rounded-full border border-zinc-800/80 hover:border-zinc-700">
          <span>←</span>
          <span>Volver al sitio</span>
        </Link>
      </div>

      {/* 1. COLUMNA IZQUIERDA: PANEL DE MARKETING */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-16 xl:p-24 relative z-10">
        {/* Header - Logo */}
        <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition self-start">
          <div className="h-10 w-10 relative grid place-items-center rounded-xl bg-gradient-to-br from-amber-500 to-purple-600 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
            <Route className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">
            Route<span className="text-gradient-pink-purple font-black">AI</span>
          </span>
        </Link>

        {/* Bloque Central de Textos */}
        <div className="my-auto max-w-lg space-y-8 pt-12">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-semibold text-zinc-300 shadow-sm">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            <span className="text-zinc-400 font-normal">gpt-logistics-v2.1</span>
            <span className="text-purple-400">en producción</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl xl:text-6xl font-black text-white leading-[1.1] tracking-tight">
            La operación que <span className="text-[#f5a623]">se</span> optimiza <span className="bg-gradient-to-r from-[#ec4899] to-[#a855f7] bg-clip-text text-transparent">sola.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-zinc-400 text-base xl:text-lg leading-relaxed">
            Coordina repartidores, predice riesgos de entrega y reduce kilómetros — desde un solo workspace multi-tenant.
          </p>

          {/* Features */}
          <div className="space-y-5 pt-4">
            {/* Feature 1 */}
            <div className="flex items-start gap-4 group">
              <div className="h-10 w-10 shrink-0 grid place-items-center rounded-xl bg-zinc-900/30 border border-zinc-800 text-amber-500 shadow-sm group-hover:border-amber-500/40 transition-all duration-300">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-200">Optimización en 1.4s</h4>
                <p className="text-xs text-zinc-500 mt-0.5">Re-rutea hasta 800 paradas en tiempo real.</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start gap-4 group">
              <div className="h-10 w-10 shrink-0 grid place-items-center rounded-xl bg-zinc-900/30 border border-zinc-800 text-purple-500 shadow-sm group-hover:border-purple-500/40 transition-all duration-300">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-200">Roles y permisos</h4>
                <p className="text-xs text-zinc-500 mt-0.5">Super admin, operador y repartidor — aislados.</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-start gap-4 group">
              <div className="h-10 w-10 shrink-0 grid place-items-center rounded-xl bg-zinc-900/30 border border-zinc-800 text-cyan-400 shadow-sm group-hover:border-cyan-400/40 transition-all duration-300">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-200">Multi-país LATAM</h4>
                <p className="text-xs text-zinc-500 mt-0.5">MX · CO · CL · AR · PE · PA · EC · UY.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer de la columna izquierda (Avatar Stack) */}
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            <span className="h-6 w-6 rounded-full bg-amber-500 border-2 border-[#09090b] shrink-0" />
            <span className="h-6 w-6 rounded-full bg-purple-500 border-2 border-[#09090b] shrink-0" />
            <span className="h-6 w-6 rounded-full bg-cyan-400 border-2 border-[#09090b] shrink-0" />
            <span className="h-6 w-6 rounded-full bg-emerald-400 border-2 border-[#09090b] shrink-0" />
          </div>
          <span className="text-xs text-zinc-500 font-medium">
            +240 empresas en LATAM ya optimizan con RouteAI.
          </span>
        </div>
      </div>

      {/* 2. COLUMNA DERECHA: CARD DE AUTENTICACIÓN (LOGIN/CREACIÓN) - AHORA MÁS ANCHA */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 md:p-16 lg:p-24 relative z-10 min-h-screen">
        {/* Contenedor principal de la tarjeta (Expandido a max-w-[520px]) */}
        <div className="w-full max-w-[520px] bg-[#121214]/65 backdrop-blur-xl border border-zinc-800/80 rounded-[28px] p-8 sm:p-10 shadow-2xl relative overflow-hidden flex flex-col group/card ring-1 ring-white/[0.02]">
          
          {/* Barra de progreso de acento sutil */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-amber-500 via-purple-600 to-cyan-400 opacity-60" />

          {/* Selector de Modo (Tabs Capsule) */}
          <div className="flex gap-1 bg-[#09090b]/90 rounded-[16px] p-1.5 mb-8 border border-zinc-800/40">
            <button
              type="button"
              onClick={() => { setMode("login"); }}
              disabled={isLoading}
              className={`flex-1 py-3 text-xs font-semibold rounded-[12px] transition-all duration-300 ${
                mode === "login"
                  ? "bg-zinc-800/60 text-white font-bold border border-zinc-700/50 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => { setMode("register"); }}
              disabled={isLoading}
              className={`flex-1 py-3 text-xs font-semibold rounded-[12px] transition-all duration-300 ${
                mode === "register"
                  ? "bg-zinc-800/60 text-white font-bold border border-zinc-700/50 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Crear cuenta
            </button>
          </div>

          {/* Encabezado del Formulario según pestaña activa */}
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
              {mode === "login" ? "Bienvenido de vuelta" : "Empieza gratis en 1 minuto"}
            </h2>
            <p className="text-zinc-500 text-sm">
              {mode === "login" ? "Accede a tu workspace de operación." : "Crea tu workspace y optimiza tu primera ruta hoy."}
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            {/* Campos adicionales para el registro */}
            {mode === "register" && (
              <>
                {/* Nombre completo */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Nombre completo</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Camila Ríos"
                      value={nombreCompleto}
                      onChange={(e) => setNombreCompleto(e.target.value)}
                      required
                      disabled={isLoading}
                      className="w-full bg-[#131316]/50 border border-zinc-800/80 hover:border-zinc-700/80 focus:border-amber-500/40 rounded-xl pl-11 pr-4 py-3.5 text-sm text-zinc-200 placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-500/10 transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Empresa */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Empresa</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Mercado Andino S.A.S"
                      value={nombreEmpresa}
                      onChange={(e) => setNombreEmpresa(e.target.value)}
                      required
                      disabled={isLoading}
                      className="w-full bg-[#131316]/50 border border-zinc-800/80 hover:border-zinc-700/80 focus:border-amber-500/40 rounded-xl pl-11 pr-4 py-3.5 text-sm text-zinc-200 placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-500/10 transition-all duration-300"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email corporativo */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Email corporativo</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="email"
                  placeholder="tu@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full bg-[#131316]/50 border border-zinc-800/80 hover:border-zinc-700/80 focus:border-amber-500/40 rounded-xl pl-11 pr-4 py-3.5 text-sm text-zinc-200 placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-500/10 transition-all duration-300"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full bg-[#131316]/50 border border-zinc-800/80 hover:border-zinc-700/80 focus:border-amber-500/40 rounded-xl pl-11 pr-12 py-3.5 text-sm text-zinc-200 placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-500/10 transition-all duration-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Fila extra en login: Mantener sesión y olvidaste tu contraseña */}
            {mode === "login" && (
              <div className="flex items-center justify-between mt-1 mb-2 px-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isLoading}
                    className="w-4 h-4 rounded border-zinc-800 bg-[#131316]/50 text-amber-500 focus:ring-amber-500/20 focus:ring-offset-0 focus:outline-none transition"
                  />
                  <span className="text-xs font-semibold text-zinc-400">Mantener sesión</span>
                </label>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    toast.info("Próximamente disponible. Por favor contacta a soporte para recuperar tu contraseña.", { id: "forgot" });
                  }}
                  className="text-xs font-bold text-amber-500/90 hover:text-amber-400 hover:underline transition-all"
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            )}

            {/* Botón de envío */}
            <button
              type="submit"
              disabled={isLoading}
              className="mt-4 flex w-full justify-center items-center gap-2 bg-[#f5a623] hover:bg-[#e29312] text-zinc-950 font-extrabold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(245,166,35,0.15)] hover:shadow-[0_0_25px_rgba(245,166,35,0.3)] disabled:opacity-75 disabled:cursor-not-allowed group active:scale-[0.98] text-sm tracking-wide"
            >
              {isLoading ? (
                <span className="w-5 h-5 rounded-full border-2 border-zinc-950/20 border-t-zinc-950 animate-spin" />
              ) : (
                <>
                  <span>{mode === "login" ? "Entrar al workspace" : "Crear mi workspace"}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={2.5} />
                </>
              )}
            </button>
          </form>

          {/* Divisor */}
          <div className="relative flex py-4 items-center mt-4">
            <div className="flex-grow border-t border-zinc-800/40"></div>
            <span className="flex-shrink mx-4 text-zinc-600 text-[10px] font-bold uppercase tracking-widest">O continúa con</span>
            <div className="flex-grow border-t border-zinc-800/40"></div>
          </div>

          {/* Botón de Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-[#18181c]/50 hover:bg-[#202024]/70 border border-zinc-800/80 hover:border-zinc-700 text-zinc-200 font-semibold py-3.5 px-4 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 text-sm shadow-sm"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            <span>Google</span>
          </button>

          {/* Footer de la Card de autenticación */}
          <div className="mt-8 pt-6 border-t border-zinc-800/40 text-center">
            {mode === "login" ? (
              <p className="text-xs text-zinc-500">
                ¿No tienes cuenta?{" "}
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className="font-bold text-amber-500/90 hover:text-amber-400 hover:underline transition"
                >
                  Crear workspace
                </button>
              </p>
            ) : (
              <p className="text-[11px] text-zinc-500 leading-relaxed max-w-xs mx-auto">
                Al continuar aceptas los{" "}
                <a href="#" onClick={(e) => { e.preventDefault(); toast.info("Términos del Servicio"); }} className="underline hover:text-zinc-300">Términos</a>
                {" "}y{" "}
                <a href="#" onClick={(e) => { e.preventDefault(); toast.info("Política de Privacidad"); }} className="underline hover:text-zinc-300">Política de privacidad</a>.
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
