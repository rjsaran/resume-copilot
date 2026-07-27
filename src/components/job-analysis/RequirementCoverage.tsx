import { CheckCircle2, CircleDot, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CoverageItem, CoverageStatus } from "@/types/analysis";

const COVERAGE_ORDER: Record<CoverageStatus, number> = { missing: 0, partial: 1, covered: 2 };

const COVERAGE_META: Record<
  CoverageStatus,
  { icon: typeof CheckCircle2; className: string }
> = {
  covered: {
    icon: CheckCircle2,
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  partial: {
    icon: CircleDot,
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  missing: {
    icon: XCircle,
    className: "bg-red-500/10 text-red-600 dark:text-red-500",
  },
};

/**
 * Requirement-by-requirement breakdown of the job description — a finer
 * grain than the top-line strengths/gaps summary, for checking a specific
 * requirement rather than reading the whole analysis. Missing/partial items
 * sort first since they're the ones worth a second look.
 */
export function RequirementCoverage({ coverage }: { coverage: CoverageItem[] }) {
  if (coverage.length === 0) return null;

  const sorted = [...coverage].sort(
    (a, b) => COVERAGE_ORDER[a.status] - COVERAGE_ORDER[b.status]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Requirement Coverage</CardTitle>
        <CardDescription>
          Every requirement from the job description, checked against your career history.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {sorted.map((item, i) => {
            const meta = COVERAGE_META[item.status];
            const Icon = meta.icon;
            return (
              <span
                key={i}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                  meta.className
                )}
              >
                <Icon className="size-3.5 shrink-0" />
                {item.requirement}
              </span>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
