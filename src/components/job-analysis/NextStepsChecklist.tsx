import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ApplicationStatus } from "@/lib/db/schema";

interface NextStepsChecklistProps {
  tailoredResumeHref: string;
  hasTailoredVersion: boolean;
  applicationStatus: ApplicationStatus;
}

interface StepProps {
  label: string;
  done: boolean;
  href?: string;
}

function Step({ label, done, href }: StepProps) {
  const content = (
    <div className="flex items-center gap-2.5 text-sm">
      {done ? (
        <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
      ) : (
        <Circle className="size-4 shrink-0 text-muted-foreground" />
      )}
      <span className={cn(done && "text-muted-foreground line-through")}>
        {label}
      </span>
    </div>
  );

  if (href && !done) {
    return (
      <Link href={href} className="hover:underline">
        {content}
      </Link>
    );
  }
  return content;
}

/**
 * Only shows steps derived from real, verifiable state (a tailored resume
 * version exists, the application status has moved past "Analyzed") -
 * deliberately not fabricating progress tracking for things the app has no
 * way to actually know (e.g. whether a PDF was reviewed).
 */
export function NextStepsChecklist({
  tailoredResumeHref,
  hasTailoredVersion,
  applicationStatus,
}: NextStepsChecklistProps) {
  const applied = applicationStatus !== "ANALYZED";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recommended Next Steps</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Step
          label="Generate a tailored resume"
          done={hasTailoredVersion}
          href={tailoredResumeHref}
        />
        <Step
          label="Export as PDF"
          done={false}
          href={hasTailoredVersion ? tailoredResumeHref : undefined}
        />
        <Step label="Mark as applied" done={applied} />
      </CardContent>
    </Card>
  );
}
