import { redirect } from "next/navigation";

// El portal del repartidor vive en /repartidor/dashboard (con login propio en
// /repartidor/login). Esta ruta solo redirige; el dashboard valida la sesión.
export default function RepartidorEntry() {
  redirect("/repartidor/dashboard");
}
