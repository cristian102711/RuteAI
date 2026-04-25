# 🧭 RouteAI — Contexto del Proyecto

> Proyecto semestral Full Stack III — Duoc UC, Escuela de Informática y Telecomunicaciones

---

## 📋 Tabla de Contenidos

- [Descripción General](#-descripción-general)
- [Problema que Resuelve](#-problema-que-resuelve)
- [Solución Propuesta](#-solución-propuesta)
- [Actores del Sistema](#-actores-del-sistema)
- [Diferenciador Principal](#-diferenciador-principal)
- [Alcance del MVP](#-alcance-del-mvp)
- [Stack Tecnológico](#-stack-tecnológico)
- [Estructura del Repositorio](#-estructura-del-repositorio)

---

## 📌 Descripción General

**RouteAI** es una plataforma web Full Stack orientada a empresas pequeñas que realizan despachos de equipos tecnológicos de alto valor. El sistema digitaliza y optimiza toda la operación logística: desde la planificación de rutas hasta la confirmación de entrega, integrando un motor de **IA predictiva** que anticipa entregas fallidas antes de que el repartidor salga a terreno.

El proyecto nace de una necesidad real identificada en una empresa familiar de reparto de tecnología que operaba sin herramientas digitales, gestionando todo mediante WhatsApp y papel.

---

## ❗ Problema que Resuelve

Las empresas de reparto pequeñas en Chile gestionan sus despachos de forma completamente manual. Esto genera cuatro dolores concretos:

| Dolor | Impacto |
|---|---|
| Planificación de rutas a mano | 30–40 min perdidos cada mañana |
| Sin visibilidad de repartidores en ruta | Encargado no sabe si hubo problemas hasta que el cliente reclama |
| Cliente sin información de su pedido | Llamadas constantes al encargado preguntando dónde está su pedido |
| Sin datos de costos reales | Imposible saber si los despachos son rentables o no |

Para empresas que reparten **equipos tecnológicos de alto valor**, estos problemas se amplifican: un aparato perdido o entregado mal puede costar cientos de miles de pesos.

---

## ✅ Solución Propuesta

Una plataforma con tres interfaces conectadas en tiempo real mediante Supabase Realtime:

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   PANEL WEB      │     │   APP MÓVIL      │     │   LINK WEB       │
│   Encargado      │────▶│   Repartidor     │────▶│   Cliente        │
│                  │     │                  │     │                  │
│ • Cargar pedidos │     │ • Ver ruta GPS   │     │ • Tracking mapa  │
│ • Ver mapa live  │     │ • Navegar ruta   │     │ • ETA en vivo    │
│ • Alertas IA     │     │ • Confirmar c/   │     │ • Sin app ni     │
│ • Reportes       │     │   foto y firma   │     │   login          │
└──────────────────┘     └──────────────────┘     └──────────────────┘
```

---

## 👥 Actores del Sistema

### 1. Encargado / Empresa
Administra la operación diaria desde el panel web. Puede crear pedidos, asignar repartidores, ver el mapa en tiempo real, recibir alertas de la IA y revisar reportes de eficiencia.

### 2. Repartidor (Pioneta)
Usa la app móvil durante su jornada. Recibe su ruta asignada, navega con instrucciones turn-by-turn y confirma cada entrega con foto y firma digital del receptor.

### 3. Cliente
Recibe un link por WhatsApp o SMS al momento del despacho. Accede desde cualquier navegador móvil sin necesidad de instalar nada ni crear cuenta. Ve en el mapa la posición del repartidor y el tiempo estimado de llegada.

---

## 🧠 Diferenciador Principal

> Ningún competidor actual (Routific, OptimoRoute, Circuit) tiene prevención inteligente de fallos. Todos reaccionan después del problema — RouteAI actúa antes.

El sistema integra dos capas de inteligencia que no existen en el mercado local:

**Capa 1 — Antes de salir:**
La IA analiza cada pedido y calcula un score de riesgo (0–100%) considerando historial de la dirección, horario solicitado, clima y condiciones de tráfico. Si el riesgo supera el 70%, sugiere reagendar antes de despachar.

**Capa 2 — Durante la ruta:**
El sistema monitorea en tiempo real la posición del repartidor vs la ruta asignada. Si detecta un desvío mayor a 300 metros o un retraso superior a 15 minutos, genera una alerta automática al encargado sin que tenga que estar mirando la pantalla.

---

## 🎯 Alcance del MVP Semestral

### Incluido en el semestre ✅
- Autenticación de encargado y repartidor (Supabase Auth)
- Gestión de pedidos (crear, editar, eliminar)
- Optimización de rutas con Google Maps API
- Tracking GPS en tiempo real (Supabase Realtime)
- Detección de desvíos y retrasos con alertas
- Predicción IA básica de fallos de entrega
- Confirmación de entrega con foto (Supabase Storage)
- Notificaciones al cliente vía WhatsApp/SMS (Twilio)
- Dashboard de operaciones del encargado
- Reportes de eficiencia y costos

### Fase 2 — Post semestre ⚡
- Pasarela de pagos con Mercado Pago (suscripciones mensuales)
- Facturación automática y gestión de planes
- App móvil publicada en App Store y Google Play
- Módulo multi-empresa (varias empresas en la plataforma)

---

## 🔧 Stack Tecnológico

| Capa | Tecnología | Rol |
|---|---|---|
| **Frontend + Backend** | Next.js | App web principal, rutas API y SSR |
| **Base de datos** | Supabase (PostgreSQL) | Pedidos, rutas, usuarios |
| **Autenticación** | Supabase Auth | Login seguro con roles |
| **Tiempo real** | Supabase Realtime | Tracking GPS en vivo |
| **Storage** | Supabase Storage | Fotos de confirmación de entrega |
| **Funciones serverless** | Supabase Edge Functions | Integración con IA Python |
| **ORM** | Prisma | Gestión y tipado de modelos |
| **IA Predictiva** | Python (API externa) | Modelo de predicción de fallos |
| **Mapas y rutas** | Google Maps API | Rutas y visualización en mapa |
| **Notificaciones** | Twilio | SMS y WhatsApp al cliente |
| **Pasarela de pagos** | Mercado Pago | Suscripciones *(Fase 2)* |
| **App móvil** | React Native | App del repartidor |
| **Hosting** | Vercel | Deploy continuo con CI/CD |
| **Repositorio** | GitHub | Control de versiones |

---

## 📁 Estructura del Repositorio

```
/
├── app/                        # Next.js — rutas y páginas
│   ├── (auth)/                 # Login y registro
│   ├── dashboard/              # Panel del encargado
│   ├── tracking/[id]/          # Tracking público del cliente
│   └── api/                    # Endpoints del backend
│       ├── pedidos/            # CRUD de pedidos
│       ├── rutas/              # Optimización con Google Maps
│       ├── ubicaciones/        # GPS en tiempo real
│       ├── ia/                 # Predicción de fallos
│       └── pagos/              # Webhooks Mercado Pago (Fase 2)
├── components/                 # Componentes React reutilizables
├── lib/                        # Cliente Supabase, utilidades
├── prisma/                     # Schema y migraciones
│   └── schema.prisma
├── mobile/                     # App React Native del repartidor
└── docs/                       # Documentación del proyecto
    ├── contexto.md             # Este archivo
    ├── modelo-negocio.md       # Modelo de negocio y pasarela de pagos
    └── requerimientos.md       # RF, RNF y proceso de negocio
```

---

> 📅 Full Stack III — Duoc UC  
> 🔄 Versión 1.0
