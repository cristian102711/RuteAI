/// <reference types="google.maps" />
"use client";

import { useState, useEffect, useRef, useId, useCallback } from "react";
import {
  APIProvider,
  Map,
  Marker,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import type { MapMouseEvent } from "@vis.gl/react-google-maps";
import { MapPin, AlertCircle, Loader2 } from "lucide-react";

const DARK_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#09090b" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#71717a" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#09090b" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#27272a" }] },
  { featureType: "administrative.country", elementType: "labels.text.fill", stylers: [{ color: "#a1a1aa" }] },
  { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.neighborhood", stylers: [{ visibility: "off" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#71717a" }] },
  { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#18181b" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#71717a" }] },
  { featureType: "road.arterial", elementType: "geometry.fill", stylers: [{ color: "#27272a" }] },
  { featureType: "road.highway", elementType: "geometry.fill", stylers: [{ color: "#27272a" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#3f3f46" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#020617" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#3f3f46" }] },
];

const DEFAULT_CENTER: google.maps.LatLngLiteral = { lat: -33.4489, lng: -70.6693 };

type ValidationState = "idle" | "loading" | "valid" | "invalid";

// ──────────────────────────────────────────────
// Inner — must live inside an <APIProvider>
// ──────────────────────────────────────────────
function MapPickerInner({
  mapId,
  value,
  onChange,
  onCoordsChange,
  onValidityChange,
  inputClassName,
  disabled,
}: {
  mapId: string;
  value: string;
  onChange: (v: string) => void;
  onCoordsChange?: (lat: number, lng: number) => void;
  onValidityChange?: (valid: boolean) => void;
  inputClassName?: string;
  disabled?: boolean;
}) {
  const map = useMap(mapId);
  const mapRef = useRef<google.maps.Map | null>(null);
  const geocodingLib = useMapsLibrary("geocoding");
  const placesLib = useMapsLibrary("places");
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const autocompleteRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  const [markerPos, setMarkerPos] = useState<google.maps.LatLngLiteral | null>(null);
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [status, setStatus] = useState<ValidationState>("idle");
  // true cuando el cambio de texto vino de elegir una sugerencia (no re-buscar)
  const skipNextSearch = useRef(false);

  useEffect(() => { mapRef.current = map; }, [map]);

  useEffect(() => {
    if (geocodingLib && !geocoderRef.current) {
      geocoderRef.current = new google.maps.Geocoder();
    }
  }, [geocodingLib]);

  useEffect(() => {
    if (placesLib && !autocompleteRef.current) {
      autocompleteRef.current = new placesLib.AutocompleteService();
      sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
    }
  }, [placesLib]);

  const setValidity = useCallback((s: ValidationState, valid: boolean) => {
    setStatus(s);
    onValidityChange?.(valid);
  }, [onValidityChange]);

  // ── Posiciona el marcador + avisa coords + marca como válido ──────────────
  const aplicarUbicacion = useCallback((pos: google.maps.LatLngLiteral, pan = true) => {
    setMarkerPos(pos);
    onCoordsChange?.(pos.lat, pos.lng);
    setValidity("valid", true);
    if (pan && mapRef.current) {
      mapRef.current.panTo(pos);
      mapRef.current.setZoom(16);
    }
  }, [onCoordsChange, setValidity]);

  // ── Autocompletado: trae sugerencias mientras escribe (con debounce) ──────
  useEffect(() => {
    if (skipNextSearch.current) { skipNextSearch.current = false; return; }
    const q = value.trim();
    if (!q || q.length < 3 || !autocompleteRef.current) {
      setPredictions([]);
      return;
    }
    const handle = setTimeout(() => {
      autocompleteRef.current!.getPlacePredictions(
        {
          input: q,
          componentRestrictions: { country: "cl" },
          sessionToken: sessionTokenRef.current ?? undefined,
        },
        (preds, st) => {
          if (st === google.maps.places.PlacesServiceStatus.OK && preds) {
            setPredictions(preds);
            setShowSuggestions(true);
          } else {
            setPredictions([]);
          }
        },
      );
    }, 300);
    return () => clearTimeout(handle);
  }, [value]);

  // ── Elegir una sugerencia → resolver coords por placeId ───────────────────
  const elegirSugerencia = useCallback((pred: google.maps.places.AutocompletePrediction) => {
    if (!geocoderRef.current) return;
    skipNextSearch.current = true;
    onChange(pred.description);
    setShowSuggestions(false);
    setPredictions([]);
    setValidity("loading", false);
    geocoderRef.current.geocode({ placeId: pred.place_id }, (results, st) => {
      if (st === "OK" && results && results[0]) {
        const loc = results[0].geometry.location;
        aplicarUbicacion({ lat: loc.lat(), lng: loc.lng() });
      } else {
        setValidity("invalid", false);
      }
      // Renovar token de sesión tras completar una selección
      if (placesLib) sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
    });
  }, [onChange, aplicarUbicacion, setValidity, placesLib]);

  // ── Clic en el mapa → reverse geocode → rellena la dirección ──────────────
  const handleMapClick = useCallback(async (e: MapMouseEvent) => {
    if (!e.detail.latLng || !geocoderRef.current) return;
    const lat = e.detail.latLng.lat as unknown as number;
    const lng = e.detail.latLng.lng as unknown as number;
    const pos = { lat, lng };
    setShowSuggestions(false);
    aplicarUbicacion(pos, false);
    try {
      const result = await geocoderRef.current.geocode({ location: pos });
      if (result.results[0]) {
        skipNextSearch.current = true;
        onChange(result.results[0].formatted_address);
      }
    } catch {
      /* dejamos las coords; la dirección queda como esté */
    }
  }, [onChange, aplicarUbicacion]);

  // ── Geocodificar el texto libre (blur / Enter sin elegir sugerencia) ──────
  const geocodeAddress = useCallback(async () => {
    if (!value.trim() || !geocoderRef.current) return;
    setValidity("loading", false);
    try {
      const result = await geocoderRef.current.geocode({ address: value.trim(), region: "CL" });
      if (result.results[0]) {
        const loc = result.results[0].geometry.location;
        aplicarUbicacion({ lat: loc.lat(), lng: loc.lng() });
      } else {
        setValidity("invalid", false);
      }
    } catch {
      setValidity("invalid", false);
    }
  }, [value, aplicarUbicacion, setValidity]);

  const borderState =
    status === "invalid"
      ? "border-rose-500/70 focus:ring-rose-500/30 focus:border-rose-500"
      : status === "valid"
        ? "border-emerald-500/50 focus:ring-emerald-500/30 focus:border-emerald-500"
        : "";

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (status !== "idle") setValidity("idle", false);
          }}
          onBlur={() => {
            // Cierra el dropdown tras dar tiempo al click de la sugerencia
            setTimeout(() => setShowSuggestions(false), 150);
            if (!markerPos || status === "idle") geocodeAddress();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (predictions[0]) elegirSugerencia(predictions[0]);
              else geocodeAddress();
            } else if (e.key === "Escape") {
              setShowSuggestions(false);
            }
          }}
          placeholder="Ej: Av. Providencia 1234, Santiago"
          disabled={disabled}
          autoComplete="off"
          className={`${inputClassName ?? ""} ${borderState}`}
        />

        {/* Indicador de estado a la derecha del input */}
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
          {status === "loading" && <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />}
          {status === "valid" && <MapPin className="h-4 w-4 text-emerald-400" />}
          {status === "invalid" && <AlertCircle className="h-4 w-4 text-rose-400" />}
        </span>

        {/* Dropdown de sugerencias */}
        {showSuggestions && predictions.length > 0 && (
          <ul className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-white/10 bg-zinc-900 shadow-2xl shadow-black/50">
            {predictions.slice(0, 5).map((p) => (
              <li key={p.place_id}>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); elegirSugerencia(p); }}
                  className="flex w-full items-start gap-2 px-3 py-2 text-left text-xs text-zinc-300 hover:bg-white/5 hover:text-white transition-colors"
                >
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                  <span>
                    <span className="block font-medium">{p.structured_formatting.main_text}</span>
                    <span className="block text-[10px] text-zinc-500">{p.structured_formatting.secondary_text}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {status === "invalid" && (
        <span className="ml-1 flex items-center gap-1 text-[11px] font-semibold text-rose-400">
          <AlertCircle className="h-3 w-3" /> Dirección inválida — escribe una dirección real o tócala en el mapa.
        </span>
      )}

      <div className="relative rounded-xl overflow-hidden border border-white/[0.06]" style={{ height: 220 }}>
        <Map
          id={mapId}
          defaultCenter={DEFAULT_CENTER}
          defaultZoom={12}
          gestureHandling="greedy"
          disableDefaultUI={true}
          zoomControl={true}
          styles={DARK_MAP_STYLE}
          className="w-full h-full cursor-crosshair"
          onClick={handleMapClick}
          clickableIcons={false}
        >
          {markerPos && (
            <Marker
              position={markerPos}
              icon={{
                path: "M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z",
                fillColor: "#f59e0b",
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 1.5,
                scale: 0.9,
              }}
            />
          )}
        </Map>

        {!markerPos && (
          <div className="absolute inset-0 pointer-events-none flex items-end justify-center pb-3">
            <span className="text-[10px] text-zinc-400 bg-zinc-950/80 rounded-lg px-3 py-1.5 tracking-wide">
              Escribe y elige una sugerencia, o toca el mapa para fijar la ubicación
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Public component — wraps with APIProvider
// ──────────────────────────────────────────────
export interface MapPickerInputProps {
  value: string;
  onChange: (v: string) => void;
  onCoordsChange?: (lat: number, lng: number) => void;
  onValidityChange?: (valid: boolean) => void;
  inputClassName?: string;
  disabled?: boolean;
}

export function MapPickerInput({
  value,
  onChange,
  onCoordsChange,
  onValidityChange,
  inputClassName,
  disabled,
}: MapPickerInputProps) {
  const rawId = useId();
  const mapId = `map-picker-${rawId.replace(/:/g, "")}`;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? "";

  // Sin API key → input simple (fallback para entornos sin Google Maps)
  if (!apiKey) {
    return (
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ej: Av. Providencia 1234, Santiago"
        disabled={disabled}
        className={inputClassName}
      />
    );
  }

  return (
    <APIProvider apiKey={apiKey} libraries={["places", "geocoding"]}>
      <MapPickerInner
        mapId={mapId}
        value={value}
        onChange={onChange}
        onCoordsChange={onCoordsChange}
        onValidityChange={onValidityChange}
        inputClassName={inputClassName}
        disabled={disabled}
      />
    </APIProvider>
  );
}
