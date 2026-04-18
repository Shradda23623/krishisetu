import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useGoogleMapsKey() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.functions
      .invoke("get-maps-key")
      .then(({ data, error }) => {
        if (!error && data?.key) setApiKey(data.key);
        setLoading(false);
      });
  }, []);

  return { apiKey, loading };
}
