export type RecommendationStatus =
  | "Strong Match"
  | "Good Match"
  | "Tailor Required"
  | "Weak Match"
  | "Not Recommended";

export type ConfidenceLevel = "High" | "Medium" | "Low";

export type GapCategory = "technology" | "domain";
export type GapSeverity = "high" | "medium" | "low";

export interface Gap {
  title: string;
  category: GapCategory;
  severity: GapSeverity;
  whyItMatters: string;
  aiCanFix: boolean;
  aiFixNote: string;
}

export interface JobAnalysis {
  company: string;
  jobTitle: string;
  matchScore: number;
  atsScore: number;
  recommendationStatus: RecommendationStatus;
  summary: string;
  interviewConfidence: ConfidenceLevel;
  strengths: string[];
  gaps: Gap[];
  hardBlockers: string[];
  resumeWordingImprovements: string[];
  resumeSectionsToRewrite: string[];
  recruiterFirstImpression: string;
}

const GAP_SCHEMA = {
  type: "object",
  properties: {
    title: {
      type: "string",
      maxLength: 40,
      description: "The missing technology or domain-knowledge item, name only (e.g. \"Kubernetes\").",
    },
    category: { type: "string", enum: ["technology", "domain"] },
    severity: { type: "string", enum: ["high", "medium", "low"] },
    whyItMatters: {
      type: "string",
      maxLength: 100,
      description: "One short sentence on why the job posting cares about this.",
    },
    aiCanFix: {
      type: "boolean",
      description: "Whether resume tailoring/wording can meaningfully address this, as opposed to requiring real-world experience the candidate doesn't have.",
    },
    aiFixNote: {
      type: "string",
      maxLength: 140,
      description: "One sentence explaining the aiCanFix judgment — how tailoring would help, or why it can't.",
    },
  },
  required: ["title", "category", "severity", "whyItMatters", "aiCanFix", "aiFixNote"],
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
      description: "Overall match score from 0 to 100.",
    },
    atsScore: {
      type: "integer",
      description: "Estimated ATS (applicant tracking system) keyword-match score from 0 to 100.",
    },
    recommendationStatus: {
      type: "string",
      enum: ["Strong Match", "Good Match", "Tailor Required", "Weak Match", "Not Recommended"],
      description: "Overall recommendation, considering match score, hard blockers, and gaps together — not a pure function of matchScore alone.",
    },
    summary: {
      type: "string",
      maxLength: 400,
      description: "2-4 plain-language sentences explaining the recommendation: what matches well, the single biggest gap, and whether tailoring is worth it.",
    },
    interviewConfidence: {
      type: "string",
      enum: ["High", "Medium", "Low"],
      description: "Qualitative confidence of landing an interview. Never express this as a percentage.",
    },
    strengths: {
      type: "array",
      items: { type: "string", maxLength: 40 },
      maxItems: 6,
      description: "Short positive tags (e.g. \"Payments domain\", \"Distributed systems\") the candidate clearly demonstrates for this role. At most 6.",
    },
    gaps: {
      type: "array",
      items: GAP_SCHEMA,
      maxItems: 6,
      description: "Missing technologies or domain knowledge, each with severity and whether tailoring can help. At most 6, sorted by severity (high first).",
    },
    hardBlockers: {
      type: "array",
      items: { type: "string", maxLength: 100 },
      maxItems: 3,
      description: "Dealbreaker requirements the candidate does not meet. At most 3, one short sentence each.",
    },
    resumeWordingImprovements: {
      type: "array",
      items: { type: "string", maxLength: 120 },
      maxItems: 4,
      description: "Specific wording/phrasing edits to strengthen the resume for this job. At most 4, one short sentence each.",
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
      description: "A natural first-person paragraph (~120 words) written as a recruiter's 30-second read of the resume against this job — what stands out immediately, what's missing, and whether they'd shortlist after tailoring.",
    },
  },
  required: [
    "company",
    "jobTitle",
    "matchScore",
    "atsScore",
    "recommendationStatus",
    "summary",
    "interviewConfidence",
    "strengths",
    "gaps",
    "hardBlockers",
    "resumeWordingImprovements",
    "resumeSectionsToRewrite",
    "recruiterFirstImpression",
  ],
  additionalProperties: false,
} as const;

function isStringArray(x: unknown): x is string[] {
  return Array.isArray(x) && x.every((item) => typeof item === "string");
}

function isGap(value: unknown): value is Gap {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.title === "string" &&
    (v.category === "technology" || v.category === "domain") &&
    (v.severity === "high" || v.severity === "medium" || v.severity === "low") &&
    typeof v.whyItMatters === "string" &&
    typeof v.aiCanFix === "boolean" &&
    typeof v.aiFixNote === "string"
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
    typeof v.recommendationStatus === "string" &&
    isRecommendationStatus(v.recommendationStatus) &&
    typeof v.summary === "string" &&
    (v.interviewConfidence === "High" || v.interviewConfidence === "Medium" || v.interviewConfidence === "Low") &&
    isStringArray(v.strengths) &&
    Array.isArray(v.gaps) &&
    v.gaps.every(isGap) &&
    isStringArray(v.hardBlockers) &&
    isStringArray(v.resumeWordingImprovements) &&
    isStringArray(v.resumeSectionsToRewrite) &&
    typeof v.recruiterFirstImpression === "string"
  );
}
