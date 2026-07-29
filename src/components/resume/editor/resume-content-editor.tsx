"use client";

import { BasicsSection } from "@/components/resume/editor/basics-section";
import { ExperienceSection } from "@/components/resume/editor/experience-section";
import { ProjectsSection } from "@/components/resume/editor/projects-section";
import { SkillsSection } from "@/components/resume/editor/skills-section";
import { EducationSection } from "@/components/resume/editor/education-section";
import type { ResumeData, ResumeSectionKey } from "@/types/resume";

interface ResumeContentEditorProps {
  resume: ResumeData;
  onChange: (next: ResumeData) => void;
}

/**
 * Section shells, entry cards, and hide/collapse/drag-reorder behavior over
 * ResumeData. Used by the tailored resume panel's Edit tab for both
 * AI-tailored and manually-created versions.
 */
export function ResumeContentEditor({ resume, onChange }: ResumeContentEditorProps) {
  function toggleSectionHidden(section: ResumeSectionKey) {
    const hiddenSections = resume.hiddenSections ?? [];
    onChange({
      ...resume,
      hiddenSections: hiddenSections.includes(section)
        ? hiddenSections.filter((s) => s !== section)
        : [...hiddenSections, section],
    });
  }

  const hiddenSections = resume.hiddenSections ?? [];

  return (
    <div className="flex flex-col gap-4">
      <BasicsSection
        value={resume.basics}
        onChange={(basics) => onChange({ ...resume, basics })}
      />
      <ExperienceSection
        value={resume.experience}
        onChange={(experience) => onChange({ ...resume, experience })}
        sectionHidden={hiddenSections.includes("experience")}
        onToggleSectionHidden={() => toggleSectionHidden("experience")}
      />
      <ProjectsSection
        value={resume.projects}
        onChange={(projects) => onChange({ ...resume, projects })}
        sectionHidden={hiddenSections.includes("projects")}
        onToggleSectionHidden={() => toggleSectionHidden("projects")}
      />
      <SkillsSection
        value={resume.skills}
        onChange={(skills) => onChange({ ...resume, skills })}
        sectionHidden={hiddenSections.includes("skills")}
        onToggleSectionHidden={() => toggleSectionHidden("skills")}
      />
      <EducationSection
        value={resume.education}
        onChange={(education) => onChange({ ...resume, education })}
        sectionHidden={hiddenSections.includes("education")}
        onToggleSectionHidden={() => toggleSectionHidden("education")}
      />
    </div>
  );
}
