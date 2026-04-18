/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation } from "lucide-react";

const gmaps = () => (window as any).google?.maps;

interface Props {
  latitude: number | null;
  longitude: number | null;
  onLocationChange: (lat: number, lng: number) => void;
  showRadius?: boolean;
  radiusKm?: number;
  onRadiusChange?: (km: number) => void;
}

export default function LocationPicker({
  latitude,
  longitude,
  onLocationChange,
  showRadius = false,
  radiusKm = 10,
  onRadiusChange,
}: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const [detecting, setDetecting] = useState(false);

  const defaultLat = latitude ?? 20.5937;
  const defaultLng = longitude ?? 78.9629;

  useEffect(() => {
    const maps = gmaps();
    if (!mapRef.current || !maps) return;

    const map = new maps.Map(mapRef.current, {
      center: { lat: defaultLat, lng: defaultLng },
      zoom: latitude ? 14 : 5,
      styles: [{ featureType: "poi", stylers: [{ visibility: "off" }] }],
      mapTypeControl: false,
      streetViewControl: false,
    });

    const marker = new maps.Marker({
      position: { lat: defaultLat, lng: defaultLng },
      map,
      draggable: true,
      visible: !!latitude,
    });

    marker.addListener("dragend", () => {
      const pos = marker.getPosition();
      if (pos) {
        onLocationChange(pos.lat(), pos.lng());
        if (circleRef.current) circleRef.current.setCenter(pos);
      }
    });

    map.addListener("click", (e: any) => {
      if (e.latLng) {
        marker.setPosition(e.latLng);
        marker.setVisible(true);
        onLocationChange(e.latLng.lat(), e.latLng.lng());
        if (circleRef.current) circleRef.current.setCenter(e.latLng);
      }
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    if (showRadius) {
      const circle = new maps.Circle({
        map,
        center: { lat: defaultLat, lng: defaultLng },
        radius: radiusKm * 1000,
        fillColor: "#22c55e",
        fillOpacity: 0.12,
        strokeColor: "#22c55e",
        strokeWeight: 2,
        visible: !!latitude,
      });
      circleRef.current = circle;
    }

    return () => {
      marker.setMap(null);
      circleRef.current?.setMap(null);
    };
  }, []);

  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setRadius(radiusKm * 1000);
    }
  }, [radiusKm]);

  useEffect(() => {
    if (latitude && longitude && mapInstanceRef.current && markerRef.current) {
      const pos = { lat: latitude, lng: longitude };
      markerRef.current.setPosition(pos);
      markerRef.current.setVisible(true);
      mapInstanceRef.current.panTo(pos);
      mapInstanceRef.current.setZoom(14);
      if (circleRef.current) {
        circleRef.current.setCenter(pos);
        circleRef.current.setVisible(true);
      }
    }
  }, [latitude, longitude]);

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onLocationChange(pos.coords.latitude, pos.coords.longitude);
        setDetecting(false);
      },
      () => setDetecting(false),
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={detectLocation}
          disabled={detecting}
          className="rounded-lg border-border/50 gap-1.5"
        >
          <Navigation className="h-4 w-4" />
          {detecting ? "Detecting…" : "Auto-detect my location"}
        </Button>
        {latitude && longitude && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {latitude.toFixed(4)}, {longitude.toFixed(4)}
          </span>
        )}
      </div>

      <div ref={mapRef} className="h-64 w-full rounded-xl border border-border/50 overflow-hidden" />

      {showRadius && onRadiusChange && (
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            Delivery radius
          </label>
          <input
            type="range"
            min={1}
            max={50}
            value={radiusKm}
            onChange={(e) => onRadiusChange(Number(e.target.value))}
            className="flex-1 accent-primary"
          />
          <span className="text-sm font-semibold text-foreground w-12 text-right">{radiusKm} km</span>
        </div>
      )}
    </div>
  );
}
