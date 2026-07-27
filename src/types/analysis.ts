export type RecommendationStatus =
  | "Strong Match"
  | "Good Match"
  | "Tailor Required"
  | "Weak Match"
  | "Not Recommended";

export type ConfidenceLevel = "High" | "Medium" | "Low";

export type GapCategory = "technology" | "domain";
export type GapSeverity = "high" | "medium" | "low";
export type CoverageStatus = "covered" | "partial" | "missing";
export type QuickWinImpact = "High" | "Medium" | "Low";

export interface Strength {
  title: string;
  /** Specific facts from the career history that back this strength up — not a generic restatement of the title. */
  evidence: string[];
}

export interface Gap {
  title: string;
  category: GapCategory;
  severity: GapSeverity;
  whyItMatters: string;
  /** Why this gap was identified, grounded in the career history (what's present or absent). */
  reason: string;
  aiCanFix: boolean;
  aiFixNote: string;
}

export interface CoverageItem {
  requirement: string;
  status: CoverageStatus;
}

/**
 * The dimensions matchScore is derived from. Kept as named, independently
 * scored axes rather than a single number so both the model's own reasoning
 * and the UI can show *why* the score is what it is.
 */
export interface ScoreBreakdown {
  domain: number;
  responsibilities: number;
  seniority: number;
  technology: number;
  leadership: number;
  culture: number;
}

export interface QuickWin {
  title: string;
  impact: QuickWinImpact;
  /** Rough time estimate, e.g. "5 min". */
  effort: string;
}

export interface JobAnalysis {
  company: string;
  jobTitle: string;
  matchScore: number;
  atsScore: number;
  scoreBreakdown: ScoreBreakdown;
  recommendationStatus: RecommendationStatus;
  summary: string;
  interviewConfidence: ConfidenceLevel;
  strengths: Strength[];
  gaps: Gap[];
  hardBlockers: string[];
  coverage: CoverageItem[];
  quickWins: QuickWin[];
  resumeWordingImprovements: string[];
  resumeSectionsToRewrite: string[];
  recruiterFirstImpression: string;
}

const STRENGTH_SCHEMA = {
  type: "object",
  properties: {
    title: {
      type: "string",
      maxLength: 40,
      description: 'Short positive tag (e.g. "Payments domain", "Distributed systems").',
    },
    evidence: {
      type: "array",
      items: { type: "string", maxLength: 100 },
      maxItems: 3,
      description:
        "1-3 specific facts from the career history that support this strength — company/role/achievement, not a generic restatement of the title.",
    },
  },
  required: ["title", "evidence"],
  additionalProperties: false,
} as const;

const GAP_SCHEMA = {
  type: "object",
  properties: {
    title: {
      type: "string",
      maxLength: 40,
      description: 'The missing technology or domain-knowledge item, name only (e.g. "Kubernetes").',
    },
    category: { type: "string", enum: ["technology", "domain"] },
    severity: { type: "string", enum: ["high", "medium", "low"] },
    whyItMatters: {
      type: "string",
      maxLength: 100,
      description: "One short sentence on why the job posting cares about this.",
    },
    reason: {
      type: "string",
      maxLength: 140,
      description:
        'Why this gap was identified, grounded in the career history — cite what is present or absent (e.g. "Career history shows Node.js and Python but no mention of Go in any role or project.").',
    },
    aiCanFix: {
      type: "boolean",
      description:
        "Whether resume tailoring/wording can meaningfully address this, as opposed to requiring real-world experience the candidate doesn't have.",
    },
    aiFixNote: {
      type: "string",
      maxLength: 140,
      description: "One sentence explaining the aiCanFix judgment — how tailoring would help, or why it can't.",
    },
  },
  required: ["title", "category", "severity", "whyItMatters", "reason", "aiCanFix", "aiFixNote"],
  additionalProperties: false,
} as const;

const COVERAGE_ITEM_SCHEMA = {
  type: "object",
  properties: {
    requirement: {
      type: "string",
      maxLength: 40,
      description: 'A single requirement pulled from the job description, name only (e.g. "Kafka", "PCI DSS").',
    },
    status: { type: "string", enum: ["covered", "partial", "missing"] },
  },
  required: ["requirement", "status"],
  additionalProperties: false,
} as const;

const SCORE_BREAKDOWN_SCHEMA = {
  type: "object",
  properties: {
    domain: {
      type: "integer",
      description: "0-100: how closely the candidate's industry/problem domain matches this role.",
    },
    responsibilities: {
      type: "integer",
      description: "0-100: how closely day-to-day responsibilities overlap with what this role actually does.",
    },
    seniority: {
      type: "integer",
      description: "0-100: whether the candidate's level (years, scope, ownership) matches what this role expects.",
    },
    technology: {
      type: "integer",
      description:
        "0-100: required/transferable technology coverage — weighted toward required technologies, per the evaluation priority order.",
    },
    leadership: {
      type: "integer",
      description:
        "0-100: demonstrated leadership/mentorship/ownership relative to what this role expects, 100 if not applicable to the role.",
    },
    culture: {
      type: "integer",
      description:
        "0-100: general working-style/culture fit signal evidenced by the career history (e.g. startup vs. enterprise pace), 100 if the JD gives no signal either way.",
    },
  },
  required: ["domain", "responsibilities", "seniority", "technology", "leadership", "culture"],
  additionalProperties: false,
} as const;

const QUICK_WIN_SCHEMA = {
  type: "object",
  properties: {
    title: {
      type: "string",
      maxLength: 60,
      description: 'A single, concrete resume edit (e.g. "Move AI tooling experience into Summary").',
    },
    impact: { type: "string", enum: ["High", "Medium", "Low"] },
    effort: {
      type: "string",
      maxLength: 20,
      description: 'Rough time estimate, e.g. "5 min".',
    },
  },
  required: ["title", "impact", "effort"],
  additionalProperties: false,
} as const;

export const JOB_ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    company: {
      type: "string",
      description: "The hiring company's name, extracted from the job description.",
    },
    jobTitle: {
      type: "string",
      description: "The job title, extracted from the job description.",
    },
    matchScore: {
      type: "integer",
      description:
        "Overall match score from 0 to 100, internally derived from scoreBreakdown (not scored independently of it).",
    },
    atsScore: {
      type: "integer",
      description: "Estimated ATS (applicant tracking system) keyword-match score from 0 to 100.",
    },
    scoreBreakdown: {
      ...SCORE_BREAKDOWN_SCHEMA,
      description:
        "The dimensions matchScore is derived from — domain, responsibilities, seniority, technology, leadership, culture, each 0-100.",
    },
    recommendationStatus: {
      type: "string",
      enum: ["Strong Match", "Good Match", "Tailor Required", "Weak Match", "Not Recommended"],
      description:
        "Overall recommendation, considering hard blockers, gap severity, and scoreBreakdown together — not a pure function of matchScore alone.",
    },
    summary: {
      type: "string",
      maxLength: 400,
      description:
        "2-4 plain-language sentences: whether the candidate is a fit and why, the biggest strength, the biggest risk, whether to apply, and whether tailoring is worth it. Natural language, not generic filler.",
    },
    interviewConfidence: {
      type: "string",
      enum: ["High", "Medium", "Low"],
      description:
        "Qualitative estimate of actual interview probability — weighing hard blockers, required-skill coverage, domain fit, and seniority together, not derived from matchScore alone. Never express this as a percentage.",
    },
    strengths: {
      type: "array",
      items: STRENGTH_SCHEMA,
      maxItems: 6,
      description:
        "The candidate's strongest, most relevant selling points for this specific role, each backed by evidence from the career history. At most 6.",
    },
    gaps: {
      type: "array",
      items: GAP_SCHEMA,
      maxItems: 6,
      description:
        "Missing technologies or domain knowledge, each with severity, evidence-grounded reason, and whether tailoring can help. At most 6, sorted by severity (high first).",
    },
    hardBlockers: {
      type: "array",
      items: { type: "string", maxLength: 100 },
      maxItems: 3,
      description:
        "Only requirements that would realistically prevent an interview outright (e.g. required clearance/certification/work authorization, a required years-of-experience floor far above the candidate's, or a fundamentally different role). Missing individual tools, one cloud provider, or a comparable technology substitute is NEVER a hard blocker. At most 3.",
    },
    coverage: {
      type: "array",
      items: COVERAGE_ITEM_SCHEMA,
      maxItems: 20,
      description:
        "Every distinct requirement identified in the job description (technology, domain, responsibility, or qualification), each marked covered/partial/missing against the career history. Typically 6-15 items.",
    },
    quickWins: {
      type: "array",
      items: QUICK_WIN_SCHEMA,
      maxItems: 5,
      description: "The highest-ROI resume wording/structure edits for this job, ranked by impact. At most 5.",
    },
    resumeWordingImprovements: {
      type: "array",
      items: { type: "string", maxLength: 120 },
      maxItems: 4,
      description:
        "Specific wording/phrasing edits to strengthen the resume for this job. At most 4, one short sentence each.",
    },
    resumeSectionsToRewrite: {
      type: "array",
      items: { type: "string", maxLength: 40 },
      maxItems: 3,
      description: "Resume sections that need a rewrite to better match this job. At most 3, section names only.",
    },
    recruiterFirstImpression: {
      type: "string",
      maxLength: 800,
      description:
        "A natural first-person paragraph (~120 words) written as a recruiter's 30-second read of the resume against this job — what stands out immediately, concerns, and whether they'd interview. Conversational, not a restatement of summary.",
    },
  },
  required: [
    "company",
    "jobTitle",
    "matchScore",
    "atsScore",
    "scoreBreakdown",
    "recommendationStatus",
    "summary",
    "interviewConfidence",
    "strengths",
    "gaps",
    "hardBlockers",
    "coverage",
    "quickWins",
    "resumeWordingImprovements",
    "resumeSectionsToRewrite",
    "recruiterFirstImpression",
  ],
  additionalProperties: false,
} as const;

function isStringArray(x: unknown): x is string[] {
  return Array.isArray(x) && x.every((item) => typeof item === "string");
}

function isStrength(value: unknown): value is Strength {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.title === "string" && isStringArray(v.evidence);
}

function isGap(value: unknown): value is Gap {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.title === "string" &&
    (v.category === "technology" || v.category === "domain") &&
    (v.severity === "high" || v.severity === "medium" || v.severity === "low") &&
    typeof v.whyItMatters === "string" &&
    typeof v.reason === "string" &&
    typeof v.aiCanFix === "boolean" &&
    typeof v.aiFixNote === "string"
  );
}

function isCoverageItem(value: unknown): value is CoverageItem {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.requirement === "string" &&
    (v.status === "covered" || v.status === "partial" || v.status === "missing")
  );
}

function isScoreBreakdown(value: unknown): value is ScoreBreakdown {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.domain === "number" &&
    typeof v.responsibilities === "number" &&
    typeof v.seniority === "number" &&
    typeof v.technology === "number" &&
    typeof v.leadership === "number" &&
    typeof v.culture === "number"
  );
}

function isQuickWin(value: unknown): value is QuickWin {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.title === "string" &&
    (v.impact === "High" || v.impact === "Medium" || v.impact === "Low") &&
    typeof v.effort === "string"
  );
}

const RECOMMENDATION_STATUSES: RecommendationStatus[] = [
  "Strong Match",
  "Good Match",
  "Tailor Required",
  "Weak Match",
  "Not Recommended",
];

export function isRecommendationStatus(value: string): value is RecommendationStatus {
  return (RECOMMENDATION_STATUSES as string[]).includes(value);
}

export function isJobAnalysis(value: unknown): value is JobAnalysis {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.company === "string" &&
    typeof v.jobTitle === "string" &&
    typeof v.matchScore === "number" &&
    typeof v.atsScore === "number" &&
    isScoreBreakdown(v.scoreBreakdown) &&
    typeof v.recommendationStatus === "string" &&
    isRecommendationStatus(v.recommendationStatus) &&
    typeof v.summary === "string" &&
    (v.interviewConfidence === "High" || v.interviewConfidence === "Medium" || v.interviewConfidence === "Low") &&
    Array.isArray(v.strengths) &&
    v.strengths.every(isStrength) &&
    Array.isArray(v.gaps) &&
    v.gaps.every(isGap) &&
    isStringArray(v.hardBlockers) &&
    Array.isArray(v.coverage) &&
    v.coverage.every(isCoverageItem) &&
    Array.isArray(v.quickWins) &&
    v.quickWins.every(isQuickWin) &&
    isStringArray(v.resumeWordingImprovements) &&
    isStringArray(v.resumeSectionsToRewrite) &&
    typeof v.recruiterFirstImpression === "string"
  );
}
