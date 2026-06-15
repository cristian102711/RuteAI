import { createClient } from "@/lib/supabaseServer";
import prisma from "@ruteai/database";
import { redirect } from "next/navigation";
import { RegistroRepartidorForm } from "./RegistroRepartidorForm";

export default async function RegistroRepartidorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Si no hay sesión activa → el link expiró o ya fue usado
  if (!user) {
    redirect("/login?mensaje=link-expirado");
  }

  // Si ya está registrado en Prisma → redirigir a su portal
  const existeEnDB = await prisma.usuario.findUnique({
    where: { id: user.id },
  });
  if (existeEnDB) {
    redirect("/repartidor");
  }

  // Buscar datos pre-cargados de la invitación por email
  const invitacion = await prisma.invitacionPendiente.findUnique({
    where: { email: user.email! },
  });

  // Si la invitación expiró → redirigir con aviso
  if (invitacion && new Date() > invitacion.expiraEn) {
    await prisma.invitacionPendiente.delete({ where: { email: user.email! } });
    redirect("/login?mensaje=invitacion-expirada");
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-600 to-amber-500 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)]">
              <span className="text-white font-black text-sm">R</span>
            </div>
            <span className="text-white font-black text-xl tracking-tight">RuteAI</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-2">
            ¡Bienvenido al equipo! 🎉
          </h1>
          <p className="text-zinc-400 text-sm mt-2">
            Completa tu perfil para empezar a repartir
          </p>
        </div>

        <RegistroRepartidorForm
          userId={user.id}
          email={user.email!}
          empresaId={invitacion?.empresaId ?? ""}
          defaultNombre={invitacion?.nombre ?? ""}
          defaultTelefono={invitacion?.telefono ?? ""}
          defaultVehiculo={invitacion?.vehiculo ?? ""}
          defaultPatente={invitacion?.patente ?? ""}
        />
      </div>
    </div>
  );
}
