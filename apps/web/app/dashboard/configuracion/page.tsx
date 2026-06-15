export const dynamic = "force-dynamic";

import prisma from "@ruteai/database";
import { createClient } from "@/lib/supabaseServer";
import ConfiguracionClient from "./ConfiguracionClient";

// Tipo auxiliar para el JSON de configuración
type ConfigJson = {
  rut?: string;
  pais?: string;
  zonaHoraria?: string;
  direccion?: string;
  logoUrl?: string;
  notificaciones?: {
    notifFallo?: boolean;
    notifRiesgo?: boolean;
    notifDesconexion?: boolean;
    notifDiario?: boolean;
    notifSemanal?: boolean;
  };
  ia?: {
    agresividad?: number;
    modeloActivo?: string;
    recalcularTiempo?: string;
    prediccionFallo?: boolean;
    reasignacionAuto?: boolean;
    validacionDireccion?: boolean;
  };
};

export default async function ConfiguracionPage() {
  // 1. Sesión real de Supabase Auth
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return <div className="p-10 text-xl font-bold text-red-400 bg-zinc-950 h-screen">🚨 Error: Sesión no válida.</div>;
  }

  // 2. Datos del usuario + empresa + últimos pagos (billing)
  const usuarioDB = await prisma.usuario.findUnique({
    where: { id: user.id },
    include: {
      empresa: {
        include: {
          pagos: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
      },
    },
  });

  if (!usuarioDB || !usuarioDB.empresa) {
    return <div className="p-10 text-xl font-bold text-red-400 bg-zinc-950 h-screen">🚨 Error: Usuario o Empresa no encontrados en la base de datos.</div>;
  }

  // 3. Extraer el JSON de configuración con valores por defecto
  const config = (usuarioDB.empresa.configuracion ?? {}) as ConfigJson;
  const notif = config.notificaciones ?? {};
  const ia = config.ia ?? {};

  return (
    <ConfiguracionClient
      initialEmpresa={{
        id: usuarioDB.empresa.id,
        nombre: usuarioDB.empresa.nombre,
        email: usuarioDB.empresa.email,
        plan: usuarioDB.empresa.plan,
        rut: config.rut ?? "",
        pais: config.pais ?? "",
        zonaHoraria: config.zonaHoraria ?? "",
        direccion: config.direccion ?? "",
        logoUrl: config.logoUrl ?? "",
      }}
      initialUsuario={{
        id: usuarioDB.id,
        nombre: usuarioDB.nombre,
        email: usuarioDB.email,
        telefono: usuarioDB.telefono,
      }}
      initialNotificaciones={{
        notifFallo: notif.notifFallo ?? true,
        notifRiesgo: notif.notifRiesgo ?? true,
        notifDesconexion: notif.notifDesconexion ?? false,
        notifDiario: notif.notifDiario ?? true,
        notifSemanal: notif.notifSemanal ?? true,
      }}
      initialIA={{
        agresividad: ia.agresividad ?? 70,
        modeloActivo: ia.modeloActivo ?? "gpt-logistics-v2.1",
        recalcularTiempo: ia.recalcularTiempo ?? "5 minutos",
        prediccionFallo: ia.prediccionFallo ?? true,
        reasignacionAuto: ia.reasignacionAuto ?? false,
        validacionDireccion: ia.validacionDireccion ?? true,
      }}
      initialBilling={{
        planEstado: usuarioDB.empresa.planEstado ?? "inactivo",
        planFechaInicio: usuarioDB.empresa.planFechaInicio?.toISOString() ?? null,
        planFechaVencimiento: usuarioDB.empresa.planFechaVencimiento?.toISOString() ?? null,
        pagos: (usuarioDB.empresa.pagos ?? []).map((p: any) => ({
          id:             p.id,
          commerceOrder:  p.commerceOrder,
          planId:         p.planId,
          monto:          p.monto,
          estado:         p.estado,
          pagadoEn:       p.pagadoEn?.toISOString() ?? null,
          createdAt:      p.createdAt.toISOString(),
        })),
      }}
    />
  );
}
