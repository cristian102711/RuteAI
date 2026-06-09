# RF-04: Tracking GPS en vivo (Supabase Realtime)

Este documento detalla la implementación de seguimiento GPS en tiempo real para flotas de reparto.

## Arquitectura

- **Google Maps (`@vis.gl/react-google-maps`)**: El render del mapa usa Google Maps con un estilo oscuro personalizado (coincide con `zinc-950`). Requiere la variable `NEXT_PUBLIC_GOOGLE_MAPS_KEY` (ver `.env.example`); sin ella, los mapas muestran un placeholder estático.
- **Geocodificación**: La transformación de texto ("Calle XYZ 123") a coordenadas numéricas (Lat/Lng) ocurre automáticamente utilizando la API gratuita de Nominatim (OSM) — ver `lib/geocodingService.ts`.
- **Websockets con Supabase Realtime Channels**: El monitoreo en vivo no sobrecarga la base de datos de PostgreSQL. Se utiliza la memoria efímera de los WebSockets de Supabase (Channels). Cada cliente se conecta al canal privado por empresa (`ubicaciones:ID-EMPRESA`).

## Componentes desarrollados:

1. **`app/dashboard/rutas/page.tsx`**: Orquesta la carga de coordenadas de pedidos y últimas ubicaciones desde Prisma.
2. **`app/dashboard/rutas/RutasMapaClient.tsx`**: Mapa principal interactivo. Dibuja la línea de ruta (Polyline) entre paradas, marcadores numerados, encuadre automático (fit bounds), botones de control (zoom, centrar, capa, pantalla completa) y el pin del repartidor en vivo vía Supabase Realtime.
3. **`app/dashboard/components/MiniMapaRender.tsx`**: Mini-mapa del dashboard con la misma tecnología (ruta + paradas + GPS en vivo).
4. **`app/dashboard/components/RealtimeGPSPin.tsx`**: Hook/`useRealtimeGPS` que se suscribe al canal de Supabase y entrega la ubicación en vivo.

## Siguientes Pasos (A futuro)
- Conectar la app móvil (`apps/mobile`) para que los choferes emitan su ubicación real con `expo-location` (`watchPositionAsync`) al canal de Broadcast, reemplazando los datos *stub* actuales.
- Trazar la ruta usando la Directions API de Google (calles reales) en lugar de líneas rectas entre paradas.
- Ordenar las paradas según el resultado del microservicio de IA (`rutaOptimizada`) en vez de por fecha de creación.
