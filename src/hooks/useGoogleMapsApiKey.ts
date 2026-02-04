import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type PublicConfigResponse = {
  google_maps_api_key?: string | null;
};

let cachedKey: string | null | undefined = undefined;
let inflight: Promise<string | null> | null = null;

async function fetchKey(): Promise<string | null> {
  if (cachedKey !== undefined) return cachedKey;
  if (inflight) return inflight;

  inflight = (async () => {
    const { data, error } = await supabase.functions.invoke("public-config", {
      method: "GET",
    });
    if (error) {
      cachedKey = null;
      throw error;
    }
    const key = (data as PublicConfigResponse | null | undefined)?.google_maps_api_key ?? null;
    cachedKey = key;
    return key;
  })().finally(() => {
    inflight = null;
  });

  return inflight;
}

export function useGoogleMapsApiKey() {
  const [apiKey, setApiKey] = useState<string | null>(cachedKey ?? null);
  const [loading, setLoading] = useState<boolean>(cachedKey === undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (cachedKey !== undefined) {
      setLoading(false);
      setApiKey(cachedKey ?? null);
      return;
    }

    setLoading(true);
    fetchKey()
      .then((key) => {
        if (cancelled) return;
        setApiKey(key);
        setError(null);
      })
      .catch((e) => {
        if (cancelled) return;
        setApiKey(null);
        setError(e?.message ?? "Failed to load config");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { apiKey, loading, error };
}
