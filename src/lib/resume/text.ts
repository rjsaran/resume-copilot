import { filterVisibleResumeData } from "@/lib/resume/visibility";
import type { ResumeData } from "@/types/resume";

/**
 * Flattens structured resume data into readable plain text, purely for
 * line-based diffing (see ResumeDiffViewer). This is NOT a rendering path -
 * the renderer never consumes this; it exists only so two ResumeData
 * snapshots can be compared line by line. Filtered through the same
 * visibility rules as the renderer, so a hidden entry shows up as a removal
 * in the diff rather than as unchanged content that silently isn't exported.
 */
export function resumeToPlainText(resumeInput: ResumeData): string {
  const resume = filterVisibleResumeData(resumeInput);
  const lines: string[] = [];

  lines.push(resume.basics.name);
  lines.push(resume.basics.title);
  lines.push(
    [resume.basics.email, resume.basics.phone, resume.basics.location]
      .filter(Boolean)
      .join(" | "),
  );
  lines.push("");

  if (resume.basics.summary) {
    lines.push("SUMMARY");
    lines.push(resume.basics.summary);
    lines.push("");
  }

  if (resume.experience.length > 0) {
    lines.push("EXPERIENCE");
    for (const entry of resume.experience) {
      lines.push(`${entry.role} - ${entry.company}`);
      lines.push(
        `${entry.startDate} - ${entry.endDate}${entry.location ? ` | ${entry.location}` : ""}`,
      );
      for (const bullet of entry.bullets) {
        lines.push(`- ${bullet}`);
      }
      if (entry.technologies && entry.technologies.length > 0) {
        lines.push(`Technologies: ${entry.technologies.join(", ")}`);
      }
      lines.push("");
    }
  }

  if (resume.projects.length > 0) {
    lines.push("PROJECTS");
    for (const project of resume.projects) {
      lines.push(project.name);
      for (const bullet of project.bullets) {
        lines.push(`- ${bullet}`);
      }
      if (project.technologies && project.technologies.length > 0) {
        lines.push(`Technologies: ${project.technologies.join(", ")}`);
      }
      lines.push("");
    }
  }

  const skillCategories: Array<[string, string[] | undefined]> = [
    ["Languages", resume.skills.languages],
    ["Frameworks", resume.skills.frameworks],
    ["Cloud", resume.skills.cloud],
    ["Databases", resume.skills.databases],
    ["Tools", resume.skills.tools],
    ["Other", resume.skills.other],
  ];
  const hasSkills = skillCategories.some(
    ([, items]) => items && items.length > 0,
  );
  if (hasSkills) {
    lines.push("SKILLS");
    for (const [label, items] of skillCategories) {
      if (items && items.length > 0) {
        lines.push(`${label}: ${items.join(", ")}`);
      }
    }
    lines.push("");
  }

  if (resume.education.length > 0) {
    lines.push("EDUCATION");
    for (const entry of resume.education) {
      lines.push(`${entry.degree} - ${entry.institution}`);
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
