// =============================================================================
//  Configuración DINÁMICA de Expo (RouteAI Mobile — Android únicamente)
// -----------------------------------------------------------------------------
//  Este archivo extiende app.json para inyectar la API Key de Google Maps
//  desde variables de entorno (process.env), sin exponerla en el repo.
//
//  Expo carga automáticamente el archivo `.env` de esta carpeta (apps/mobile)
//  ANTES de evaluar este archivo.
//
//  👉 PARA ACTIVAR GOOGLE MAPS (cuando tengas la key):
//     1. Crea apps/mobile/.env (copia de .env.example)
//     2. Pega tu key en GOOGLE_MAPS_API_KEY=...
//     3. Ejecuta: npx expo prebuild --clean
//        para que la key se inyecte en AndroidManifest.xml.
//
//  La key NO lleva prefijo EXPO_PUBLIC_ porque no viaja en el bundle JS:
//  se incrusta en el binario nativo durante el prebuild.
// =============================================================================

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY ?? '';

module.exports = ({ config }) => ({
  ...config,

  android: {
    ...config.android,
    config: {
      ...config.android?.config,
      googleMaps: {
        // Se inyecta en AndroidManifest.xml como com.google.android.geo.API_KEY
        apiKey: GOOGLE_MAPS_API_KEY,
      },
    },
  },

  plugins: [
    ...(config.plugins ?? []),
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission:
          'RouteAI usa tu ubicación para mostrar tu posición en el mapa y optimizar tus rutas de entrega.',
      },
    ],
  ],
});
