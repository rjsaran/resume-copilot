import type { CareerKnowledgeBase } from "@/types/careerKnowledgeBase";
import type { ResumeData, SkillsData } from "@/types/resume";

function findLink(kb: CareerKnowledgeBase, label: string): string | undefined {
  return kb.personal.links?.find((l) => l.label.toLowerCase() === label)?.url;
}

/**
 * Strips hidden sections and hidden individual items from a knowledge base.
 * Shared by the Base Resume projection below and the AI tailoring prompt
 * (resumeTailorPrompt.ts), so a hidden item disappears from both the
 * deterministic projection and what the model is allowed to draw from.
 */
export function filterVisibleKnowledgeBase(
  kb: CareerKnowledgeBase,
): CareerKnowledgeBase {
  const hiddenSections = new Set(kb.hiddenSections ?? []);
  return {
    personal: kb.personal,
    experience: hiddenSections.has("experience")
      ? []
      : kb.experience.filter((e) => !e.hidden),
    projects: hiddenSections.has("projects")
      ? []
      : kb.projects.filter((p) => !p.hidden),
    technologies: hiddenSections.has("technologies")
      ? []
      : kb.technologies.filter((t) => !t.hidden),
    education: hiddenSections.has("education")
      ? []
      : kb.education.filter((e) => !e.hidden),
  };
}

function toSkillsData(kb: CareerKnowledgeBase): SkillsData {
  const skills: SkillsData = {};
  for (const { category, items } of kb.technologies) {
    const key = category.toLowerCase();
    if (key.includes("backend"))
      skills.languages = [...(skills.languages ?? []), ...items];
    else if (key.includes("frontend"))
      skills.frameworks = [...(skills.frameworks ?? []), ...items];
    else if (key.includes("database"))
      skills.databases = [...(skills.databases ?? []), ...items];
    else if (key.includes("cloud"))
      skills.cloud = [...(skills.cloud ?? []), ...items];
    else skills.tools = [...(skills.tools ?? []), ...items];
  }
  return skills;
}

/**
 * Deterministically projects the full career knowledge base into the
 * ResumeData shape, with nothing trimmed or reworded beyond hidden
 * sections/items. This is the always-live "Base Resume" - computed fresh
 * from the knowledge base wherever it's needed (the job-board Master Resume
 * preview/PDF, the per-application diff baseline, the seed for a manual
 * tailoring draft) rather than ever persisted as a ResumeVersion. The
 * AI-tailored path (resumeTailor.ts) also starts from this same filtering
 * (see filterVisibleKnowledgeBase) but then has the model select/reword a
 * further subset - this function itself never trims or rewords.
 */
export function careerKnowledgeBaseToResumeData(
  kb: CareerKnowledgeBase,
): ResumeData {
  const visible = filterVisibleKnowledgeBase(kb);
  return {
    basics: {
      name: visible.personal.fullName,
      title: visible.personal.headline,
      email: visible.personal.email,
      phone: visible.personal.phone ?? "",
      location: visible.personal.location,
      linkedin: findLink(visible, "linkedin"),
      github: findLink(visible, "github"),
      portfolio: findLink(visible, "portfolio"),
      summary: visible.personal.summary ?? "",
    },
    experience: visible.experience.map((entry) => ({
      company: entry.company,
      role: entry.role,
      location: entry.location,
      startDate: entry.startDate,
      endDate: entry.endDate ?? "Present",
      bullets: entry.achievements,
      technologies: entry.technologies,
    })),
    projects: visible.projects.map((project) => ({
      name: project.name,
      link: project.url,
      bullets: project.highlights,
      technologies: project.technologies,
    })),
    skills: toSkillsData(visible),
    education: visible.education.map((entry) => ({
      institution: entry.institution,
      degree: entry.degree,
      location: entry.location,
      startDate: entry.startDate,
      endDate: entry.endDate,
      gpa: entry.gpa,
      notes: entry.notes,
    })),
  };
}
