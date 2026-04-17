# 🎨 Recomendaciones de Diseño UI/UX & Análisis de Faltantes (RouteAI)

Basado en las mejores prácticas del repositorio `ui-ux-pro-max-skill` y los requerimientos funcionales del proyecto, aquí tienes las recomendaciones de diseño y el estado actual de lo que falta por implementar.

---

## 💎 Recomendaciones de Diseño (UI/UX Pro Max)

Dado que RouteAI es una plataforma B2B (Logística B2B para equipos tecnológicos de alto valor), el diseño debe transmitir **confianza, modernidad y rendimiento extremo**.

1. **Tema y Paleta de Colores (Premium Dark Mode):**
   - **Fondo Principal:** Negro profundo o `zinc-950` (`#09090b`).
   - **Acentos (Primario):** Emerald Tailwind (`#34d399` a `#10b981`) para acciones positivas (Despachos a tiempo, entregas exitosas). Esto evoca el concepto de rutas, mapas y "luz verde".
   - **Alertas / Peligro:** Rose Tailwind (`#fb7185`) para alertas de desviación GPS, riesgos de entrega y fallos críticos de la IA.
   - **Superficies:** Tarjetas en `zinc-900` con bordes sutiles en `zinc-800` (`border border-zinc-800`).

2. **Tipografía:**
   - Usa una familia tipográfica geométrica o neo-grotesca, como **Geist** (que ya tienes configurada), **Inter** o **Outfit**. 
   - Jerarquía clara: Títulos extra audaces (`font-extrabold`, `tracking-tight`), y subtítulos descriptivos legibles con colores muteados (`text-zinc-500`).

3. **Interactividad y Animaciones (Micro-interacciones):**
   - **Hover States:** Usa transformaciones sutiles (`hover:-translate-y-1 hover:shadow-lg transition-all active:scale-95`).
   - **Glassmorphism:** Para barras de navegación o popups flotantes, usa fondos semi-transparentes con blur (`bg-zinc-950/80 backdrop-blur-md`).
   - **Skeleton Loaders:** Para las listas de pedidos y el mapa en tiempo real, implementa skeletons que pulsan (`animate-pulse`) en lugar de spinners básicos.

4. **Patrones de Interfaz SaaS B2B:**
   - **Dashboard Layout:** El sidebar actual (con iconos Lucide) es perfecto. Mantén el layout de "pantalla completa" (`h-screen overflow-hidden`) para que parezca una aplicación nativa.
   - **Data Tables densas:** La visualización de la información del pedido debe ser escaneable. Usa tags de colores para los estados (Pendiente, En Ruta, Entregado, etc.).

---

## 🚀 Análisis de Faltantes del Proyecto

Al comparar tu archivo de *Requerimientos Funcionales (Docs/requerimientos-final.md)* con el código actual del repositorio, este es el resumen de lo que **FALTA** por desarrollar para el MVP:

### Crítico (Próximos Pasos Inmediatos)
- [ ] **RF-02 - Optimización de Rutas (Google Maps):** Implementar la lógica para calcular rutas eficientes basado en las direcciones de los pedidos. Falta la integración con el API de Google Maps o Mapbox.
- [ ] **RF-03 - Predicción de Riesgo IA (Real):** Actualmente el score de riesgo en `actions.ts` genera un número aleatorio (`Math.random() * 100`). Falta conectar esto con un microservicio de predicción.

### Desarrollo Core
- [ ] **RF-04 & RF-05 - Tracking GPS y Desvíos:** Implementar `Supabase Realtime` para obtener y renderizar el pin en vivo de los repartidores. Falta crear el flujo para enviar lat/lng y escuchar esos eventos en el cliente (Dashboard).
- [ ] **RF-06 - Notificaciones SMS/WhatsApp:** Se requiere integración con `Twilio` cuando el pedido pasa a estado "En ruta" para enviarle el link público al cliente final.
- [ ] **RF-07 - Confirmación con Evidencia (Storage):** Falta configurar `Supabase Storage` y crear la subida de archivos para almacenar las fotos y firmas del receptor que enviará la app móvil.

### Aplicación Móvil & Frontend Público
- [ ] **App Móvil (React Native):** Todo el módulo del pioneta/repartidor todavía no está construido dentro del monorepo (o repo separado).
- [ ] **Tracking Público (`/tracking/[id]`):** La interfaz donde el cliente entra sin login para ver su repartidor acercarse.

### Infraestructura y Varios
- [ ] **Políticas RLS en Supabase:** Aunque está documentado en tu markdown, debes asegurar que el SQL de las Row Level Security policies de `Empresa`, `Pedido` y `Usuario` estén desplegadas en tu proyecto de Supabase.
- [ ] **RF-10 - CRON para Reportes Diarios:** Falta la lógica de generación automática de reportes usando Supabase Edge Functions con triggers CRON.
