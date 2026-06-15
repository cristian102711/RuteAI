"use client";

import Link from "next/link";
import { CheckCircle, ArrowRight } from "lucide-react";
import { useSearchParams } from "next/navigation";

export default function PagoExitosoPage() {
  const searchParams = useSearchParams();
  const planId = searchParams.get("plan");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6 text-zinc-50 font-sans">
      <div className="w-full max-w-md rounded-3xl border border-white/[0.04] bg-zinc-900/40 p-8 shadow-2xl backdrop-blur-xl text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 ring-1 ring-emerald-500/30">
          <CheckCircle className="h-8 w-8 text-emerald-400" />
        </div>
        
        <h1 className="text-2xl font-bold tracking-tight text-white mb-3">
          ¡Pago Exitoso!
        </h1>
        
        <p className="text-sm text-zinc-400 mb-8 leading-relaxed">
          Hemos recibido el pago de tu plan <strong>{planId?.toUpperCase() || "Suscripción"}</strong>. Tu cuenta ha sido creada automáticamente en nuestros registros.
          <br /><br />
          Para ingresar al panel, por favor inicia sesión con el correo electrónico que usaste durante la compra.
        </p>

        <div className="flex flex-col gap-3">
          <Link href="/login" className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-6 py-3.5 text-sm font-semibold text-black hover:opacity-95 transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            Ir a Iniciar Sesión <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/" className="flex items-center justify-center rounded-xl px-6 py-3.5 text-sm font-medium text-zinc-400 hover:bg-white/[0.02] hover:text-white transition-all">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
