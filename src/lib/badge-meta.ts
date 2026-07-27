import { CheckCircle2, PencilLine, XCircle } from "lucide-react";
import type { ApplicationStatus } from "@/generated/prisma/client";
import type { Decision } from "@/types/analysis";

export const DECISION_META: Record<
  Decision,
  {
    icon: typeof CheckCircle2;
    badgeClassName: string;
    iconWrapClassName: string;
    iconClassName: string;
    cardClassName: string;
  }
> = {
  Apply: {
    icon: CheckCircle2,
    badgeClassName:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    iconWrapClassName: "bg-emerald-500/10",
    iconClassName: "text-emerald-600 dark:text-emerald-400",
    cardClassName: "border-emerald-500/30",
  },
  Tailor: {
    icon: PencilLine,
    badgeClassName: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    iconWrapClassName: "bg-amber-500/10",
    iconClassName: "text-amber-600 dark:text-amber-400",
    cardClassName: "border-amber-500/30",
  },
  Skip: {
    icon: XCircle,
    badgeClassName: "bg-red-500/10 text-red-600 dark:text-red-500",
    iconWrapClassName: "bg-red-500/10",
    iconClassName: "text-red-600 dark:text-red-500",
    cardClassName: "border-red-500/30",
  },
};

export function isDecision(value: string): value is Decision {
  return value === "Apply" || value === "Tailor" || value === "Skip";
}

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  ANALYZED: "Analyzed",
  APPLIED: "Applied",
  RECRUITER_CALL: "Recruiter Call",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

export const STATUS_BADGE_CLASSNAME: Record<ApplicationStatus, string> = {
  ANALYZED: "bg-secondary text-secondary-foreground",
  APPLIED: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  RECRUITER_CALL: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  INTERVIEW: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  OFFER: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  REJECTED: "bg-red-500/10 text-red-600 dark:text-red-500",
  WITHDRAWN: "bg-muted text-muted-foreground",
};

export const ALL_APPLICATION_STATUSES: ApplicationStatus[] = [
  "ANALYZED",
  "APPLIED",
  "RECRUITER_CALL",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "WITHDRAWN",
];
