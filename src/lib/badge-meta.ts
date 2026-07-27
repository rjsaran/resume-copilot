import { CheckCircle2, ThumbsUp, PencilLine, AlertTriangle, XCircle } from "lucide-react";
import type { ApplicationStatus } from "@/lib/db/schema";
import { isRecommendationStatus, type RecommendationStatus } from "@/types/analysis";

export const RECOMMENDATION_META: Record<
  RecommendationStatus,
  {
    icon: typeof CheckCircle2;
    badgeClassName: string;
    iconWrapClassName: string;
    iconClassName: string;
    cardClassName: string;
  }
> = {
  "Strong Match": {
    icon: CheckCircle2,
    badgeClassName: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    iconWrapClassName: "bg-emerald-500/10",
    iconClassName: "text-emerald-600 dark:text-emerald-400",
    cardClassName: "border-emerald-500/30",
  },
  "Good Match": {
    icon: ThumbsUp,
    badgeClassName: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
    iconWrapClassName: "bg-teal-500/10",
    iconClassName: "text-teal-600 dark:text-teal-400",
    cardClassName: "border-teal-500/30",
  },
  "Tailor Required": {
    icon: PencilLine,
    badgeClassName: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    iconWrapClassName: "bg-amber-500/10",
    iconClassName: "text-amber-600 dark:text-amber-400",
    cardClassName: "border-amber-500/30",
  },
  "Weak Match": {
    icon: AlertTriangle,
    badgeClassName: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    iconWrapClassName: "bg-orange-500/10",
    iconClassName: "text-orange-600 dark:text-orange-400",
    cardClassName: "border-orange-500/30",
  },
  "Not Recommended": {
    icon: XCircle,
    badgeClassName: "bg-red-500/10 text-red-600 dark:text-red-500",
    iconWrapClassName: "bg-red-500/10",
    iconClassName: "text-red-600 dark:text-red-500",
    cardClassName: "border-red-500/30",
  },
};

export { isRecommendationStatus };

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
