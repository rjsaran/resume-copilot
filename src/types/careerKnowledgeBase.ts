export interface PersonalInfo {
  fullName: string;
  headline: string;
  email: string;
  phone?: string;
  location?: string;
  summary?: string;
  links?: { label: string; url: string }[];
}

/**
 * One fact per string, unclipped by resume-length constraints. This is the
 * raw material the tailoring step selects and rewords from - richer and
 * longer than anything that would fit on an actual resume.
 */
export interface ExperienceKnowledge {
  id: string;
  company: string;
  role: string;
  location?: string;
  startDate: string;
  endDate?: string;
  summary?: string;
  achievements: string[];
  technologies?: string[];
  /** Excluded from the Base Resume, AI tailoring input, and the job-board Master Resume - kept in the knowledge base for later reuse rather than deleted. */
  hidden?: boolean;
}

export interface ProjectKnowledge {
  id: string;
  name: string;
  type: "personal" | "professional" | "open-source";
  role?: string;
  description: string;
  highlights: string[];
  technologies?: string[];
  url?: string;
  startDate?: string;
  endDate?: string;
  /** Excluded from the Base Resume, AI tailoring input, and the job-board Master Resume - kept in the knowledge base for later reuse rather than deleted. */
  hidden?: boolean;
}

export interface EducationKnowledge {
  id: string;
  institution: string;
  degree: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  gpa?: string;
  notes?: string[];
  /** Excluded from the Base Resume, AI tailoring input, and the job-board Master Resume - kept in the knowledge base for later reuse rather than deleted. */
  hidden?: boolean;
}

export interface TechnologyCategory {
  category: string;
  items: string[];
  /** Excluded from the Base Resume, AI tailoring input, and the job-board Master Resume - kept in the knowledge base for later reuse rather than deleted. */
  hidden?: boolean;
}

/** A whole section hidden at once, regardless of its individual items' own `hidden` flags. */
export type KnowledgeBaseSectionKey =
  | "experience"
  | "projects"
  | "education"
  | "technologies";

/**
 * The full career truth source: every job, project, skill, and education
 * fact the candidate has, independent of any single job application. A
 * tailored resume is always a *subset and rewording* of this data, never
 * the other way around. Replaces the old resume/master_.pdf + master_resume.md
 * as the master input to the pipeline.
 */
export interface CareerKnowledgeBase {
  personal: PersonalInfo;
  experience: ExperienceKnowledge[];
  projects: ProjectKnowledge[];
  technologies: TechnologyCategory[];
  education: EducationKnowledge[];
  /** Whole sections hidden from the Base Resume/AI tailoring/Master Resume, independent of any per-item hidden flags. */
  hiddenSections?: KnowledgeBaseSectionKey[];
}

const STRING_ARRAY_SCHEMA = {
  type: "array",
  items: { type: "string" },
} as const;

/**
 * JSON Schema for structured LLM output (response_format.schema) when
 * importing a knowledge base from resume/LinkedIn text. Mirrors
 * CareerKnowledgeBase exactly - keep the two in sync by hand, since
 * structured output schemas can't be derived automatically from a TS type.
 */
export const CAREER_KNOWLEDGE_BASE_JSON_SCHEMA = {
  type: "object",
  properties: {
    personal: {
      type: "object",
      properties: {
        fullName: { type: "string" },
        headline: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        location: { type: "string" },
        summary: { type: "string" },
        links: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              url: { type: "string" },
            },
            required: ["label", "url"],
          },
        },
      },
      required: ["fullName", "headline", "email"],
    },
    experience: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "Short, stable, kebab-case identifier.",
          },
          company: { type: "string" },
          role: { type: "string" },
          location: { type: "string" },
          startDate: { type: "string" },
          endDate: { type: "string" },
          summary: { type: "string" },
          achievements: STRING_ARRAY_SCHEMA,
          technologies: STRING_ARRAY_SCHEMA,
        },
        required: ["id", "company", "role", "startDate", "achievements"],
      },
    },
    projects: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "Short, stable, kebab-case identifier.",
          },
          name: { type: "string" },
          type: {
            type: "string",
            enum: ["personal", "professional", "open-source"],
          },
          role: { type: "string" },
          description: { type: "string" },
          highlights: STRING_ARRAY_SCHEMA,
          technologies: STRING_ARRAY_SCHEMA,
          url: { type: "string" },
          startDate: { type: "string" },
          endDate: { type: "string" },
        },
        required: ["id", "name", "type", "description", "highlights"],
      },
    },
    technologies: {
      type: "array",
      items: {
        type: "object",
        properties: {
          category: { type: "string" },
          items: STRING_ARRAY_SCHEMA,
        },
        required: ["category", "items"],
      },
    },
    education: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "Short, stable, kebab-case identifier.",
          },
          institution: { type: "string" },
          degree: { type: "string" },
          location: { type: "string" },
          startDate: { type: "string" },
          endDate: { type: "string" },
          gpa: { type: "string" },
          notes: STRING_ARRAY_SCHEMA,
        },
        required: ["id", "institution", "degree"],
      },
    },
  },
  required: ["personal", "experience", "projects", "technologies", "education"],
} as const;

function isStringArrayOrUndefined(
  value: unknown,
): value is string[] | undefined {
  return (
    value === undefined ||
    (Array.isArray(value) && value.every((v) => typeof v === "string"))
  );
}

function isPersonalInfo(value: unknown): value is PersonalInfo {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.fullName === "string" &&
    typeof v.headline === "string" &&
    typeof v.email === "string" &&
    (v.links === undefined ||
      (Array.isArray(v.links) &&
        v.links.every(
          (l) =>
            typeof l === "object" &&
            l !== null &&
            typeof (l as Record<string, unknown>).label === "string" &&
            typeof (l as Record<string, unknown>).url === "string",
        )))
  );
}

function isExperienceKnowledge(value: unknown): value is ExperienceKnowledge {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.company === "string" &&
    typeof v.role === "string" &&
    typeof v.startDate === "string" &&
    Array.isArray(v.achievements) &&
    v.achievements.every((a) => typeof a === "string") &&
    isStringArrayOrUndefined(v.technologies)
  );
}

function isProjectKnowledge(value: unknown): value is ProjectKnowledge {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.name === "string" &&
    (v.type === "personal" ||
      v.type === "professional" ||
      v.type === "open-source") &&
    typeof v.description === "string" &&
    Array.isArray(v.highlights) &&
    v.highlights.every((h) => typeof h === "string") &&
    isStringArrayOrUndefined(v.technologies)
  );
}

function isEducationKnowledge(value: unknown): value is EducationKnowledge {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.institution === "string" &&
    typeof v.degree === "string"
  );
}

function isTechnologyCategory(value: unknown): value is TechnologyCategory {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.category === "string" &&
    Array.isArray(v.items) &&
    v.items.every((i) => typeof i === "string")
  );
}

export function isCareerKnowledgeBase(
  value: unknown,
): value is CareerKnowledgeBase {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    isPersonalInfo(v.personal) &&
    Array.isArray(v.experience) &&
    v.experience.every(isExperienceKnowledge) &&
    Array.isArray(v.projects) &&
    v.projects.every(isProjectKnowledge) &&
    Array.isArray(v.technologies) &&
    v.technologies.every(isTechnologyCategory) &&
    Array.isArray(v.education) &&
    v.education.every(isEducationKnowledge)
  );
}
