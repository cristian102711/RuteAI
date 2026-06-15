import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";



const geistSans = {
  variable: "--font-geist-sans",
};

const geistMono = {
  variable: "--font-geist-mono",
};


export const metadata: Metadata = {
  title: "RouteAI - Panel Logístico",
  description: "Plataforma web Full Stack para despacho de equipos tecnológicos.",
  icons: {
    icon: "/favicon.png",
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} data-scroll-behavior="smooth">
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-zinc-950 text-white">
        {/* Toaster global: funciona en /login, /dashboard y cualquier otra página */}
        <Toaster theme="dark" richColors expand={true} position="top-right" />
        {children}
      </body>
    </html>
  );
}
