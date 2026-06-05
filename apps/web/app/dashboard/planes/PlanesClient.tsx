"use client";

import { useState } from "react";
import { Check, Zap, Building2, Rocket, ArrowRight, Star, Crown, X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { actualizarPlanEmpresa } from "../actions";

const planes = [
  {
    id: "starter",
    nombre: "Starter",
    precio: "$29",
    periodo: "/mes",
    descripcion: "Para tiendas y restaurantes dando sus primeros envíos.",
    icon: Zap,
    color: "from-zinc-500 to-zinc-400",
    borderColor: "border-zinc-700",
    bgGlow: "",
    badge: null,
    features: [
      "Hasta 1,000 entregas/mes",
      "5 repartidores",
      "Optimización de rutas básica",
      "Soporte por email",
      "Panel de estadísticas",
    ],
    limite: "Básico",
  },
  {
    id: "pro",
    nombre: "Pro",
    precio: "$99",
    periodo: "/mes",
    descripcion: "Para operaciones en crecimiento que viven en la calle.",
    icon: Star,
    color: "from-amber-500 to-purple-500",
    borderColor: "border-amber-500/40",
    bgGlow: "shadow-[0_0_40px_rgba(245,158,11,0.15)]",
    badge: "Más popular",
    badgeColor: "bg-gradient-to-r from-amber-500 to-purple-500",
    features: [
      "Hasta 10,000 entregas/mes",
      "50 repartidores",
      "Score de riesgo IA incluido",
      "Webhooks + API REST",
      "Soporte prioritario 24/7",
      "Monitoreo GPS en tiempo real",
    ],
    limite: "Pro",
  },
  {
    id: "business",
    nombre: "Business",
    precio: "A medida",
    periodo: "",
    descripcion: "Multi-país, SLA personalizado y modelo de IA dedicado.",
    icon: Crown,
    color: "from-purple-500 to-indigo-500",
    borderColor: "border-purple-500/30",
    bgGlow: "",
    badge: "Enterprise",
    badgeColor: "bg-purple-500/20 text-purple-300 border border-purple-500/30",
    features: [
      "Entregas ilimitadas",
      "Repartidores ilimitados",
      "Modelo IA fine-tuned para tu vertical",
      "SSO + SOC 2 Type II",
      "Customer Success dedicado",
      "SLA garantizado",
      "Multi-país",
    ],
    limite: "Sin límites",
  },
];

const faqs = [
  {
    q: "¿Puedo cambiar de plan en cualquier momento?",
    a: "Sí. Los cambios de plan se aplican inmediatamente. Si subes de plan, pagas la diferencia proporcional al mes. Si bajas, el crédito se aplica al próximo ciclo."
  },
  {
    q: "¿Qué pasa si supero el límite de entregas?",
    a: "Te avisamos con 80% de uso. Al llegar al límite, puedes hacer upgrade o esperar al próximo ciclo mensual. No cortamos tu servicio sin previo aviso."
  },
  {
    q: "¿El plan Business tiene contrato mínimo?",
    a: "Business es flexible: puedes elegir mensual o anual. Con anual obtienes 2 meses gratis. Nuestro equipo lo define contigo en la demo inicial."
  },
];

interface PlanesClientProps {
  planActual: string;
  metodoPago?: { ultimos4: string; tipo: string } | null;
}

export function PlanesClient({ planActual, metodoPago }: PlanesClientProps) {
  const [faqAbierta, setFaqAbierta] = useState<number | null>(null);
  const [planSeleccionado, setPlanSeleccionado] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("estado") === "exito") {
      const planName = searchParams.get("nuevoPlan") || "";
      toast.success(`Pago exitoso y plan actualizado a ${planName.toUpperCase()} correctamente`, {
        description: "Tu comprobante de pago ha sido enviado a tu correo.",
      });
      // Limpiar query params (opcional, pero buena práctica)
      router.replace("/dashboard/planes");
    } else if (searchParams.get("estado") === "error") {
      toast.error("Ocurrió un error al procesar tu pago.", {
        description: "Por favor intenta nuevamente.",
      });
      router.replace("/dashboard/planes");
    }
  }, [searchParams, router]);

  const planActualData = planes.find(p => p.id === planActual) || planes[0];

  const handleCambiarPlan = async (planId: string) => {
    if (planId === planActual) return;
    setPlanSeleccionado(planId);
    
    // Si ya tiene un método de pago guardado, procesarlo directo
    if (metodoPago && metodoPago.ultimos4) {
      try {
        const res = await actualizarPlanEmpresa(planId);
        if (res?.error) {
          toast.error("Error al cambiar plan: " + res.error);
        } else {
          toast.success(`Pago exitoso usando tu tarjeta terminada en ${metodoPago.ultimos4}`, {
            description: `Plan actualizado a ${planId.toUpperCase()} correctamente.`,
          });
          // Forzar la recarga local si es necesario, o Next.js revalidatePath ya lo hizo
          router.replace("/dashboard/planes");
        }
      } catch (err: any) {
        console.error(err);
        toast.error("Error de conexión al servidor");
      } finally {
        setPlanSeleccionado(null);
      }
      return;
    }

    // Si NO tiene método de pago, redirigir a la página de pago simulada
    router.push(`/dashboard/planes/pago?planId=${planId}`);
  };

  return (
    <div className="space-y-10 text-white pb-10">

      {/* Encabezado */}
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-1">Suscripción</div>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Planes y Precios</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Gestiona tu suscripción y explora las opciones disponibles para escalar tu operación.
        </p>
      </div>

      {/* Banner Plan Actual */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-purple-500/10 p-6 flex items-center gap-5">
        <div className="absolute -left-10 -top-10 w-40 h-40 bg-amber-500/10 rounded-full blur-[60px] pointer-events-none" />
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-purple-500/10 rounded-full blur-[60px] pointer-events-none" />
        <div className="relative z-10 grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-500 to-purple-500 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
          {planActualData && <planActualData.icon className="h-6 w-6 text-white" />}
        </div>
        <div className="relative z-10 flex-1 min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-widest text-amber-400 mb-0.5">Plan actual</div>
          <div className="text-lg font-semibold text-white">
            {planActualData?.nombre} <span className="text-amber-400">{planActualData?.precio}{planActualData?.periodo}</span>
          </div>
          <div className="text-sm text-zinc-400">{planActualData?.descripcion}</div>
        </div>
        <div className="relative z-10 shrink-0">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Activo
          </div>
        </div>
      </div>

      {/* Cards de Planes */}
      <div className="grid gap-5 md:grid-cols-3">
        {planes.map((plan) => {
          const esActual = plan.id === planActual;
          // Starter es 0, Pro es 1, Business es 2
          const indexActual = planes.findIndex(p => p.id === planActual);
          const indexPlan = planes.indexOf(plan);
          const esMejor = indexPlan > (indexActual >= 0 ? indexActual : 0);
          const PlanIcon = plan.icon;

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border p-6 transition-all duration-300 ${plan.borderColor} ${plan.bgGlow} ${
                esActual
                  ? "bg-gradient-to-b from-amber-500/10 to-purple-500/10"
                  : "bg-zinc-900/30 hover:bg-zinc-800/40 hover:border-zinc-600"
              }`}
            >
              {/* Badge superior */}
              {plan.badge && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white ${plan.badgeColor}`}>
                  {plan.badge}
                </div>
              )}

              {/* Indicador plan actual */}
              {esActual && (
                <div className="absolute top-4 right-4 flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400 ring-1 ring-amber-500/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Tu plan
                </div>
              )}

              {/* Ícono + nombre */}
              <div className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${plan.color} shadow-lg mb-4`}>
                <PlanIcon className="h-5 w-5 text-white" />
              </div>

              <h3 className="text-lg font-semibold text-white">{plan.nombre}</h3>
              <p className="mt-1 text-xs text-zinc-400">{plan.descripcion}</p>

              {/* Precio */}
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight text-white">{plan.precio}</span>
                {plan.periodo && <span className="text-sm text-zinc-400">{plan.periodo}</span>}
              </div>

              {/* Límite de uso */}
              <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500">
                <Rocket className="h-3 w-3" />
                Capacidad: <span className="text-zinc-300 ml-0.5">{plan.limite}</span>
              </div>

              {/* Botón acción */}
              <button
                onClick={() => handleCambiarPlan(plan.id)}
                disabled={esActual || planSeleccionado !== null}
                className={`mt-5 w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] ${
                  esActual
                    ? "bg-white/5 text-zinc-500 cursor-default border border-white/5"
                    : esMejor
                    ? "bg-gradient-to-r from-amber-500 to-amber-400 text-black hover:opacity-90 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                    : "bg-zinc-800 text-white hover:bg-zinc-700"
                }`}
              >
                {planSeleccionado === plan.id ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    Procesando...
                  </>
                ) : esActual ? (
                  <>
                    <Check className="h-4 w-4" />
                    Plan actual
                  </>
                ) : esMejor ? (
                  <>
                    <ArrowRight className="h-4 w-4" />
                    {plan.id === "business" ? "Hablar con ventas" : `Mejorar a ${plan.nombre}`}
                  </>
                ) : (
                  <>
                    Cambiar a {plan.nombre}
                  </>
                )}
              </button>

              {/* Lista de features */}
              <ul className="mt-6 space-y-2.5 border-t border-white/[0.06] pt-5 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    <span className="text-zinc-300">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Comparativa de uso */}
      <div className="rounded-2xl border border-white/[0.06] bg-zinc-900/20 overflow-hidden">
        <div className="border-b border-white/[0.06] px-6 py-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-400" />
          <h2 className="text-sm font-semibold text-white">Comparativa de características</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">Característica</th>
                {planes.map(p => (
                  <th key={p.id} className={`px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider ${p.id === planActual ? "text-amber-400" : "text-zinc-400"}`}>
                    {p.nombre} {p.id === planActual && "✓"}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {[
                { feature: "Entregas/mes", values: ["1,000", "10,000", "Ilimitadas"] },
                { feature: "Repartidores", values: ["5", "50", "Ilimitados"] },
                { feature: "Optimización de rutas", values: ["Básica", "Avanzada IA", "Avanzada IA"] },
                { feature: "Score de riesgo IA", values: [false, true, true] },
                { feature: "API REST + Webhooks", values: [false, true, true] },
                { feature: "GPS tiempo real", values: [false, true, true] },
                { feature: "SSO + SOC 2", values: [false, false, true] },
                { feature: "Customer Success", values: [false, false, true] },
                { feature: "SLA garantizado", values: [false, false, true] },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-3 text-zinc-300 font-medium">{row.feature}</td>
                  {row.values.map((val, j) => (
                    <td key={j} className={`px-4 py-3 text-center ${planes[j].id === planActual ? "bg-amber-500/5" : ""}`}>
                      {typeof val === "boolean" ? (
                        val
                          ? <Check className="h-4 w-4 text-emerald-400 mx-auto" />
                          : <X className="h-4 w-4 text-zinc-600 mx-auto" />
                      ) : (
                        <span className={`text-sm font-medium ${planes[j].id === planActual ? "text-amber-400" : "text-zinc-300"}`}>{val}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold text-white">Preguntas frecuentes</h2>
        </div>
        {faqs.map((faq, i) => (
          <div
            key={i}
            className="rounded-xl border border-white/[0.06] bg-zinc-900/20 overflow-hidden"
          >
            <button
              className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
              onClick={() => setFaqAbierta(faqAbierta === i ? null : i)}
            >
              <span className="text-sm font-medium text-zinc-100">{faq.q}</span>
              <ArrowRight
                className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200 ${faqAbierta === i ? "rotate-90" : ""}`}
              />
            </button>
            {faqAbierta === i && (
              <div className="border-t border-white/[0.04] px-5 py-4">
                <p className="text-sm text-zinc-400 leading-relaxed">{faq.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* CTA inferior — Hablar con ventas */}
      <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-indigo-500/5 p-8 text-center">
        <div className="absolute -left-20 -top-20 w-60 h-60 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -right-20 -bottom-20 w-60 h-60 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative z-10">
          <Crown className="h-8 w-8 text-purple-400 mx-auto mb-3" />
          <h3 className="text-xl font-semibold text-white">¿Necesitas algo más personalizado?</h3>
          <p className="mt-2 text-sm text-zinc-400 max-w-md mx-auto">
            Para flotas grandes, integraciones especiales o requisitos de compliance, nuestro equipo de ventas está listo.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition shadow-[0_0_20px_rgba(168,85,247,0.3)]">
              <Building2 className="h-4 w-4" />
              Hablar con ventas
            </button>
            <a href="mailto:sales@ruteai.com" className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-zinc-300 hover:bg-white/10 hover:text-white transition">
              sales@ruteai.com
            </a>
          </div>
        </div>
      </div>

    </div>
  );
}
