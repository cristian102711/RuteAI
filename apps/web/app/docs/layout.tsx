// Layout independiente para /docs
// Hereda el html/body del root layout pero sin sidebar ni header del dashboard
export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
