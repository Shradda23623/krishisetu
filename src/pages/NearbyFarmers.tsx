import { useState, useEffect } from "react";
import { MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import SmartNavbar from "@/components/SmartNavbar";
import GoogleMapLoader from "@/components/GoogleMapLoader";
import NearbyFarmersMap from "@/components/NearbyFarmersMap";
import { useGoogleMapsKey } from "@/hooks/useGoogleMapsKey";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function NearbyFarmers() {
  const { user } = useAuth();
  const { apiKey, loading: keyLoading } = useGoogleMapsKey();
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [detecting, setDetecting] = useState(false);

  // Load saved location from profile
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("latitude, longitude")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.latitude && data?.longitude) {
          setLat(data.latitude);
          setLng(data.longitude);
        }
      });
  }, [user]);

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setDetecting(false);
        // Save to profile
        if (user) {
          supabase
            .from("profiles")
            .update({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
            .eq("user_id", user.id);
        }
      },
      () => setDetecting(false),
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <SmartNavbar />
      <div className="container py-8">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold text-foreground flex items-center gap-2">
            <MapPin className="h-8 w-8 text-primary" /> Nearby Farmers
          </h1>
          <p className="text-muted-foreground">
            Discover local farmers delivering fresh produce to your area
          </p>
        </div>

        {keyLoading ? (
          <div className="flex h-64 items-center justify-center rounded-xl bg-muted/30 text-muted-foreground">
            Loading…
          </div>
        ) : !apiKey ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-xl bg-muted/30 text-muted-foreground gap-2">
            <p>Please log in to view nearby farmers.</p>
            <Button asChild variant="outline" className="rounded-lg">
              <a href="/auth">Sign In</a>
            </Button>
          </div>
        ) : lat && lng ? (
          <GoogleMapLoader apiKey={apiKey}>
            <NearbyFarmersMap userLat={lat} userLng={lng} />
          </GoogleMapLoader>
        ) : (
          <div className="flex h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/50 gap-4">
            <Navigation className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground text-center">
              Share your location to find farmers delivering near you
            </p>
            <Button onClick={detectLocation} disabled={detecting} className="rounded-xl bg-primary font-display font-semibold text-primary-foreground">
              <MapPin className="mr-2 h-4 w-4" />
              {detecting ? "Detecting…" : "Share My Location"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
