"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, UserPlus, Mail, User, Copy, Check, ExternalLink } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function InvitarRepartidorPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/invitaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombre.trim() || undefined, email: email.trim() || undefined }),
      });
      const data = await res.json() as { success?: boolean; token?: string; error?: string };
      if (!res.ok || !data.token) {
        toast.error(data.error ?? "Error al generar la invitación");
        return;
      }
      const appUrl = window.location.origin;
      setInviteUrl(`${appUrl}/repartidor/registro?token=${data.token}`);
      toast.success("Invitación generada correctamente");
    } catch {
      toast.error("Error de conexión. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    toast.success("Link copiado al portapapeles");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNueva = () => {
    setInviteUrl(null);
    setNombre("");
    setEmail("");
    setCopied(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 lg:p-10">
      <div className="mx-auto max-w-lg">

        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <Link
            href="/dashboard/equipo"
            className="grid h-9 w-9 place-items-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="text-xs uppercase tracking-widest text-purple-500 font-bold">Equipo</div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Invitar repartidor</h1>
          </div>
        </div>

        {inviteUrl ? (
          /* ── Estado: invitación generada ── */
          <div className="space-y-5">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-500/20">
                  <Check className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <div className="font-semibold text-white">Invitación lista</div>
                  <div className="text-sm text-zinc-400">Válida por 7 días</div>
                </div>
              </div>

              <p className="text-sm text-zinc-400 mb-4">
                Copia y envía este link al repartidor. Podrá usarlo para crear su cuenta vinculada a tu empresa.
              </p>

              <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-zinc-950/60 p-3">
                <span className="flex-1 truncate text-xs font-mono text-zinc-300">{inviteUrl}</span>
                <button
                  onClick={handleCopy}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-white/5 hover:bg-white/10 transition-colors text-zinc-400 hover:text-white"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </button>
                <a
                  href={inviteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-white/5 hover:bg-white/10 transition-colors text-zinc-400 hover:text-white"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleNueva}
                className="flex-1 rounded-lg border border-white/[0.06] bg-white/[0.03] py-2.5 text-sm font-medium text-zinc-300 hover:bg-white/[0.06] hover:text-white transition-colors"
              >
                Generar otra invitación
              </button>
              <button
                onClick={() => router.push("/dashboard/equipo")}
                className="flex-1 rounded-lg bg-gradient-to-r from-purple-600 to-amber-500 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              >
                Volver al equipo
              </button>
            </div>
          </div>
        ) : (
          /* ── Estado: formulario ── */
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-purple-600 to-amber-500">
                <UserPlus className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-white">Nuevo repartidor</h2>
                <p className="text-sm text-zinc-400">
                  Genera un link de invitación. Los campos son opcionales.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Nombre (opcional)</label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Ej: Carlos Mendoza"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    disabled={isLoading}
                    className="h-11 w-full rounded-lg border border-white/[0.06] bg-white/[0.03] pl-9 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Email (opcional)</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="email"
                    placeholder="carlos@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="h-11 w-full rounded-lg border border-white/[0.06] bg-white/[0.03] pl-9 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition disabled:opacity-50"
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-zinc-600">
                  Si ingresas un email, se pre-llenará en el formulario de registro del repartidor.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-amber-500 px-4 text-sm font-semibold text-white hover:opacity-90 transition disabled:opacity-50 active:scale-[0.98]"
              >
                {isLoading ? (
                  <span className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Generar link de invitación
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
