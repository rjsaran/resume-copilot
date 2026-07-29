import type { ResumeData } from "@/types/resume";

/**
 * Strips hidden sections and hidden individual entries from a resume before
 * it's rendered, exported, or diffed. Editing keeps hidden entries in the
 * data so they can be toggled back on; every consumer downstream of editing
 * (Resume renderer, PDF, plain-text diff) sees only what
 * filterVisibleResumeData returns.
 */
export function filterVisibleResumeData(resume: ResumeData): ResumeData {
  const hiddenSections = new Set(resume.hiddenSections ?? []);
  return {
    basics: resume.basics,
    experience: hiddenSections.has("experience")
      ? []
      : resume.experience.filter((e) => !e.hidden),
    projects: hiddenSections.has("projects")
      ? []
      : resume.projects.filter((p) => !p.hidden),
    skills: hiddenSections.has("skills") ? {} : resume.skills,
    education: hiddenSections.has("education")
      ? []
      : resume.education.filter((e) => !e.hidden),
  };
}
