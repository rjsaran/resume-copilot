import type { CareerKnowledgeBase } from "@/types/careerKnowledgeBase";

/**
 * Flattens the full career knowledge base into readable plain text for the
 * job-analysis prompt (see /api/analyze). This intentionally includes every
 * experience achievement and personal project — richer than any single
 * resume — so the analyzer judges match/gaps against the candidate's full
 * history, not just whatever fit on a two-page resume.
 */
export function careerKnowledgeBaseToText(kb: CareerKnowledgeBase): string {
  const lines: string[] = [];

  lines.push(kb.personal.fullName);
  lines.push(kb.personal.headline);
  lines.push(
    [kb.personal.email, kb.personal.phone, kb.personal.location].filter(Boolean).join(" | ")
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
      lines.push(`${entry.role} — ${entry.company}`);
      lines.push(
        `${entry.startDate} - ${entry.endDate ?? "Present"}${entry.location ? ` | ${entry.location}` : ""}`
      );
      if (entry.summary) lines.push(entry.summary);
      for (const achievement of entry.achievements) {
        lines.push(`- ${achievement}`);
      }
      if (entry.technologies && entry.technologies.length > 0) {
        lines.push(`Technologies: ${entry.technologies.join(", ")}`);
      }
      lines.push("");
    }
  }

  if (kb.projects.length > 0) {
    lines.push("PROJECTS");
    for (const project of kb.projects) {
      lines.push(`${project.name} (${project.type})`);
      lines.push(project.description);
      for (const highlight of project.highlights) {
        lines.push(`- ${highlight}`);
      }
      if (project.technologies && project.technologies.length > 0) {
        lines.push(`Technologies: ${project.technologies.join(", ")}`);
      }
      lines.push("");
    }
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
      lines.push(`${entry.degree} — ${entry.institution}`);
      const meta = [entry.startDate, entry.endDate].filter(Boolean).join(" - ");
      const extra = [meta, entry.location, entry.gpa ? `GPA: ${entry.gpa}` : ""]
        .filter(Boolean)
        .join(" | ");
      if (extra) lines.push(extra);
      for (const note of entry.notes ?? []) {
        lines.push(`- ${note}`);
      }
      lines.push("");
    }
  }

  return lines.join("\n").trim();
}
