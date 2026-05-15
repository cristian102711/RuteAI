import { SuperAdminSidebar } from "./components/SuperAdminSidebar";
import { SuperAdminHeader } from "./components/SuperAdminHeader";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full bg-zinc-950 text-zinc-100">
      <SuperAdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <SuperAdminHeader />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
