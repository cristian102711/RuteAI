"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Route, User, Mail, Lock, Eye, EyeOff, ArrowRight, Truck, Phone, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";

interface TokenInfo {
  valid: boolean;
  email: string | null;
  nombre: string | null;
  empresaNombre: string;
}

function RegistroForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token") ?? "";

  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [tokenLoading, setTokenLoading] = useState(true);

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [telefono, setTelefono] = useState("");
  const [vehiculo, setVehiculo] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenError("No se proporcionó un token de invitación.");
      setTokenLoading(false);
      return;
    }
    void (async () => {
      try {
        const res = await fetch(`/api/invitaciones/${token}`);
        const data = await res.json() as { valid?: boolean; email?: string | null; nombre?: string | null; empresaNombre?: string; error?: string };
        if (!res.ok || !data.valid) {
          setTokenError(data.error ?? "Invitación inválida o expirada.");
        } else {
          setTokenInfo({
            valid: true,
            email: data.email ?? null,
            nombre: data.nombre ?? null,
            empresaNombre: data.empresaNombre ?? "",
          });
          if (data.email) setEmail(data.email);
          if (data.nombre) setNombre(data.nombre);
        }
      } catch {
        setTokenError("Error al verificar la invitación. Intenta de nuevo.");
      } finally {
        setTokenLoading(false);
      }
    })();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmarPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setIsLoading(true);
    try {
      toast.loading("Creando tu cuenta...", { id: "registro" });

      const res = await fetch("/api/repartidor/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, nombre, email, password, telefono: telefono || undefined, vehiculo: vehiculo || undefined }),
      });

      const data = await res.json() as { success?: boolean; error?: string };

      if (!res.ok || !data.success) {
        toast.error(data.error ?? "Error al crear la cuenta", { id: "registro" });
        return;
      }

      // Redirigir al login para que el repartidor inicie sesión de forma explícita.
      // NO hacer signInWithPassword aquí: reemplazaría la sesión activa del encargado
      // en el mismo navegador (localStorage compartido por origen).
      toast.success("¡Cuenta creada! Inicia sesión.", { id: "registro" });
      router.push("/repartidor/login?registered=1");
    } catch {
      toast.error("Error de conexión. Intenta de nuevo.", { id: "registro" });
    } finally {
      setIsLoading(false);
    }
  };

  if (tokenLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/[0.06] p-8 text-center">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-white mb-2">Invitación no válida</h2>
        <p className="text-sm text-zinc-400 mb-6">{tokenError}</p>
        <Link
          href="/repartidor/login"
          className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm text-zinc-300 hover:text-white transition-colors"
        >
          Ir al login
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] p-7 shadow-2xl" style={{ background: "rgba(255,255,255,0.02)", backdropFilter: "blur(12px)" }}>
      <style dangerouslySetInnerHTML={{__html: `
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 30px hsl(240 10% 5%) inset !important;
          -webkit-text-fill-color: hsl(0 0% 98%) !important;
          caret-color: hsl(0 0% 98%);
        }
      `}} />

      {/* Badge de empresa */}
      {tokenInfo?.empresaNombre && (
        <div className="mb-5 flex items-center gap-2 rounded-lg border border-purple-500/20 bg-purple-500/[0.08] px-3 py-2">
          <Truck className="h-4 w-4 text-purple-400 shrink-0" />
          <span className="text-sm text-zinc-300">
            Unirte a <span className="font-semibold text-white">{tokenInfo.empresaNombre}</span>
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nombre */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">Nombre completo</label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Carlos Mendoza"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              disabled={isLoading}
              className="h-11 w-full rounded-lg border border-white/[0.08] pl-9 text-sm focus:outline-none transition disabled:opacity-50"
              style={{ background: "rgba(255,255,255,0.03)", color: "hsl(0 0% 98%)" }}
              onFocus={(e) => { e.target.style.borderColor = "hsl(271 81% 66% / 0.4)"; e.target.style.boxShadow = "0 0 0 2px hsl(271 81% 66% / 0.15)"; }}
              onBlur={(e) => { e.target.style.borderColor = ""; e.target.style.boxShadow = ""; }}
            />
          </div>
        </div>

        {/* Email */}
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
              disabled={isLoading || !!tokenInfo?.email}
              className="h-11 w-full rounded-lg border border-white/[0.08] pl-9 text-sm focus:outline-none transition disabled:opacity-50"
              style={{ background: "rgba(255,255,255,0.03)", color: "hsl(0 0% 98%)" }}
              onFocus={(e) => { e.target.style.borderColor = "hsl(271 81% 66% / 0.4)"; e.target.style.boxShadow = "0 0 0 2px hsl(271 81% 66% / 0.15)"; }}
              onBlur={(e) => { e.target.style.borderColor = ""; e.target.style.boxShadow = ""; }}
            />
          </div>
          {tokenInfo?.email && (
            <p className="mt-1 text-[11px] text-zinc-600">Email asignado por tu empresa</p>
          )}
        </div>

        {/* Contraseña */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">Contraseña</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Mín. 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className="h-11 w-full rounded-lg border border-white/[0.08] pl-9 pr-10 text-sm focus:outline-none transition disabled:opacity-50"
              style={{ background: "rgba(255,255,255,0.03)", color: "hsl(0 0% 98%)" }}
              onFocus={(e) => { e.target.style.borderColor = "hsl(271 81% 66% / 0.4)"; e.target.style.boxShadow = "0 0 0 2px hsl(271 81% 66% / 0.15)"; }}
              onBlur={(e) => { e.target.style.borderColor = ""; e.target.style.boxShadow = ""; }}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded text-zinc-500 hover:text-white transition" style={{ background: "transparent" }}>
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Confirmar contraseña */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">Confirmar contraseña</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Repite tu contraseña"
              value={confirmarPassword}
              onChange={(e) => setConfirmarPassword(e.target.value)}
              required
              disabled={isLoading}
              className="h-11 w-full rounded-lg border border-white/[0.08] pl-9 text-sm focus:outline-none transition disabled:opacity-50"
              style={{ background: "rgba(255,255,255,0.03)", color: "hsl(0 0% 98%)" }}
              onFocus={(e) => { e.target.style.borderColor = "hsl(271 81% 66% / 0.4)"; e.target.style.boxShadow = "0 0 0 2px hsl(271 81% 66% / 0.15)"; }}
              onBlur={(e) => { e.target.style.borderColor = ""; e.target.style.boxShadow = ""; }}
            />
          </div>
        </div>

        {/* Teléfono (opcional) */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">Teléfono <span className="text-zinc-600">(opcional)</span></label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="tel"
              placeholder="+56 9 1234 5678"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              disabled={isLoading}
              className="h-11 w-full rounded-lg border border-white/[0.08] pl-9 text-sm focus:outline-none transition disabled:opacity-50"
              style={{ background: "rgba(255,255,255,0.03)", color: "hsl(0 0% 98%)" }}
              onFocus={(e) => { e.target.style.borderColor = "hsl(271 81% 66% / 0.4)"; e.target.style.boxShadow = "0 0 0 2px hsl(271 81% 66% / 0.15)"; }}
              onBlur={(e) => { e.target.style.borderColor = ""; e.target.style.boxShadow = ""; }}
            />
          </div>
        </div>

        {/* Vehículo (opcional) */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">Vehículo <span className="text-zinc-600">(opcional)</span></label>
          <div className="relative">
            <Truck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Ej: Moto · Honda CB 190R"
              value={vehiculo}
              onChange={(e) => setVehiculo(e.target.value)}
              disabled={isLoading}
              className="h-11 w-full rounded-lg border border-white/[0.08] pl-9 text-sm focus:outline-none transition disabled:opacity-50"
              style={{ background: "rgba(255,255,255,0.03)", color: "hsl(0 0% 98%)" }}
              onFocus={(e) => { e.target.style.borderColor = "hsl(271 81% 66% / 0.4)"; e.target.style.boxShadow = "0 0 0 2px hsl(271 81% 66% / 0.15)"; }}
              onBlur={(e) => { e.target.style.borderColor = ""; e.target.style.boxShadow = ""; }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="group mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition disabled:opacity-60 active:scale-[0.98]"
          style={{ background: "linear-gradient(to right, hsl(271 81% 66%), hsl(38 92% 50%))", color: "hsl(240 10% 3.9%)" }}
        >
          {isLoading ? (
            <span className="h-5 w-5 rounded-full border-2 border-current/20 border-t-current animate-spin" />
          ) : (
            <>
              Crear mi cuenta
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-zinc-500">
        ¿Ya tienes cuenta?{" "}
        <Link href="/repartidor/login" className="text-zinc-300 hover:text-white transition-colors underline underline-offset-2">
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}

export default function RepartidorRegistroPage() {
  return (
    <div
      className="relative min-h-screen overflow-hidden font-sans flex items-center justify-center p-4"
      style={{ background: "hsl(240 10% 3.9%)", color: "hsl(0 0% 98%)" }}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-20 h-[400px] w-[400px] rounded-full blur-[120px]" style={{ background: "hsl(271 81% 66% / 0.15)" }} />
        <div className="absolute -bottom-40 -right-20 h-[400px] w-[400px] rounded-full blur-[120px]" style={{ background: "hsl(38 92% 50% / 0.10)" }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5 justify-center mb-6">
            <div className="h-9 w-9 grid place-items-center rounded-lg" style={{ background: "linear-gradient(to bottom right, hsl(38 92% 50%), hsl(271 81% 66%))" }}>
              <Route className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-semibold tracking-tight">
              Route<span style={{ background: "linear-gradient(to right, hsl(38 92% 50%), hsl(271 81% 66%))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI</span>
            </span>
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Crea tu cuenta</h1>
          <p className="mt-1 text-sm text-zinc-400">Completa tu perfil de repartidor</p>
        </div>

        <Suspense fallback={<div className="flex items-center justify-center min-h-[300px]"><Loader2 className="h-8 w-8 animate-spin text-purple-500" /></div>}>
          <RegistroForm />
        </Suspense>
      </div>
    </div>
  );
}
