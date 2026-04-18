import { useEffect, useState, type ReactNode } from "react";

interface Props {
  apiKey: string;
  children: ReactNode;
}

let loadPromise: Promise<void> | null = null;

function loadScript(apiKey: string): Promise<void> {
  if (loadPromise) return loadPromise;
  if ((window as any).google?.maps) return Promise.resolve();

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });
  return loadPromise;
}

export default function GoogleMapLoader({ apiKey, children }: Props) {
  const [ready, setReady] = useState(!!(window as any).google?.maps);

  useEffect(() => {
    loadScript(apiKey).then(() => setReady(true));
  }, [apiKey]);

  if (!ready) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl bg-muted/30 text-muted-foreground">
        Loading map…
      </div>
    );
  }

  return <>{children}</>;
}
