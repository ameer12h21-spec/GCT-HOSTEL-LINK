import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { WifiOff, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignalBarsProps {
  bars: number;
  quality: string;
  compact?: boolean;
}

function SignalBars({ bars, quality, compact = false }: SignalBarsProps) {
  const barHeights = compact
    ? ["h-1.5", "h-2.5", "h-3.5", "h-4.5"]
    : ["h-2", "h-3", "h-4", "h-5"];

  const activeColor =
    bars === 0 ? ""
    : bars === 1 ? "bg-red-500"
    : bars === 2 ? "bg-orange-500"
    : bars === 3 ? "bg-yellow-500"
    : "bg-green-500";

  const inactiveColor = "bg-white/20";

  return (
    <div className={cn("flex items-end gap-0.5", compact ? "gap-px" : "gap-0.5")}>
      {barHeights.map((h, i) => (
        <div
          key={i}
          className={cn(
            "rounded-sm transition-colors duration-500",
            compact ? "w-1" : "w-1.5",
            h,
            i < bars ? activeColor : inactiveColor
          )}
        />
      ))}
    </div>
  );
}

// Compact version for sidebar
export function SidebarNetworkIndicator() {
  const net = useNetworkStatus();

  const textColor =
    net.quality === "offline" || net.quality === "very-low" ? "text-red-400"
    : net.quality === "low" ? "text-orange-400"
    : net.quality === "medium" ? "text-yellow-400"
    : "text-green-400";

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors",
      (net.quality === "offline" || net.quality === "very-low")
        ? "bg-red-500/15 border border-red-500/30"
        : net.quality === "low"
        ? "bg-orange-500/10 border border-orange-500/20"
        : "bg-white/5"
    )}>
      {net.quality === "offline" ? (
        <WifiOff className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
      ) : (
        <SignalBars bars={net.bars} quality={net.quality} compact />
      )}
      <span className={cn("font-medium truncate", textColor)}>
        {net.quality === "offline" ? "No Internet"
          : net.quality === "very-high" ? "Excellent"
          : net.label}
        {net.latencyMs !== null && net.quality !== "offline" && (
          <span className="text-white/30 ml-1">({net.latencyMs}ms)</span>
        )}
      </span>
    </div>
  );
}

// Warning banner for payment/attendance pages
export function NetworkWarningBanner() {
  const net = useNetworkStatus();
  if (!net.warning) return null;

  const isOffline = net.quality === "offline";

  return (
    <div className={cn(
      "flex items-start gap-3 rounded-xl p-3 mb-4 text-sm border animate-pulse-once",
      isOffline
        ? "bg-red-500/15 border-red-500/40 text-red-600"
        : "bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-400"
    )}>
      {isOffline
        ? <WifiOff className="w-5 h-5 flex-shrink-0 mt-0.5" />
        : <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
      <div>
        <p className="font-semibold">{isOffline ? "No Internet Connection" : "Weak Network Signal"}</p>
        <p className="text-xs mt-0.5 opacity-80">{net.warning}</p>
      </div>
    </div>
  );
}

// Full inline indicator for page headers
export function NetworkStatusBadge() {
  const net = useNetworkStatus();

  if (net.quality === "offline") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-red-500 bg-red-500/10 border border-red-500/30 rounded-full px-2.5 py-1">
        <WifiOff className="w-3 h-3" />
        <span>Offline</span>
      </div>
    );
  }

  const textColor =
    net.quality === "very-low" ? "text-red-500"
    : net.quality === "low" ? "text-orange-500"
    : net.quality === "medium" ? "text-yellow-600 dark:text-yellow-400"
    : "text-green-500";

  const bgColor =
    net.quality === "very-low" ? "bg-red-500/10 border-red-500/30"
    : net.quality === "low" ? "bg-orange-500/10 border-orange-500/30"
    : net.quality === "medium" ? "bg-yellow-500/10 border-yellow-500/30"
    : "bg-green-500/10 border-green-500/30";

  return (
    <div className={cn("flex items-center gap-1.5 text-xs rounded-full px-2.5 py-1 border", bgColor, textColor)}>
      <SignalBars bars={net.bars} quality={net.quality} compact />
      <span>{net.label}</span>
    </div>
  );
}
