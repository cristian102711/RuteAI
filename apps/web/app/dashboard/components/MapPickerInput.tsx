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

// ──────────────────────────────────────────────
// Inner — must live inside an <APIProvider>
// ──────────────────────────────────────────────
function MapPickerInner({
  mapId,
  value,
  onChange,
  onCoordsChange,
  inputClassName,
  disabled,
}: {
  mapId: string;
  value: string;
  onChange: (v: string) => void;
  onCoordsChange?: (lat: number, lng: number) => void;
  inputClassName?: string;
  disabled?: boolean;
}) {
  const map = useMap(mapId);
  const mapRef = useRef<google.maps.Map | null>(null);
  const geocodingLib = useMapsLibrary("geocoding");
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const [markerPos, setMarkerPos] = useState<google.maps.LatLngLiteral | null>(null);

  // Keep mapRef in sync
  useEffect(() => { mapRef.current = map; }, [map]);

  // Instantiate geocoder once the library loads
  useEffect(() => {
    if (geocodingLib && !geocoderRef.current) {
      geocoderRef.current = new google.maps.Geocoder();
    }
  }, [geocodingLib]);

  // Click on map → reverse geocode → fill address
  const handleMapClick = useCallback(
    async (e: MapMouseEvent) => {
      if (!e.detail.latLng || !geocoderRef.current) return;
      // detail.latLng is LatLngLiteral (plain object) in @vis.gl/react-google-maps
      const lat = e.detail.latLng.lat as unknown as number;
      const lng = e.detail.latLng.lng as unknown as number;
      const pos = { lat, lng };
      setMarkerPos(pos);
      onCoordsChange?.(lat, lng);
      try {
        const result = await geocoderRef.current.geocode({ location: pos });
        if (result.results[0]) {
          onChange(result.results[0].formatted_address);
        }
      } catch {
        // geocoding failed silently
      }
    },
    [onChange, onCoordsChange],
  );

  // Address blur / Enter → forward geocode → move marker + pan map
  const geocodeAddress = useCallback(async () => {
    if (!value.trim() || !geocoderRef.current) return;
    try {
      const result = await geocoderRef.current.geocode({
        address: value.trim(),
        region: "CL",
      });
      if (result.results[0]) {
        const loc = result.results[0].geometry.location;
        const pos = { lat: loc.lat(), lng: loc.lng() };
        setMarkerPos(pos);
        onCoordsChange?.(pos.lat, pos.lng);
        if (mapRef.current) {
          mapRef.current.panTo(pos);
          mapRef.current.setZoom(16);
        }
      }
    } catch {
      // geocoding failed silently
    }
  }, [value, onCoordsChange]);

  return (
    <div className="flex flex-col gap-2">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={geocodeAddress}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            geocodeAddress();
          }
        }}
        placeholder="Ej: Av. Providencia 1234, Santiago"
        disabled={disabled}
        className={inputClassName}
      />

      <div
        className="relative rounded-xl overflow-hidden border border-white/[0.06]"
        style={{ height: 220 }}
      >
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
              Toca el mapa para fijar la ubicación exacta
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
  inputClassName?: string;
  disabled?: boolean;
}

export function MapPickerInput({
  value,
  onChange,
  onCoordsChange,
  inputClassName,
  disabled,
}: MapPickerInputProps) {
  const rawId = useId();
  const mapId = `map-picker-${rawId.replace(/:/g, "")}`;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? "";

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
    <APIProvider apiKey={apiKey}>
      <MapPickerInner
        mapId={mapId}
        value={value}
        onChange={onChange}
        onCoordsChange={onCoordsChange}
        inputClassName={inputClassName}
        disabled={disabled}
      />
    </APIProvider>
  );
}
