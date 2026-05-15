"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Zap, Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === "login") {
        toast.loading("Verificando credenciales...", { id: "auth" });
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          toast.error("Credenciales incorrectas. Intenta de nuevo.", { id: "auth" });
          return;
        }
        toast.success("¡Bienvenido de vuelta!", { id: "auth" });
        router.push("/dashboard");
        router.refresh();
      } else {
        toast.loading("Creando tu cuenta...", { id: "auth" });
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
          toast.error(error.message, { id: "auth" });
          return;
        }
        toast.success("¡Cuenta creada! Revisa tu correo para confirmar.", { id: "auth" });
        setMode("login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Fondo decorativo animado */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl" />
      </div>
      
      <div className="w-full max-w-md relative z-10">
        
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black tracking-tighter text-white">
            Route<span className="text-emerald-400">AI</span>
          </h1>
          <p className="text-zinc-500 text-sm mt-2">Sistema de Gestión Logística Inteligente</p>
        </div>

        {/* Card de Login */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl shadow-black/50">
          
          {/* Tabs de modo */}
          <div className="flex gap-2 bg-zinc-950 rounded-xl p-1 mb-8">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                mode === "login"
                  ? "bg-emerald-500 text-black shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => setMode("register")}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                mode === "register"
                  ? "bg-emerald-500 text-black shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Crear Cuenta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            
            {/* Campo Email */}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="email"
                placeholder="correo@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition disabled:opacity-50"
              />
            </div>

            {/* Campo Contraseña */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-12 py-3 text-sm text-white placeholder-zinc-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Botón Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 flex justify-center items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 rounded-xl transition shadow-[0_0_20px_rgba(52,211,153,0.25)] disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {isLoading ? (
                <span className="w-5 h-5 rounded-full border-2 border-black/20 border-t-black animate-spin" />
              ) : (
                <>
                  <Zap className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  {mode === "login" ? "Entrar al Sistema" : "Crear Cuenta Gratis"}
                </>
              )}
            </button>
          </form>

          {/* Footer info */}
          <p className="text-center text-xs text-zinc-600 mt-6">
            Protegido con <span className="text-emerald-500">Supabase Auth</span> · Encriptación de nivel bancario
          </p>
        </div>
      </div>
    </div>
  );
}
