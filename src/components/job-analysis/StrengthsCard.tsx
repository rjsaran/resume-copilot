import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Strength } from "@/types/analysis";

/**
 * Quick, scannable list of what makes this candidate a fit, evidence shown
 * inline. Risks used to live here too as a second column, but they were a
 * pure duplicate of Requirement Coverage's missing/partial entries and Gap
 * details' full reasoning - removed rather than shown a third time.
 */
export function StrengthsCard({ strengths }: { strengths: Strength[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-muted-foreground" />
          <CardTitle>Your Strengths</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {strengths.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No standout strengths identified.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {strengths.map((strength, i) => (
              <div key={i} className="flex flex-col gap-1">
                <Badge className="w-fit bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                  {strength.title}
                </Badge>
                {strength.evidence.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {strength.evidence.join(" · ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
