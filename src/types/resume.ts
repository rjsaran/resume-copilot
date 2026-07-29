export interface ResumeBasics {
  name: string;
  title: string;
  email: string;
  phone: string;
  location?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  summary: string;
}

export interface ExperienceEntry {
  company: string;
  role: string;
  location?: string;
  startDate: string;
  endDate: string;
  bullets: string[];
  technologies?: string[];
  /** Excluded from render/export/diff while editing - lets a user toggle an entry off without losing its content. */
  hidden?: boolean;
}

export interface ProjectEntry {
  name: string;
  link?: string;
  location?: string;
  bullets: string[];
  technologies?: string[];
  /** Excluded from render/export/diff while editing - lets a user toggle an entry off without losing its content. */
  hidden?: boolean;
}

export interface SkillsData {
  languages?: string[];
  frameworks?: string[];
  cloud?: string[];
  databases?: string[];
  tools?: string[];
  other?: string[];
}

export interface EducationEntry {
  institution: string;
  degree: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  gpa?: string;
  notes?: string[];
  /** Excluded from render/export/diff while editing - lets a user toggle an entry off without losing its content. */
  hidden?: boolean;
}

/** A whole section hidden at once, regardless of its individual entries' own `hidden` flags. */
export type ResumeSectionKey = "experience" | "projects" | "education" | "skills";

/**
 * The canonical resume schema. This is the ONLY shape that ever flows
 * between the parser, Gemini, storage, and the renderer - nothing in this
 * pipeline generates or consumes Markdown or HTML except the renderer,
 * which turns this JSON into HTML for preview/PDF.
 */
export interface ResumeData {
  basics: ResumeBasics;
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  skills: SkillsData;
  education: EducationEntry[];
  /** Whole sections hidden from render/export/diff, independent of any per-entry hidden flags. */
  hiddenSections?: ResumeSectionKey[];
}

const STRING_ARRAY_SCHEMA = {
  type: "array",
  items: { type: "string" },
} as const;

const DATE_FIELD_SCHEMA = {
  type: "string",
  maxLength: 24,
  description:
    "Copy exactly as written in the Career Knowledge Base (e.g. '2011', '2011-07', 'Jul 2011', 'Present'). " +
    "A date/label only - never commentary, reasoning, or any other text.",
} as const;

/**
 * JSON Schema for structured Gemini output (response_format.schema).
 * Mirrors ResumeData exactly - keep the two in sync by hand, since Gemini's
 * structured output can't be derived automatically from a TS type.
 */
export const RESUME_JSON_SCHEMA = {
  type: "object",
  properties: {
    basics: {
      type: "object",
      properties: {
        name: { type: "string" },
        title: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        location: { type: "string" },
        linkedin: { type: "string" },
        github: { type: "string" },
        portfolio: { type: "string" },
        summary: { type: "string" },
      },
      required: ["name", "title", "email", "phone", "summary"],
    },
    experience: {
      type: "array",
      items: {
        type: "object",
        properties: {
          company: { type: "string" },
          role: { type: "string" },
          location: { type: "string" },
          startDate: DATE_FIELD_SCHEMA,
          endDate: DATE_FIELD_SCHEMA,
          bullets: STRING_ARRAY_SCHEMA,
          technologies: STRING_ARRAY_SCHEMA,
        },
        required: ["company", "role", "startDate", "endDate", "bullets"],
      },
    },
    projects: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          link: { type: "string" },
          location: { type: "string" },
          bullets: STRING_ARRAY_SCHEMA,
          technologies: STRING_ARRAY_SCHEMA,
        },
        required: ["name", "bullets"],
      },
    },
    skills: {
      type: "object",
      properties: {
        languages: STRING_ARRAY_SCHEMA,
        frameworks: STRING_ARRAY_SCHEMA,
        cloud: STRING_ARRAY_SCHEMA,
        databases: STRING_ARRAY_SCHEMA,
        tools: STRING_ARRAY_SCHEMA,
        other: STRING_ARRAY_SCHEMA,
      },
    },
    education: {
      type: "array",
      items: {
        type: "object",
        properties: {
          institution: { type: "string" },
          degree: { type: "string" },
          location: { type: "string" },
          startDate: DATE_FIELD_SCHEMA,
          endDate: DATE_FIELD_SCHEMA,
          gpa: { type: "string", maxLength: 16, description: "GPA only, e.g. '3.8' or '3.8/4.0'." },
          notes: STRING_ARRAY_SCHEMA,
        },
        required: ["institution", "degree"],
      },
    },
  },
  required: ["basics", "experience", "projects", "skills", "education"],
} as const;

function isStringArrayOrUndefined(
  value: unknown,
): value is string[] | undefined {
  return (
    value === undefined ||
    (Array.isArray(value) && value.every((v) => typeof v === "string"))
  );
}

function isExperienceEntry(value: unknown): value is ExperienceEntry {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.company === "string" &&
    typeof v.role === "string" &&
    typeof v.startDate === "string" &&
    typeof v.endDate === "string" &&
    Array.isArray(v.bullets) &&
    v.bullets.every((b) => typeof b === "string") &&
    isStringArrayOrUndefined(v.technologies)
  );
}

function isProjectEntry(value: unknown): value is ProjectEntry {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.name === "string" &&
    Array.isArray(v.bullets) &&
    v.bullets.every((b) => typeof b === "string") &&
    isStringArrayOrUndefined(v.technologies)
  );
}

function isEducationEntry(value: unknown): value is EducationEntry {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.institution === "string" && typeof v.degree === "string";
}

function isSkillsData(value: unknown): value is SkillsData {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    isStringArrayOrUndefined(v.languages) &&
    isStringArrayOrUndefined(v.frameworks) &&
    isStringArrayOrUndefined(v.cloud) &&
    isStringArrayOrUndefined(v.databases) &&
    isStringArrayOrUndefined(v.tools) &&
    isStringArrayOrUndefined(v.other)
  );
}

export function isResumeData(value: unknown): value is ResumeData {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;

  if (typeof v.basics !== "object" || v.basics === null) return false;
  const basics = v.basics as Record<string, unknown>;
  const basicsValid =
    typeof basics.name === "string" &&
    typeof basics.title === "string" &&
    typeof basics.email === "string" &&
    typeof basics.phone === "string" &&
    typeof basics.summary === "string";

  return (
    basicsValid &&
    Array.isArray(v.experience) &&
    v.experience.every(isExperienceEntry) &&
    Array.isArray(v.projects) &&
    v.projects.every(isProjectEntry) &&
    isSkillsData(v.skills) &&
    Array.isArray(v.education) &&
    v.education.every(isEducationEntry)
  );
}
