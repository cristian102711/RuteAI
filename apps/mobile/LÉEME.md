# RouteAI Mobile 🚚

## 1. Descripción del Proyecto

**RouteAI Mobile** es la aplicación nativa destinada a los repartidores (drivers) que operan dentro de la plataforma de logística de última milla **RouteAI**. Su objetivo principal es proveer una interfaz rápida, confiable y geolocalizada para que los repartidores gestionen sus rutas, confirmen entregas y reciban alertas en tiempo real. 

Esta aplicación es parte de un ecosistema más amplio (monorepo) e interactúa directamente con los microservicios backend de la plataforma. Comparte tokens de diseño y tipado estricto con la aplicación web corporativa (`apps/web`), asegurando una identidad visual cohesiva y reduciendo la duplicación de lógica y esfuerzo de desarrollo.

## 2. Stack Tecnológico

La aplicación está construida sobre un stack moderno y enfocado en la performance móvil y el rendimiento del desarrollador:

- **Expo SDK 54 / React Native 0.81.5**: Framework principal para el desarrollo multiplataforma.
- **Expo Router 6**: Enrutamiento declarativo y basado en archivos (file-based routing) para la navegación nativa.
- **NativeWind 4 + react-native-css-interop**: Motor de estilos utilizando clases utilitarias de TailwindCSS compiladas y optimizadas a estilos nativos.
- **Zustand**: Manejo de estado global local y de UI, atómico y sin boilerplate.
- **TanStack Query**: Sincronización, caché y manejo del estado asíncrono de las peticiones de datos (Data Fetching).
- **React Hook Form + Zod**: Manejo performante de formularios y validación estricta de esquemas.
- **react-native-maps + expo-location**: Renderizado de mapas nativos y seguimiento de ubicación GPS.
- **expo-notifications**: Gestión y despliegue de notificaciones nativas.
- **@supabase/supabase-js**: Cliente de base de datos y tiempo real (arquitectura preparada para la Fase 2).

## 3. Listado Completo de Dependencias

Para asegurar la consistencia en el desarrollo y la correcta resolución en el monorepo, estas son todas las dependencias instaladas:

### Dependencias de Producción (`dependencies`)
| Paquete | Versión |
| :--- | :--- |
| `expo` | `~54.0.34` |
| `expo-router` | `~6.0.23` |
| `react` | `19.1.0` |
| `react-native` | `0.81.5` |
| `nativewind` | `^4.1.23` |
| `zustand` | `^4.5.0` |
| `@tanstack/react-query` | `^5.0.0` |
| `react-hook-form` | `^7.50.0` |
| `@hookform/resolvers` | `^3.3.0` |
| `zod` | `^3.22.0` |
| `lucide-react-native` | `^0.454.0` |
| `react-native-maps` | `1.20.1` |
| `expo-location` | `~19.0.8` |
| `expo-notifications` | `~0.32.17` |
| `@supabase/supabase-js` | `^2.39.0` |
| `react-native-reanimated` | `^4.3.0` |
| `react-native-safe-area-context` | `5.6.2` |
| `react-native-screens` | `~4.16.0` |
| `react-native-gesture-handler` | `^2.31.2` |
| `react-native-svg` | `^15.15.4` |
| `react-native-css-interop` | `^0.2.3` |
| `@expo/metro-runtime` | `^6.1.2` |
| `expo-constants` | `~18.0.13` |
| `expo-font` | `~14.0.11` |
| `expo-linking` | `~8.0.12` |
| `expo-status-bar` | `~3.0.9` |
| `@babel/runtime` | `^7.29.2` |
| `invariant` | `^2.2.4` |
| `whatwg-fetch` | `^3.6.20` |
| `@ruteai/shared-types` | `workspace:*` |

### Dependencias de Desarrollo (`devDependencies`)
| Paquete | Versión |
| :--- | :--- |
| `@babel/core` | `^7.25.2` |
| `@types/react` | `~19.1.17` |
| `eslint` | `^8.57.0` |
| `jest` | `^29.7.0` |
| `jest-expo` | `~54.0.17` |
| `prettier` | `^3.3.3` |
| `typescript` | `^5.3.3` |

## 4. Arquitectura

La aplicación adopta una arquitectura orientada al dominio y dividida en capas claras para maximizar la mantenibilidad y desacoplar la interfaz de la lógica de red:

- **`app/`**: Define el enrutamiento y el flujo de pantallas usando Expo Router.
- **`components/ui/`**: Componentes visuales genéricos y reutilizables (Botones, Inputs, Cards). Son 100% agnósticos a la lógica de negocio.
- **`components/domain/`**: Componentes altamente acoplados a la lógica de negocio del ecosistema logístico (Ej. `PedidoCard`, `RiskBadge`, `MapMarker`).
- **`services/`**: Capa de abstracción para la lógica de datos. Implementa el patrón **BFF (Backend For Frontend)**. Actualmente (Fase 1) retorna Promesas con retardos simulados (stubs). En la Fase 2, estos mismos archivos se conectarán a la API real minimizando el impacto en el resto de la app.
- **`stores/`**: Manejo del estado global síncrono y de persistencia de UI usando Zustand.
- **`hooks/`**: Custom hooks segregados por dominio (ej. `usePedidos`), que encapsulan las llamadas a TanStack Query y aíslan a los componentes visuales de la lógica compleja de data fetching.
- **`lib/`**: Configuración unificada de clientes y librerías externas (Ej. instancia de `queryClient`, cliente de `supabase`).

## 5. Estructura de Carpetas

```text
apps/mobile/
├── app/                    # Rutas y Pantallas (Expo Router)
│   ├── (auth)/             # Grupo de rutas públicas
│   │   └── login.tsx       # Pantalla de inicio de sesión
│   ├── (app)/              # Grupo de rutas privadas (requiere auth)
│   │   ├── _layout.tsx     # Layout principal con Tabs de navegación
│   │   ├── dashboard.tsx   # Pantalla principal con métricas y alertas
│   │   ├── mapa.tsx        # Vista general del mapa y la ruta actual
│   │   └── pedidos/        # Sub-rutas de gestión de envíos
│   │       ├── index.tsx   # Lista de todos los pedidos filtrables
│   │       └── [id].tsx    # Detalle individual de un pedido
│   └── _layout.tsx         # Layout raíz (Inyección de Providers)
├── src/
│   ├── components/
│   │   ├── domain/         # Componentes de negocio (MapMarker, PedidoCard, RiskBadge)
│   │   └── ui/             # Componentes base (Button, Card, Input)
│   ├── design/             # Mapeo de tokens de diseño compartidos
│   ├── hooks/              # Custom hooks de TanStack Query (useAuth, usePedidos, useRutas)
│   ├── lib/                # Configuración de clientes (queryClient.ts, supabase.ts)
│   ├── services/           # Lógica de datos / Stubs simulados BFF
│   └── stores/             # Estado global de Zustand (auth.store.ts, pedidos.store.ts)
├── package.json            # Dependencias específicas de la app móvil
├── metro.config.js         # Configuración del bundler optimizado para pnpm workspaces
├── babel.config.js         # Configuración de Babel y NativeWind
└── tailwind.config.js      # Configuración de TailwindCSS
```

## 6. Pantallas y Flujo de Navegación

El flujo de la aplicación es lineal, intuitivo y optimizado para una sola mano:

1. **Login (`/login`)**: Pantalla de entrada protegida. Tras la autenticación exitosa, redirige automáticamente al Dashboard.
2. **Dashboard (`/dashboard`)**: Resumen del turno. Muestra métricas clave (eficiencia, entregas pendientes), alertas de la central en vivo y la tarjeta de la "Próxima Parada" priorizada por la IA.
3. **Lista de Pedidos (`/pedidos`)**: Inventario de todas las entregas asignadas. Permite filtrar por estado (pendiente, en ruta, entregado, fallido). Al tocar un pedido, se navega hacia su detalle profundo.
4. **Detalle de Pedido (`/pedidos/[id]`)**: Vista en profundidad. Muestra la información de contacto del cliente, dirección exacta, score de riesgo de entrega y provee las acciones principales: **Confirmar Entrega** o **Reportar Problema**.
5. **Mapa de Ruta (`/mapa`)**: Representación geoespacial del recorrido. Dibuja la ruta optimizada diaria y todos los marcadores geolocalizados de las paradas asignadas.

## 7. Credenciales de Prueba

> [!IMPORTANT]
> Actualmente nos encontramos en la **Fase 1** de la aplicación móvil. El sistema de autenticación y los datos funcionan mediante simulación local (stubs). En la **Fase 2**, esto será reemplazado por la conexión a `Supabase Auth` y PostgreSQL real.

Para acceder a la plataforma en entorno de desarrollo, utiliza estas credenciales de prueba pre-configuradas:

- **Email**: `repartidor@ruteai.cl`
- **Password**: `123456`

## 8. Cómo Ejecutar el Proyecto

Asegúrate de tener instaladas las dependencias correctamente en el contexto del monorepo, aprovechando el hoisting de `pnpm`.

```bash
# 1. Desde la raíz del monorepo, instala todas las dependencias
pnpm install

# 2. Navega a la carpeta de la app móvil
cd apps/mobile

# 3. Levanta el servidor de Expo (limpiando la caché de empaquetado)
npx expo start --clear
```

- **Para dispositivo físico**: Descarga la app oficial de **Expo Go** en tu celular, abre la cámara (iOS) o usa la función de escáner en la app (Android) y apunta al código QR generado en la terminal.
- **Para emulador**: Si tienes Android Studio configurado y un dispositivo virtual (AVD) abierto, simplemente presiona la tecla `a` en la misma terminal para lanzarlo automáticamente. Para el simulador de iOS (si usas Mac), presiona la tecla `i`.

## 9. Estado Actual y Próximos Pasos

| Funcionalidad | Fase 1 (Actual) | Fase 2 (Próximos Pasos) |
| :--- | :--- | :--- |
| **Origen de Datos** | Stubs locales estáticos (datos mock de Chile) | APIs reales (NestJS / Prisma) |
| **Autenticación** | Validaciones simuladas y latencia falsa | Autenticación real usando Supabase Auth |
| **Geolocalización** | Coordenadas pre-programadas | Integración de `expo-location` (Tracking real) |
| **Tiempo Real & Alertas** | Interfaz de UI maquetada y lista | Conexión vía Supabase Realtime / WebSockets |
| **Notificaciones** | Componentes base y paquetes instalados | Integración de Push notifications con el servidor |

## 10. Decisiones Técnicas Relevantes

- **Zustand sobre Redux/Context**: Dada la fuerte adopción de TanStack Query para todo el estado asíncrono y de peticiones a red, el estado global restante requerido (estado de UI como filtros, modal, sesión) es mínimo. Zustand ofrece un patrón atómico mucho más limpio, requiere cero *boilerplate* y evita renderizados masivos e innecesarios, haciendo a herramientas como Redux una carga excesiva e injustificada para este proyecto.
- **TanStack Query sobre `fetch` directo**: El entorno móvil sufre constantemente por la inestabilidad de red. TanStack Query nos provee "gratis" un manejo avanzado de caché, reintentos automáticos bajo fallos (retries), actualización silenciosa en segundo plano, soporte para "pull-to-refresh" nativo y deduplicación de peticiones; lógicas que de otra forma tomarían cientos de líneas de código manual.
- **PNPM Workspaces**: En la arquitectura monorepo de *RouteAI*, el uso de gestores antiguos como NPM o Yarn generaría estructuras pesadas con dependencias duplicadas. PNPM emplea un manejo de paquetes por *hard links* a nivel sistema y reglas de *hoisting* estrictas, lo que ahorra valiosos gigabytes y nos permite compartir el paquete interno `@ruteai/shared-types` sin costosas compilaciones cruzadas.
