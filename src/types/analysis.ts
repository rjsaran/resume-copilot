export type RecommendationStatus =
  | "Strong Match"
  | "Good Match"
  | "Tailor Required"
  | "Weak Match"
  | "Not Recommended";

export type GapCategory = "technology" | "domain";
export type GapSeverity = "high" | "medium" | "low";
export type CoverageStatus = "covered" | "partial" | "missing";
export type QuickWinImpact = "High" | "Medium" | "Low";
export type ApplicationDecision = "Apply" | "Apply After Tailoring" | "Consider Applying" | "Probably Skip";
export type CompetitionRiskLevel = "Low" | "Medium" | "High";
export type FitLevel = "Excellent" | "Good" | "Fair" | "Poor";
export type OverallFitLevel = "Excellent Fit" | "Good Fit" | "Fair Fit" | "Poor Fit";

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

export interface QuickWin {
  title: string;
  impact: QuickWinImpact;
  /** Rough time estimate, e.g. "5 min". */
  effort: string;
}

/**
 * The plain-English "what should I do" call — derived only from how well the
 * resume fits the job, never from a prediction of interview/hiring odds.
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
  summary: string;
  strengths: Strength[];
  gaps: Gap[];
  hardBlockers: string[];
  coverage: CoverageItem[];
  quickWins: QuickWin[];
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
        '1-3 concrete facts from the career history that support this strength — name the company, technology, scale, or metric involved (e.g. "Led the payments migration serving 2M users at Acme Corp"). Never a vague or generic restatement of the title (e.g. "has strong backend experience").',
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
      description: 'The missing or weak technology or domain-knowledge item, name only (e.g. "Kubernetes").',
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
        'Why this gap was identified, grounded in the career history — cite what is present or absent (e.g. "Career history shows production Python but no production Go experience.").',
    },
    aiCanFix: {
      type: "boolean",
      description:
        'Whether resume wording/reframing can meaningfully address this. Default to false for missing production experience in a primary/required technology — wording cannot create experience that was never demonstrated, even when transferable experience exists elsewhere (see the Python -> Go example in the instructions).',
    },
    aiFixNote: {
      type: "string",
      maxLength: 140,
      description:
        "One sentence explaining the aiCanFix judgment — how tailoring would help (e.g. surfacing transferable experience more prominently), or why it can't (a real experience gap, not a wording problem).",
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

const FIT_LEVEL_ENUM = ["Excellent", "Good", "Fair", "Poor"] as const;

const FIT_SUMMARY_SCHEMA = {
  type: "object",
  properties: {
    domain: { type: "string", enum: FIT_LEVEL_ENUM },
    responsibilities: { type: "string", enum: FIT_LEVEL_ENUM },
    seniority: { type: "string", enum: FIT_LEVEL_ENUM },
    technology: { type: "string", enum: FIT_LEVEL_ENUM },
    leadership: { type: "string", enum: FIT_LEVEL_ENUM },
    culture: { type: "string", enum: FIT_LEVEL_ENUM },
    overall: { type: "string", enum: ["Excellent Fit", "Good Fit", "Fair Fit", "Poor Fit"] },
  },
  required: ["domain", "responsibilities", "seniority", "technology", "leadership", "culture", "overall"],
  additionalProperties: false,
  description:
    "A qualitative label for each scoreBreakdown dimension (and an overall label) so it's obvious at a glance why the candidate scored well or poorly — must agree with the numeric scoreBreakdown values.",
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

const APPLICATION_RECOMMENDATION_SCHEMA = {
  type: "object",
  properties: {
    decision: {
      type: "string",
      enum: ["Apply", "Apply After Tailoring", "Consider Applying", "Probably Skip"],
    },
    reason: {
      type: "string",
      maxLength: 240,
      description:
        "1-2 sentences justifying the decision, grounded only in how well the resume/career history fits the job description — never an estimate of interview or hiring likelihood.",
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
    fitSummary: FIT_SUMMARY_SCHEMA,
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
    summary: {
      type: "string",
      maxLength: 400,
      description:
        "2-4 plain-language sentences: whether the resume fits this role and why, the biggest strength, the biggest real gap, and whether tailoring is worth it. Describe fit, not hiring odds. Natural language, not generic filler.",
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
        "Missing or weak technologies/domain knowledge, each with severity, evidence-grounded reason, and whether tailoring can help. Merge overlapping or near-duplicate gaps into a single entry (e.g. don't list \"Kubernetes\" and \"container orchestration\" separately if they refer to the same missing skill) — each entry must be a genuinely distinct issue. At most 6, sorted by severity (high first).",
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
      maxItems: 15,
      description:
        "Every distinct requirement identified in the job description (technology, domain, responsibility, or qualification), each marked covered/partial/missing against the career history. Merge requirements that overlap or restate each other (e.g. don't list \"AWS\" and \"cloud experience\" as two entries when the JD is asking about one thing) into a single entry. A technology appearing only in a skills list, with no demonstrated production use, is at most partial — never covered on keyword presence alone. At most 15, typically 6-12.",
    },
    quickWins: {
      type: "array",
      items: QUICK_WIN_SCHEMA,
      maxItems: 5,
      description:
        "The highest-ROI resume wording/structure edits for this job, ranked by impact. Each must be traceable to a specific fact already present in the Candidate Career History — never generic resume advice (e.g. \"add more metrics\", \"use stronger verbs\") that isn't tied to something concrete this candidate actually has. At most 5.",
    },
    recruiterFirstImpression: {
      type: "string",
      maxLength: 800,
      description:
        "A natural first-person paragraph (~120 words) written as a recruiter's 30-second read of the resume against this job — what stands out immediately and any concerns. Ground it in interest, not certainty (e.g. \"I'd be interested in learning more\" rather than \"I would definitely interview\"). Conversational, not a restatement of summary.",
    },
  },
  required: [
    "company",
    "jobTitle",
    "matchScore",
    "scoreBreakdown",
    "fitSummary",
    "recommendationStatus",
    "applicationRecommendation",
    "competitionRisk",
    "summary",
    "strengths",
    "gaps",
    "hardBlockers",
    "coverage",
    "quickWins",
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

function isQuickWin(value: unknown): value is QuickWin {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.title === "string" &&
    (v.impact === "High" || v.impact === "Medium" || v.impact === "Low") &&
    typeof v.effort === "string"
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

export function isJobAnalysis(value: unknown): value is JobAnalysis {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.company === "string" &&
    typeof v.jobTitle === "string" &&
    typeof v.matchScore === "number" &&
    isScoreBreakdown(v.scoreBreakdown) &&
    isFitSummary(v.fitSummary) &&
    typeof v.recommendationStatus === "string" &&
    isRecommendationStatus(v.recommendationStatus) &&
    isApplicationRecommendation(v.applicationRecommendation) &&
    (v.competitionRisk === "Low" || v.competitionRisk === "Medium" || v.competitionRisk === "High") &&
    typeof v.summary === "string" &&
    Array.isArray(v.strengths) &&
    v.strengths.every(isStrength) &&
    Array.isArray(v.gaps) &&
    v.gaps.every(isGap) &&
    isStringArray(v.hardBlockers) &&
    Array.isArray(v.coverage) &&
    v.coverage.every(isCoverageItem) &&
    Array.isArray(v.quickWins) &&
    v.quickWins.every(isQuickWin) &&
    typeof v.recruiterFirstImpression === "string"
  );
}
