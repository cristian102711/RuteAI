// ============================================================
// Geocoding Service — RF-02
// Usa Google Geocoding API — mayor precisión para Chile
// Convierte una dirección de texto en coordenadas lat/lng
// ============================================================

interface GoogleGeocodingResponse {
  status: string;
  results: Array<{
    formatted_address: string;
    geometry: {
      location: { lat: number; lng: number };
    };
  }>;
  error_message?: string;
}

interface GeocodingResult {
  lat: number;
  lng: number;
  displayName: string;
}

export async function geocodificarDireccion(
  direccion: string,
  region: string = "cl"
): Promise<GeocodingResult | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

  if (!apiKey) {
    console.warn("[Geocoding] NEXT_PUBLIC_GOOGLE_MAPS_KEY no configurado");
    return null;
  }

  try {
    const query = encodeURIComponent(direccion);
    const url   = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&region=${region}&language=es&key=${apiKey}`;

    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return null;

    const data = await response.json() as GoogleGeocodingResponse;

    if (data.status !== "OK" || data.results.length === 0) {
      if (data.status !== "ZERO_RESULTS") {
        console.warn(`[Geocoding] Google API respondió con status: ${data.status}`);
      }
      return null;
    }

    const { lat, lng } = data.results[0].geometry.location;
    return {
      lat,
      lng,
      displayName: data.results[0].formatted_address,
    };
  } catch (error) {
    console.warn(`[Geocoding] No se pudo geocodificar "${direccion}":`, error);
    return null;
  }
}
