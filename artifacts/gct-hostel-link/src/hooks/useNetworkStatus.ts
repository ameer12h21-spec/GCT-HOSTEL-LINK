import { useState, useEffect, useRef, useCallback } from "react";

export type NetworkQuality = "offline" | "very-low" | "low" | "medium" | "high" | "very-high";

export interface NetworkStatus {
  quality: NetworkQuality;
  isOnline: boolean;
  latencyMs: number | null;
  label: string;
  bars: number;
  color: string;
  warning: string | null;
  isSafeForPayments: boolean;
}

function qualityFromLatency(latencyMs: number): NetworkQuality {
  if (latencyMs === Infinity || latencyMs > 5000) return "very-low";
  if (latencyMs > 2000) return "low";
  if (latencyMs > 700) return "medium";
  if (latencyMs > 250) return "high";
  return "very-high";
}

function qualityFromEffectiveType(type: string): NetworkQuality {
  switch (type) {
    case "slow-2g": return "very-low";
    case "2g": return "low";
    case "3g": return "medium";
    case "4g": return "high";
    default: return "medium";
  }
}

function mergeQualities(a: NetworkQuality, b: NetworkQuality): NetworkQuality {
  const order: NetworkQuality[] = ["offline", "very-low", "low", "medium", "high", "very-high"];
  return order[Math.min(order.indexOf(a), order.indexOf(b))];
}

function buildStatus(quality: NetworkQuality, latencyMs: number | null, isOnline: boolean): NetworkStatus {
  const labels: Record<NetworkQuality, string> = {
    "offline": "No Internet",
    "very-low": "Very Low",
    "low": "Low",
    "medium": "Medium",
    "high": "High",
    "very-high": "Very High",
  };
  const barsMap: Record<NetworkQuality, number> = {
    "offline": 0, "very-low": 1, "low": 2, "medium": 3, "high": 4, "very-high": 4,
  };
  const colorMap: Record<NetworkQuality, string> = {
    "offline": "text-red-600",
    "very-low": "text-red-500",
    "low": "text-orange-500",
    "medium": "text-yellow-500",
    "high": "text-green-500",
    "very-high": "text-green-400",
  };

  let warning: string | null = null;
  if (quality === "offline") warning = "No internet connection. Payments cannot be saved until you are back online.";
  else if (quality === "very-low") warning = "Network signal very low. Move to a better location before updating payments.";
  else if (quality === "low") warning = "Weak network signal. Payment updates may fail. Try a better location.";

  return {
    quality,
    isOnline,
    latencyMs,
    label: labels[quality],
    bars: barsMap[quality],
    color: colorMap[quality],
    warning,
    isSafeForPayments: quality !== "offline" && quality !== "very-low",
  };
}

async function measureLatency(): Promise<number> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  const start = performance.now();
  try {
    await fetch(`/favicon.ico?t=${Date.now()}`, {
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return performance.now() - start;
  } catch {
    clearTimeout(timeout);
    return Infinity;
  }
}

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>(() =>
    buildStatus(navigator.onLine ? "medium" : "offline", null, navigator.onLine)
  );
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const update = useCallback(async () => {
    const isOnline = navigator.onLine;
    if (!isOnline) {
      setStatus(buildStatus("offline", null, false));
      return;
    }

    // Use Network Information API if available (Chrome/Android)
    const conn = (navigator as any).connection;
    let typeQuality: NetworkQuality = "medium";
    if (conn?.effectiveType) {
      typeQuality = qualityFromEffectiveType(conn.effectiveType);
    }

    const latencyMs = await measureLatency();
    const latencyQuality = qualityFromLatency(latencyMs);

    // Take the worse of the two measurements
    const final = conn?.effectiveType
      ? mergeQualities(typeQuality, latencyQuality)
      : latencyQuality;

    setStatus(buildStatus(
      isOnline ? final : "offline",
      latencyMs === Infinity ? null : Math.round(latencyMs),
      isOnline
    ));
  }, []);

  useEffect(() => {
    update();

    // Poll every 15 seconds
    timerRef.current = setInterval(update, 15000);

    // Listen for online/offline events
    const handleOnline = () => update();
    const handleOffline = () => {
      setStatus(buildStatus("offline", null, false));
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Listen to Network Information API change events
    const conn = (navigator as any).connection;
    if (conn) conn.addEventListener("change", update);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (conn) conn.removeEventListener("change", update);
    };
  }, [update]);

  return status;
}
