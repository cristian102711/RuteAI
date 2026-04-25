// packages/shared-types/src/index.ts
// Interfaces TypeScript compartidas entre apps/web y apps/mobile
// Derivadas de los 7 modelos Prisma de RuteAI

// ── Union types para campos string con valores fijos ──────────────

export type EmpresaPlan = 'starter' | 'pro' | 'business'
export type EstadoPedido = 'pendiente' | 'en_ruta' | 'entregado' | 'fallido'
export type EstadoRuta = 'pendiente' | 'activa' | 'completada' | 'cancelada'
export type RolUsuario = 'encargado' | 'repartidor'
export type TipoAlerta = 'desvio' | 'retraso' | 'riesgo_alto'

// ── 1. Empresa ────────────────────────────────────────────────────

export interface IEmpresa {
  id: string
  nombre: string
  email: string
  plan: EmpresaPlan
  planActivo: boolean
  activa: boolean
  createdAt: Date
}

// ── 2. Usuario (Encargado | Repartidor) ───────────────────────────

export interface IUsuario {
  id: string           // UUID de Supabase Auth
  nombre: string
  email: string
  rol: RolUsuario
  telefono?: string | null
  empresaId: string
  createdAt: Date
}

// ── 3. Pedido ─────────────────────────────────────────────────────

export interface IPedido {
  id: string
  nombreCliente: string
  clienteTelefono?: string | null
  direccion: string
  lat?: number | null
  lng?: number | null
  producto: string
  horarioPreferido?: string | null
  estado: EstadoPedido
  scoreRiesgo?: number | null       // 0.0 – 1.0, calculado por IA
  fotoEntregaUrl?: string | null
  firmaEntregaUrl?: string | null
  motivoFallo?: string | null
  empresaId: string
  repartidorId?: string | null
  rutaId?: string | null
  createdAt: Date
  updatedAt: Date
}

// ── 4. Ruta ───────────────────────────────────────────────────────

export interface IRuta {
  id: string
  fecha: Date
  estado: EstadoRuta
  rutaOptimizada?: unknown | null   // JSON con orden de paradas
  empresaId: string
  repartidorId: string
  createdAt: Date
  updatedAt: Date
}

// ── 5. Ubicacion (GPS histórico) ──────────────────────────────────

export interface IUbicacion {
  id: string
  lat: number
  lng: number
  timestamp: Date
  repartidorId: string
  empresaId: string
}

// ── 6. Alerta ─────────────────────────────────────────────────────

export interface IAlerta {
  id: string
  tipo: TipoAlerta
  mensaje: string
  leida: boolean
  empresaId: string
  repartidorId?: string | null
  pedidoId?: string | null
  createdAt: Date
}

// ── 7. ReporteCache ───────────────────────────────────────────────

export interface IReporteCache {
  id: string
  fecha: Date
  datos: unknown       // JSON con métricas: entregas, fallos, eficiencia
  empresaId: string
  createdAt: Date
}

// ── Tipos de respuesta para la API ───────────────────────────────

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}
