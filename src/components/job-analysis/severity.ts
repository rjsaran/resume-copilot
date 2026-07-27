import type { GapSeverity } from "@/types/analysis";

const SEVERITY_ORDER: Record<GapSeverity, number> = { high: 0, medium: 1, low: 2 };

export function sortBySeverity<T extends { severity: GapSeverity }>(items: T[]): T[] {
  return [...items].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

export const SEVERITY_META: Record<GapSeverity, { label: string; badgeClassName: string }> = {
  high: { label: "High", badgeClassName: "bg-red-500/10 text-red-600 dark:text-red-500" },
  medium: { label: "Medium", badgeClassName: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  low: { label: "Low", badgeClassName: "bg-muted text-muted-foreground" },
};
