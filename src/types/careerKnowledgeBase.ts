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
 * raw material the tailoring step selects and rewords from — richer and
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
}

export interface TechnologyCategory {
  category: string;
  items: string[];
}

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
}

function isStringArrayOrUndefined(value: unknown): value is string[] | undefined {
  return value === undefined || (Array.isArray(value) && value.every((v) => typeof v === "string"));
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
            typeof (l as Record<string, unknown>).url === "string"
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
    (v.type === "personal" || v.type === "professional" || v.type === "open-source") &&
    typeof v.description === "string" &&
    Array.isArray(v.highlights) &&
    v.highlights.every((h) => typeof h === "string") &&
    isStringArrayOrUndefined(v.technologies)
  );
}

function isEducationKnowledge(value: unknown): value is EducationKnowledge {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.id === "string" && typeof v.institution === "string" && typeof v.degree === "string";
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

export function isCareerKnowledgeBase(value: unknown): value is CareerKnowledgeBase {
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
