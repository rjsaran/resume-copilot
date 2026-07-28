import type { GapSeverity } from "@/types/analysis";

export const SEVERITY_META: Record<GapSeverity, { label: string; badgeClassName: string }> = {
  high: { label: "High", badgeClassName: "bg-red-500/10 text-red-600 dark:text-red-500" },
  medium: { label: "Medium", badgeClassName: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  low: { label: "Low", badgeClassName: "bg-muted text-muted-foreground" },
};
