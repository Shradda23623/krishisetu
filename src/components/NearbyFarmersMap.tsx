/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const gmaps = () => (window as any).google?.maps;

interface FarmerProfile {
  user_id: string;
  display_name: string | null;
  phone: string | null;
  latitude: number;
  longitude: number;
  delivery_radius_km: number;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface Props {
  userLat: number;
  userLng: number;
}

export default function NearbyFarmersMap({ userLat, userLng }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [farmers, setFarmers] = useState<(FarmerProfile & { distance: number })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "farmer");

      if (!roles?.length) {
        setLoading(false);
        return;
      }

      const farmerIds = roles.map((r) => r.user_id);

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, phone, latitude, longitude, delivery_radius_km")
        .in("user_id", farmerIds)
        .not("latitude", "is", null)
        .not("longitude", "is", null);

      if (profiles) {
        const withDistance = (profiles as unknown as FarmerProfile[])
          .map((f) => ({
            ...f,
            distance: haversineKm(userLat, userLng, f.latitude, f.longitude),
          }))
          .filter((f) => f.distance <= (f.delivery_radius_km || 50))
          .sort((a, b) => a.distance - b.distance);

        setFarmers(withDistance);
      }
      setLoading(false);
    })();
  }, [userLat, userLng]);

  useEffect(() => {
    const maps = gmaps();
    if (!mapRef.current || !maps || loading) return;

    const map = new maps.Map(mapRef.current, {
      center: { lat: userLat, lng: userLng },
      zoom: 12,
      styles: [{ featureType: "poi", stylers: [{ visibility: "off" }] }],
      mapTypeControl: false,
      streetViewControl: false,
    });

    // User marker
    new maps.Marker({
      position: { lat: userLat, lng: userLng },
      map,
      icon: {
        path: maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: "#3b82f6",
        fillOpacity: 1,
        strokeColor: "#fff",
        strokeWeight: 3,
      },
      title: "You",
    });

    // Farmer markers + radius circles
    farmers.forEach((f) => {
      const marker = new maps.Marker({
        position: { lat: f.latitude, lng: f.longitude },
        map,
        title: f.display_name || "Farmer",
        icon: {
          path: maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 7,
          fillColor: "#22c55e",
          fillOpacity: 1,
          strokeColor: "#fff",
          strokeWeight: 2,
        },
      });

      new maps.Circle({
        map,
        center: { lat: f.latitude, lng: f.longitude },
        radius: (f.delivery_radius_km || 10) * 1000,
        fillColor: "#22c55e",
        fillOpacity: 0.06,
        strokeColor: "#22c55e",
        strokeWeight: 1,
        strokeOpacity: 0.4,
      });

      const infoWindow = new maps.InfoWindow({
        content: `
          <div style="font-family:sans-serif;padding:4px">
            <strong>${f.display_name || "Farmer"}</strong><br/>
            <span style="color:#666;font-size:12px">${f.distance.toFixed(1)} km away</span><br/>
            <span style="color:#666;font-size:12px">Delivers within ${f.delivery_radius_km || 10} km</span>
          </div>
        `,
      });

      marker.addListener("click", () => infoWindow.open(map, marker));
    });

    if (farmers.length > 0) {
      const bounds = new maps.LatLngBounds();
      bounds.extend({ lat: userLat, lng: userLng });
      farmers.forEach((f) => bounds.extend({ lat: f.latitude, lng: f.longitude }));
      map.fitBounds(bounds, 60);
    }
  }, [farmers, loading, userLat, userLng]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl bg-muted/30 text-muted-foreground">
        Finding nearby farmers…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div ref={mapRef} className="h-80 w-full rounded-xl border border-border/50 overflow-hidden" />

      {farmers.length === 0 ? (
        <p className="text-center text-muted-foreground py-4">
          No farmers found delivering to your area yet. Check back soon!
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {farmers.map((f) => (
            <Card key={f.user_id} className="glass-card border-0 rounded-xl">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-semibold text-foreground truncate">
                    {f.display_name || "Farmer"}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Truck className="h-3 w-3" /> {f.distance.toFixed(1)} km away · delivers within {f.delivery_radius_km || 10} km
                  </p>
                </div>
                <Link to="/products">
                  <Button size="sm" variant="outline" className="rounded-lg border-border/50 text-xs">
                    View Products
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
