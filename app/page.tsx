import { redirect } from "next/navigation";

/**
 * Página de inicio (Landing Page)
 * Redirigimos directamente al login para mostrar 
 * el sistema de acceso profesional de RouteAI.
 */
export default function HomePage() {
  redirect("/login");
}
