export type Decision = "Apply" | "Tailor" | "Skip";

export interface JobAnalysis {
  company: string;
  jobTitle: string;
  matchScore: number;
  atsScore: number;
  hardBlockers: string[];
  resumeWordingImprovements: string[];
  missingTechnologies: string[];
  missingDomainKnowledge: string[];
  resumeSectionsToRewrite: string[];
  interviewProbability: number;
  decision: Decision;
}

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
    hardBlockers: {
      type: "array",
      items: { type: "string" },
      description: "Dealbreaker requirements the candidate does not meet.",
    },
    resumeWordingImprovements: {
      type: "array",
      items: { type: "string" },
      description: "Specific wording/phrasing edits to strengthen the resume for this job.",
    },
    missingTechnologies: {
      type: "array",
      items: { type: "string" },
      description: "Technologies required by the job posting that are absent from the resume.",
    },
    missingDomainKnowledge: {
      type: "array",
      items: { type: "string" },
      description: "Domain or industry knowledge the posting expects that the resume doesn't demonstrate.",
    },
    resumeSectionsToRewrite: {
      type: "array",
      items: { type: "string" },
      description: "Resume sections that need a rewrite to better match this job.",
    },
    interviewProbability: {
      type: "integer",
      description: "Estimated probability (0 to 100) of landing an interview based on this resume and job description.",
    },
    decision: {
      type: "string",
      enum: ["Apply", "Tailor", "Skip"],
      description: "Apply as-is, tailor the resume first, or skip this job.",
    },
  },
  required: [
    "company",
    "jobTitle",
    "matchScore",
    "atsScore",
    "hardBlockers",
    "resumeWordingImprovements",
    "missingTechnologies",
    "missingDomainKnowledge",
    "resumeSectionsToRewrite",
    "interviewProbability",
    "decision",
  ],
  additionalProperties: false,
} as const;

export function isJobAnalysis(value: unknown): value is JobAnalysis {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  const isStringArray = (x: unknown): x is string[] =>
    Array.isArray(x) && x.every((item) => typeof item === "string");
  return (
    typeof v.company === "string" &&
    typeof v.jobTitle === "string" &&
    typeof v.matchScore === "number" &&
    typeof v.atsScore === "number" &&
    isStringArray(v.hardBlockers) &&
    isStringArray(v.resumeWordingImprovements) &&
    isStringArray(v.missingTechnologies) &&
    isStringArray(v.missingDomainKnowledge) &&
    isStringArray(v.resumeSectionsToRewrite) &&
    typeof v.interviewProbability === "number" &&
    typeof v.decision === "string" &&
    ["Apply", "Tailor", "Skip"].includes(v.decision)
  );
}
