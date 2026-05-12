'use client';

import { motion } from 'framer-motion';
import { 
  Activity, 
  ShieldCheck, 
  Route, 
  BrainCircuit, 
  ArrowRight, 
  Zap, 
  MapPin, 
  Box 
} from 'lucide-react';
import Link from 'next/link';

const services = [
  {
    title: 'Auth Service',
    description: 'Gestión segura de identidades y acceso con Supabase.',
    port: '3002',
    icon: ShieldCheck,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
  },
  {
    title: 'AI Service',
    description: 'Análisis de riesgo y optimización inteligente de rutas.',
    port: '3001',
    icon: BrainCircuit,
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
  },
  {
    title: 'Core Service',
    description: 'Motor de logística, pedidos y gestión de inventario.',
    port: '3003',
    icon: Box,
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
  },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-950">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
      
      <main className="relative z-10 container mx-auto px-6 pt-24 pb-12">
        {/* Navigation */}
        <nav className="flex items-center justify-between mb-24">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Route className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight">RuteAI</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-zinc-400 font-medium">
            <Link href="#features" className="hover:text-white transition-colors">Características</Link>
            <Link href="#services" className="hover:text-white transition-colors">Microservicios</Link>
            <Link href="#docs" className="hover:text-white transition-colors">Documentación</Link>
            <Link href="/login" className="px-5 py-2 bg-white text-black rounded-full hover:bg-zinc-200 transition-colors">
              Iniciar Sesión
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="max-w-4xl mx-auto text-center mb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-6">
              <Zap size={14} />
              <span>LOGÍSTICA DE PRÓXIMA GENERACIÓN</span>
            </div>
            <h1 className="text-6xl md:text-7xl font-bold tracking-tight mb-8 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
              Optimiza tu ruta, <br /> potencia tu negocio.
            </h1>
            <p className="text-lg text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              La plataforma integral de logística que utiliza inteligencia artificial para 
              maximizar la eficiencia en el despacho de equipos tecnológicos.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 group transition-all">
                Explorar Dashboard
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="w-full sm:w-auto px-8 py-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl font-semibold border border-zinc-800 transition-all">
                Ver Repositorio
              </button>
            </div>
          </motion.div>
        </section>

        {/* Services Grid */}
        <section id="services" className="grid md:grid-cols-3 gap-6 mb-32">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all group"
            >
              <div className={`w-14 h-14 ${service.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <service.icon className={`${service.color} w-7 h-7`} />
              </div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">{service.title}</h3>
                <span className="text-[10px] font-mono px-2 py-1 bg-zinc-800 rounded text-zinc-500 uppercase tracking-widest">
                  PORT {service.port}
                </span>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                {service.description}
              </p>
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-400">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                Operativo
              </div>
            </motion.div>
          ))}
        </section>

        {/* Status Section */}
        <section className="p-1 w-full bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 rounded-[2.5rem] mb-32">
          <div className="bg-zinc-950 rounded-[2.4rem] p-12 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-12 opacity-10">
              <MapPin size={200} className="text-white" />
            </div>
            <div className="relative z-10 max-w-2xl">
              <h2 className="text-3xl font-bold mb-6">Arquitectura de Microservicios</h2>
              <p className="text-zinc-400 mb-8 leading-relaxed">
                RuteAI está construido sobre un ecosistema de microservicios independientes 
                que se comunican de forma asíncrona, garantizando alta disponibilidad y 
                escalabilidad horizontal.
              </p>
              <div className="flex flex-wrap gap-4">
                {['Next.js', 'Express', 'Prisma', 'Supabase', 'Docker', 'Turbo'].map(tech => (
                  <span key={tech} className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-300">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-12 border-t border-zinc-900 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-zinc-500">
          <p>© 2026 RuteAI. Todos los derechos reservados.</p>
          <div className="flex items-center gap-8">
            <Link href="#" className="hover:text-white transition-colors">Privacidad</Link>
            <Link href="#" className="hover:text-white transition-colors">Términos</Link>
            <Link href="#" className="hover:text-white transition-colors">Github</Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
