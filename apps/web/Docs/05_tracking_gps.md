# RF-04: Tracking GPS en vivo (Supabase Realtime)

Este documento detalla la implementación de seguimiento GPS en tiempo real para flotas de reparto sin requerir el uso de componentes de pago (Google Maps/Pusher).

## Arquitectura

- **Leaflet & OpenStreetMap (Nominatim)**: Se eliminó Google Maps para evitar complicaciones de facturación y se construyó una propia renderización de mapas en modo oscuro (`CartoDB Dark Matter`) utilizando OSM gratuitamente.
- **Geocodificación**: La transformación de texto ("Calle XYZ 123") a coordenadas numéricas (Lat/Lng) ocurre automáticamente utilizando la API gratuita de Nominatim (OSM).
- **Websockets con Supabase Realtime Channels**: El monitoreo en vivo no sobrecarga la base de datos de PostgreSQL. Se utiliza la memoria efímera de los WebSockets de Supabase (Channels). Cada cliente se conecta al canal privado `tracking_ID-EMPRESA`.

## Componentes desarrollados:

1. **`app/dashboard/rutas/page.tsx`**: Orquesta la carga de las coordenadas desde Prisma y Supabase, invocando a la API de OSM.
2. **`app/dashboard/components/MapaRutas.tsx`**: Se encarga exclusivamente del renderizado en cliente y la suscripción a Supabase (Broadcasting). Se crea y actualiza de forma fluida el ícono del camión sin re-montar el mapa.
3. **`app/dashboard/components/SimuladorRuta.tsx`**: Componente de test de desarrollo. Permite testear el comportamiento del "Conductor" emitiendo coordenadas falsas entre 2 puntos definidos a una tasa de actualización rápida (400ms por paso) para verificar la fluidez del mapa.

## Siguientes Pasos (A futuro)
- Desarrollar la PWA (Aplicación Móvil Web) para choferes, dónde tomarán el API nativo `navigator.geolocation.watchPosition()` en lugar de utilizar el simulador actual y los emitirán al mismo canal de Broadcast.
