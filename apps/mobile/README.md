# RouteAI Mobile — Mockup Visual

Esta es la versión **Mockup y Diseño Visual** de la aplicación móvil de RouteAI para repartidores.

## Estado: 🎨 Diseño y Mockup (Sprint 1)
Este entregable se centra en la experiencia de usuario (UX) y la consistencia visual con la plataforma web. **No contiene lógica de negocio real ni conexiones a bases de datos.**

### Características Implementadas
- [x] **Design Tokens**: Sincronizados con la web (`zinc-950`, `emerald-400`).
- [x] **Navegación**: Estructura de tabs (Dashboard, Pedidos, Mapa, Perfil).
- [x] **Pantallas Mock**:
  - Login visual.
  - Dashboard con métricas estáticas.
  - Lista de pedidos con filtros.
  - Detalle de pedido con barra de riesgo IA.
  - Mapa de ruta estático (simulación).
- [x] **Arquitectura**: Preparada para integración con BFF.

### Stack Tecnológico
- **React Native + Expo SDK 52**
- **Expo Router** (Navegación basada en archivos)
- **Lucide React Native** (Iconografía)
- **Tailwind CSS / NativeWind** (Estilos)

## Cómo Ejecutar (Desarrollo)

### Requisitos
- Node.js >= 20
- pnpm >= 9
- Expo Go (en tu móvil)

### Pasos
1. Instalar dependencias (desde la raíz del monorepo):
   ```bash
   pnpm install
   ```
2. Iniciar servidor de desarrollo:
   ```bash
   pnpm --filter @ruteai/mobile start
   ```
3. Escanea el código QR con la app **Expo Go**.

## Documentación Relevante
- [SECURITY.md](./SECURITY.md): Flujo de seguridad en producción.
- [ARCHITECTURE_NOTES.md](./ARCHITECTURE_NOTES.md): Detalles sobre el patrón BFF.

## Checklist de Aceptación Visual
- [ ] El tema oscuro coincide con la web (`zinc-950`).
- [ ] Los botones y acentos usan el verde esmeralda (`emerald-400`).
- [ ] La tipografía es clara y legible (System font fallback).
- [ ] Las pantallas fluyen correctamente mediante la navegación de tabs.
- [ ] El detalle de pedido muestra la información de los fixtures.
