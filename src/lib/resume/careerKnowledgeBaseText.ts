import type { CareerKnowledgeBase } from "@/types/careerKnowledgeBase";

/**
 * Condensed plain-text projection of the knowledge base, for the job-analysis
 * prompt (see /api/analyze). This is the "lightweight" tier: one line per
 * experience/project entry (role, company, dates, tech, and the short
 * per-role summary if present) instead of full achievement bullets and
 * project descriptions - enough signal to judge fit (seniority, domain,
 * tech stack) without paying for the full prose on every analysis.
 *
 * The full knowledge base (all achievements, all detail) is a separate,
 * heavier tier reserved for resume tailoring, which needs the complete
 * source material to select and reword from - see
 * services/resume/prompts/resumeTailorPrompt.ts, which sends the raw
 * CareerKnowledgeBase JSON directly.
 */
export function careerKnowledgeBaseToText(kb: CareerKnowledgeBase): string {
  const lines: string[] = [];

  lines.push(kb.personal.fullName);
  lines.push(kb.personal.headline);
  lines.push(
    [kb.personal.email, kb.personal.phone, kb.personal.location]
      .filter(Boolean)
      .join(" | "),
  );
  lines.push("");

  if (kb.personal.summary) {
    lines.push("SUMMARY");
    lines.push(kb.personal.summary);
    lines.push("");
  }

  if (kb.experience.length > 0) {
    lines.push("EXPERIENCE");
    for (const entry of kb.experience) {
      const dates = `${entry.startDate} - ${entry.endDate ?? "Present"}`;
      const tech =
        entry.technologies && entry.technologies.length > 0
          ? entry.technologies.join(", ")
          : "";
      lines.push(
        `${entry.role} @ ${entry.company} (${dates})${tech ? ` - ${tech}` : ""}`,
      );
      if (entry.summary) lines.push(entry.summary);
    }
    lines.push("");
  }

  if (kb.projects.length > 0) {
    lines.push("PROJECTS");
    for (const project of kb.projects) {
      const tech =
        project.technologies && project.technologies.length > 0
          ? project.technologies.join(", ")
          : "";
      lines.push(
        `${project.name} (${project.type})${tech ? ` - ${tech}` : ""}`,
      );
    }
    lines.push("");
  }

  if (kb.technologies.length > 0) {
    lines.push("SKILLS");
    for (const { category, items } of kb.technologies) {
      lines.push(`${category}: ${items.join(", ")}`);
    }
    lines.push("");
  }

  if (kb.education.length > 0) {
    lines.push("EDUCATION");
    for (const entry of kb.education) {
      const meta = [entry.startDate, entry.endDate].filter(Boolean).join(" - ");
      lines.push(
        `${entry.degree} - ${entry.institution}${meta ? ` (${meta})` : ""}`,
      );
    }
    lines.push("");
  }

  return lines.join("\n").trim();
}
