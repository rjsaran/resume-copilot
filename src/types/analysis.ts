export type RecommendationStatus =
  | "Strong Match"
  | "Good Match"
  | "Tailor Required"
  | "Weak Match"
  | "Not Recommended";

export type GapCategory = "technology" | "domain";
export type GapSeverity = "high" | "medium" | "low";
export type CoverageStatus = "covered" | "partial" | "missing";
export type ApplicationDecision = "Apply" | "Apply After Tailoring" | "Consider Applying" | "Probably Skip";
export type CompetitionRiskLevel = "Low" | "Medium" | "High";
export type FitLevel = "Excellent" | "Good" | "Fair" | "Poor";
export type OverallFitLevel = "Excellent Fit" | "Good Fit" | "Fair Fit" | "Poor Fit";

export interface Strength {
  title: string;
  /** Specific facts from the career history that back this strength up — not a generic restatement of the title. */
  evidence: string[];
}

/**
 * One row per requirement in the job description. "covered" entries only
 * need requirement+status; the rest of the fields carry the "why" and are
 * only meaningful (and only ever populated) for "partial"/"missing" — this
 * is deliberately the single source of truth for a requirement's status AND
 * its reasoning, replacing what used to be two separately-generated arrays
 * (coverage + gaps) that inevitably drifted apart in naming and content.
 */
export interface CoverageItem {
  requirement: string;
  status: CoverageStatus;
  category?: GapCategory;
  severity?: GapSeverity;
  whyItMatters?: string;
  /** Why this status was assigned, grounded in the career history (what's present or absent). */
  reason?: string;
  aiCanFix?: boolean;
  aiFixNote?: string;
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

/** A qualitative gloss on scoreBreakdown — makes the numeric score legible at a glance. */
export interface FitSummary {
  domain: FitLevel;
  responsibilities: FitLevel;
  seniority: FitLevel;
  technology: FitLevel;
  leadership: FitLevel;
  culture: FitLevel;
  overall: OverallFitLevel;
}

/**
 * The plain-English "what should I do" call — derived only from how well the
 * resume fits the job, never from a prediction of interview/hiring odds.
 * `reason` is the analysis's one and only "why" paragraph (fit judgment,
 * biggest strength, biggest real risk, whether tailoring helps) - there used
 * to be a separate top-level `summary` field saying nearly the same thing in
 * different words, plus recruiterFirstImpression converging on the same
 * points a third time. Removed rather than kept "distinct in theory."
 */
export interface ApplicationRecommendation {
  decision: ApplicationDecision;
  reason: string;
}

export interface JobAnalysis {
  company: string;
  jobTitle: string;
  matchScore: number;
  scoreBreakdown: ScoreBreakdown;
  fitSummary: FitSummary;
  recommendationStatus: RecommendationStatus;
  applicationRecommendation: ApplicationRecommendation;
  competitionRisk: CompetitionRiskLevel;
  strengths: Strength[];
  hardBlockers: string[];
  coverage: CoverageItem[];
  recruiterFirstImpression: string;
}

/**
 * What the LLM actually returns — everything in JobAnalysis except
 * fitSummary, which is derived deterministically from scoreBreakdown/
 * matchScore in code (see deriveFitSummary) rather than asked of the model.
 * Two independently-generated fields (a numeric score and a qualitative
 * label meant to describe it) can disagree — e.g. matchScore: 0 with
 * fitSummary.overall: "Excellent Fit" — so only one is a source of truth.
 */
export type ModelJobAnalysis = Omit<JobAnalysis, "fitSummary">;

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
        '1-3 concrete facts from the career history that support this strength — name the company, technology, scale, or metric involved (e.g. "Led the payments migration serving 2M users at Acme Corp"). Never a vague or generic restatement of the title (e.g. "has strong backend experience").',
    },
  },
  required: ["title", "evidence"],
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
    category: {
      type: "string",
      enum: ["technology", "domain"],
      description: 'Only set for status "partial" or "missing" — omit entirely for "covered".',
    },
    severity: {
      type: "string",
      enum: ["high", "medium", "low"],
      description: 'Only set for status "partial" or "missing" — omit entirely for "covered".',
    },
    whyItMatters: {
      type: "string",
      maxLength: 100,
      description:
        'Only set for status "partial" or "missing": one short sentence on why the job posting cares about this requirement. Omit entirely for "covered".',
    },
    reason: {
      type: "string",
      maxLength: 140,
      description:
        'Only set for status "partial" or "missing": why this status was assigned, grounded in the career history — cite what is present or absent (e.g. "Career history shows production Python but no production Go experience."). Omit entirely for "covered".',
    },
    aiCanFix: {
      type: "boolean",
      description:
        'Only set for status "partial" or "missing": whether resume wording/reframing can meaningfully address this. Default to false for missing production experience in a primary/required technology — wording cannot create experience that was never demonstrated, even when transferable experience exists elsewhere (see the Python -> Go example in the instructions). Omit entirely for "covered".',
    },
    aiFixNote: {
      type: "string",
      maxLength: 140,
      description:
        'Only set for status "partial" or "missing": one sentence explaining the aiCanFix judgment — how tailoring would help, or why it can\'t. Omit entirely for "covered".',
    },
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
        "0-100: required/transferable technology coverage — weighted toward required technologies, per the evaluation priority order. Do not inflate this because transferable skills exist; transferable experience partially, not fully, offsets missing production experience in a required technology.",
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

const APPLICATION_RECOMMENDATION_SCHEMA = {
  type: "object",
  properties: {
    decision: {
      type: "string",
      enum: ["Apply", "Apply After Tailoring", "Consider Applying", "Probably Skip"],
    },
    reason: {
      type: "string",
      maxLength: 500,
      description:
        "2-4 sentences justifying the decision: whether the resume fits this role and why, the biggest strength, the biggest real risk, and whether tailoring is worth the effort. The analysis's single \"why\" paragraph — grounded only in how well the resume/career history fits the job description, never an estimate of interview or hiring likelihood.",
    },
  },
  required: ["decision", "reason"],
  additionalProperties: false,
  description:
    'The actionable "should I apply" call, derived only from Resume Fit (career history vs. job description) — never from predicting interview or hiring odds, which depend on information this analysis doesn\'t have (other applicants, recruiter judgment, market conditions).',
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
        "Overall Resume Fit score from 0 to 100, internally derived from scoreBreakdown (not scored independently of it). This measures how well the resume fits the role — never a likelihood of being hired or interviewed.",
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
        "Overall fit tier, considering hard blockers, gap severity, and scoreBreakdown together — not a pure function of matchScore alone.",
    },
    applicationRecommendation: APPLICATION_RECOMMENDATION_SCHEMA,
    competitionRisk: {
      type: "string",
      enum: ["Low", "Medium", "High"],
      description:
        "How likely another, more closely-aligned candidate exists for this role — a market/positioning signal, not a judgment of this candidate. High for niche technology/specialist/uncommon-domain roles; Medium when the fit relies on transferable skills; Low when the candidate already matches nearly everything.",
    },
    strengths: {
      type: "array",
      items: STRENGTH_SCHEMA,
      maxItems: 6,
      description:
        "The candidate's strongest, most relevant selling points for this specific role, each backed by evidence from the career history. At most 6.",
    },
    hardBlockers: {
      type: "array",
      items: { type: "string", maxLength: 100 },
      maxItems: 3,
      description:
        "Only requirements that would realistically rule the candidate out (e.g. required clearance/certification/work authorization, a required years-of-experience floor far above the candidate's, or a fundamentally different role). Missing individual tools, one cloud provider, or a comparable technology substitute is NEVER a hard blocker. At most 3.",
    },
    coverage: {
      type: "array",
      items: COVERAGE_ITEM_SCHEMA,
      description:
        'Every distinct requirement identified in the job description (technology, domain, responsibility, or qualification), each marked covered/partial/missing against the career history. Merge requirements that overlap or restate each other (e.g. don\'t list "AWS" and "cloud experience" as two entries when the JD is asking about one thing) into a single entry. A technology appearing only in a skills list, with no demonstrated production use, is at most partial — never covered on keyword presence alone. List every distinct requirement — do not cap or trim the list. For every entry with status "partial" or "missing", also set category, severity, whyItMatters, reason, aiCanFix, and aiFixNote — "covered" entries need only requirement and status.',
    },
    recruiterFirstImpression: {
      type: "string",
      maxLength: 800,
      description:
        "A natural first-person paragraph (~120 words) capturing the GUT REACTION of a recruiter's 30-second scan — not a second analysis of fit. applicationRecommendation.reason already covers the fit judgment, biggest strength, and biggest risk; do not restate those same facts here in different words. Instead describe things that only exist at the level of a quick skim: what visually/structurally jumps out first, how the resume reads (clear vs. cluttered, well-organized vs. hard to follow), what would make a recruiter want to keep reading or set it aside, and any immediate impression not already covered elsewhere. Ground it in interest, not certainty (e.g. \"I'd be interested in learning more\" rather than \"I would definitely interview\"). Conversational, opinionated, specific to this resume.",
    },
  },
  required: [
    "company",
    "jobTitle",
    "matchScore",
    "scoreBreakdown",
    "recommendationStatus",
    "applicationRecommendation",
    "competitionRisk",
    "strengths",
    "hardBlockers",
    "coverage",
    "recruiterFirstImpression",
  ],
  additionalProperties: false,
} as const;

function isStringArray(x: unknown): x is string[] {
  return Array.isArray(x) && x.every((item) => typeof item === "string");
}

function isFitLevel(value: unknown): value is FitLevel {
  return value === "Excellent" || value === "Good" || value === "Fair" || value === "Poor";
}

function isStrength(value: unknown): value is Strength {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.title === "string" && isStringArray(v.evidence);
}

function isCoverageItem(value: unknown): value is CoverageItem {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.requirement === "string" &&
    (v.status === "covered" || v.status === "partial" || v.status === "missing") &&
    (v.category === undefined || v.category === "technology" || v.category === "domain") &&
    (v.severity === undefined || v.severity === "high" || v.severity === "medium" || v.severity === "low") &&
    (v.whyItMatters === undefined || typeof v.whyItMatters === "string") &&
    (v.reason === undefined || typeof v.reason === "string") &&
    (v.aiCanFix === undefined || typeof v.aiCanFix === "boolean") &&
    (v.aiFixNote === undefined || typeof v.aiFixNote === "string")
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

function isFitSummary(value: unknown): value is FitSummary {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    isFitLevel(v.domain) &&
    isFitLevel(v.responsibilities) &&
    isFitLevel(v.seniority) &&
    isFitLevel(v.technology) &&
    isFitLevel(v.leadership) &&
    isFitLevel(v.culture) &&
    (v.overall === "Excellent Fit" ||
      v.overall === "Good Fit" ||
      v.overall === "Fair Fit" ||
      v.overall === "Poor Fit")
  );
}

function isApplicationRecommendation(value: unknown): value is ApplicationRecommendation {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    (v.decision === "Apply" ||
      v.decision === "Apply After Tailoring" ||
      v.decision === "Consider Applying" ||
      v.decision === "Probably Skip") &&
    typeof v.reason === "string"
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

function isModelJobAnalysisShape(v: Record<string, unknown>): boolean {
  return (
    typeof v.company === "string" &&
    typeof v.jobTitle === "string" &&
    typeof v.matchScore === "number" &&
    isScoreBreakdown(v.scoreBreakdown) &&
    typeof v.recommendationStatus === "string" &&
    isRecommendationStatus(v.recommendationStatus) &&
    isApplicationRecommendation(v.applicationRecommendation) &&
    (v.competitionRisk === "Low" || v.competitionRisk === "Medium" || v.competitionRisk === "High") &&
    Array.isArray(v.strengths) &&
    v.strengths.every(isStrength) &&
    isStringArray(v.hardBlockers) &&
    Array.isArray(v.coverage) &&
    v.coverage.every(isCoverageItem) &&
    typeof v.recruiterFirstImpression === "string"
  );
}

/** Validates the LLM's raw output — before fitSummary has been derived and attached. */
export function isModelJobAnalysis(value: unknown): value is ModelJobAnalysis {
  if (typeof value !== "object" || value === null) return false;
  return isModelJobAnalysisShape(value as Record<string, unknown>);
}

/** Validates a full analysis, including the derived fitSummary — used when reading persisted/cached data back. */
export function isJobAnalysis(value: unknown): value is JobAnalysis {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return isModelJobAnalysisShape(v) && isFitSummary(v.fitSummary);
}
