"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Route, Mail, Lock, Eye, EyeOff, ArrowRight, Truck } from "lucide-react";
import Link from "next/link";
import { logAuthEvent } from "../../login/actions";

export default function RepartidorLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    const registeredParam = searchParams.get("registered");
    if (errorParam === "no_autorizado") {
      toast.error("Acceso denegado. Inicia sesión primero.", { id: "auth-err" });
    }
    if (registeredParam === "1") {
      toast.success("¡Cuenta creada! Ingresa tus credenciales.", { id: "registered" });
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      toast.loading("Verificando credenciales...", { id: "auth" });

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json() as {
        success?: boolean;
        error?: string;
        usuario?: { id: string; email: string; nombre: string; rol: string; empresaId: string };
      };

      if (!response.ok || !data.success) {
        toast.error(data.error ?? "Credenciales incorrectas", { id: "auth" });
        await logAuthEvent({ userId: "anonymous", email, provider: "email", status: "failed", error: data.error ?? "Credenciales inválidas" });
        return;
      }

      if (data.usuario?.rol !== "repartidor") {
        toast.error("Esta área es exclusiva para repartidores.", { id: "auth" });
        await supabase.auth.signOut();
        return;
      }

      toast.success("¡Bienvenido!", { id: "auth" });
      await logAuthEvent({ userId: data.usuario.id, email: data.usuario.email, provider: "email", status: "success" });
      router.push("/repartidor/dashboard");
      router.refresh();
    } catch {
      toast.error("Error de conexión. Intenta de nuevo.", { id: "auth" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden font-sans flex items-center justify-center p-4"
      style={{ background: "hsl(240 10% 3.9%)", color: "hsl(0 0% 98%)" }}
    >
      {/* Fondos radiales */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-20 h-[400px] w-[400px] rounded-full blur-[120px]" style={{ background: "hsl(271 81% 66% / 0.15)" }} />
        <div className="absolute -bottom-40 -right-20 h-[400px] w-[400px] rounded-full blur-[120px]" style={{ background: "hsl(38 92% 50% / 0.10)" }} />
      </div>

      <div className="relative z-10 w-full max-w-md">

        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5 justify-center mb-6">
            <div
              className="h-9 w-9 grid place-items-center rounded-lg"
              style={{ background: "linear-gradient(to bottom right, hsl(38 92% 50%), hsl(271 81% 66%))" }}
            >
              <Route className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-semibold tracking-tight">
              Route<span style={{ background: "linear-gradient(to right, hsl(38 92% 50%), hsl(271 81% 66%))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI</span>
            </span>
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] px-3 py-1 text-xs text-zinc-400 mb-4" style={{ background: "rgba(255,255,255,0.03)" }}>
            <Truck className="h-3.5 w-3.5 text-amber-500" />
            Portal Repartidor
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">Accede a tu ruta</h1>
          <p className="mt-1 text-sm text-zinc-400">Ver tus pedidos asignados y el mapa de entregas</p>
        </div>

        {/* Card del formulario */}
        <div
          className="rounded-2xl border border-white/[0.06] p-7 shadow-2xl"
          style={{ background: "rgba(255,255,255,0.02)", backdropFilter: "blur(12px)" }}
        >
          <style dangerouslySetInnerHTML={{__html: `
            input:-webkit-autofill,
            input:-webkit-autofill:hover,
            input:-webkit-autofill:focus {
              -webkit-box-shadow: 0 0 0 30px hsl(240 10% 5%) inset !important;
              -webkit-text-fill-color: hsl(0 0% 98%) !important;
              caret-color: hsl(0 0% 98%);
            }
          `}} />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11 w-full rounded-lg border border-white/[0.08] pl-9 text-sm focus:outline-none transition disabled:opacity-50"
                  style={{ background: "rgba(255,255,255,0.03)", color: "hsl(0 0% 98%)" }}
                  onFocus={(e) => { e.target.style.borderColor = "hsl(271 81% 66% / 0.4)"; e.target.style.boxShadow = "0 0 0 2px hsl(271 81% 66% / 0.15)"; }}
                  onBlur={(e) => { e.target.style.borderColor = ""; e.target.style.boxShadow = ""; }}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Contraseña</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11 w-full rounded-lg border border-white/[0.08] pl-9 pr-10 text-sm focus:outline-none transition disabled:opacity-50"
                  style={{ background: "rgba(255,255,255,0.03)", color: "hsl(0 0% 98%)" }}
                  onFocus={(e) => { e.target.style.borderColor = "hsl(271 81% 66% / 0.4)"; e.target.style.boxShadow = "0 0 0 2px hsl(271 81% 66% / 0.15)"; }}
                  onBlur={(e) => { e.target.style.borderColor = ""; e.target.style.boxShadow = ""; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded text-zinc-500 transition hover:text-white"
                  style={{ background: "transparent" }}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition disabled:opacity-60 active:scale-[0.98]"
              style={{
                background: "linear-gradient(to right, hsl(271 81% 66%), hsl(38 92% 50%))",
                color: "hsl(240 10% 3.9%)",
              }}
            >
              {isLoading ? (
                <span className="h-5 w-5 rounded-full border-2 border-current/20 border-t-current animate-spin" />
              ) : (
                <>
                  Entrar a mi ruta
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-zinc-500">
            ¿Eres encargado o administrador?{" "}
            <Link href="/login" className="text-zinc-300 hover:text-white transition-colors underline underline-offset-2">
              Acceder por aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
