// ============================================================
// Geocoding Service — RF-02
// Usa Nominatim (OpenStreetMap) — Gratis, sin API Key
// Convierte una dirección de texto en coordenadas lat/lng
// ============================================================

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

interface GeocodingResult {
  lat: number;
  lng: number;
  displayName: string;
}

/**
 * Geocodifica una dirección de texto a coordenadas GPS.
 * Usa Nominatim (OpenStreetMap) — completamente gratuito.
 *
 * @param direccion - Ej: "Av. Providencia 1234, Santiago"
 * @param pais - Código de país para mejorar la precisión (default: "CL")
 * @returns Coordenadas lat/lng o null si no se encontró
 */
export async function geocodificarDireccion(
  direccion: string,
  pais: string = "CL"
): Promise<GeocodingResult | null> {
  try {
    const query    = encodeURIComponent(`${direccion}, ${pais}`);
    const url      = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=${pais.toLowerCase()}`;

    const response = await fetch(url, {
      headers: {
        // Nominatim requiere un User-Agent identificativo
        "User-Agent": "RuteAI/1.0 (ruteai.vercel.app)",
      },
      // Timeout de 5 segundos para no bloquear la creación del pedido
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return null;

    const results = await response.json() as NominatimResult[];

    if (!results || results.length === 0) return null;

    const [primer] = results;
    return {
      lat:         parseFloat(primer.lat),
      lng:         parseFloat(primer.lon),
      displayName: primer.display_name,
    };
  } catch (error) {
    // No lanzamos error — la creación del pedido continúa sin coordenadas
    console.warn(`[Geocoding] No se pudo geocodificar "${direccion}":`, error);
    return null;
  }
}
