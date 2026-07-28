"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { PersonalInfoSection } from "@/components/knowledge-base/personal-info-section";
import { ExperienceSection } from "@/components/knowledge-base/experience-section";
import { ProjectsSection } from "@/components/knowledge-base/projects-section";
import { TechnologiesSection } from "@/components/knowledge-base/technologies-section";
import { EducationSection } from "@/components/knowledge-base/education-section";
import {
  isCareerKnowledgeBase,
  type CareerKnowledgeBase,
} from "@/types/careerKnowledgeBase";
import { saveKnowledgeBaseAction } from "@/app/knowledge-base/actions";

interface KnowledgeBaseEditorProps {
  initialData: CareerKnowledgeBase;
}

function cleanStrings(values: string[] | undefined): string[] {
  return (values ?? []).map((v) => v.trim()).filter(Boolean);
}

function cleanOptional(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * The editor lets users leave blank rows mid-edit (an added-but-unfilled
 * achievement, a category with no items yet). Only clean it up right before
 * persisting, so the JSON saved to the DB never accumulates that noise.
 */
function cleanKnowledgeBase(data: CareerKnowledgeBase): CareerKnowledgeBase {
  return {
    personal: {
      fullName: data.personal.fullName.trim(),
      headline: data.personal.headline.trim(),
      email: data.personal.email.trim(),
      phone: cleanOptional(data.personal.phone),
      location: cleanOptional(data.personal.location),
      summary: cleanOptional(data.personal.summary),
      links: data.personal.links
        ?.map((l) => ({ label: l.label.trim(), url: l.url.trim() }))
        .filter((l) => l.label && l.url),
    },
    experience: data.experience
      .map((e) => ({
        ...e,
        company: e.company.trim(),
        role: e.role.trim(),
        location: cleanOptional(e.location),
        startDate: e.startDate.trim(),
        endDate: cleanOptional(e.endDate),
        summary: cleanOptional(e.summary),
        achievements: cleanStrings(e.achievements),
        technologies: e.technologies ? cleanStrings(e.technologies) : undefined,
      }))
      .filter((e) => e.company || e.role || e.achievements.length > 0),
    projects: data.projects
      .map((p) => ({
        ...p,
        name: p.name.trim(),
        role: cleanOptional(p.role),
        description: p.description.trim(),
        highlights: cleanStrings(p.highlights),
        technologies: p.technologies ? cleanStrings(p.technologies) : undefined,
        url: cleanOptional(p.url),
        startDate: cleanOptional(p.startDate),
        endDate: cleanOptional(p.endDate),
      }))
      .filter((p) => p.name || p.description || p.highlights.length > 0),
    technologies: data.technologies
      .map((t) => ({
        category: t.category.trim(),
        items: cleanStrings(t.items),
      }))
      .filter((t) => t.category && t.items.length > 0),
    education: data.education
      .map((e) => ({
        ...e,
        institution: e.institution.trim(),
        degree: e.degree.trim(),
        location: cleanOptional(e.location),
        startDate: cleanOptional(e.startDate),
        endDate: cleanOptional(e.endDate),
        gpa: cleanOptional(e.gpa),
        notes: e.notes ? cleanStrings(e.notes) : undefined,
      }))
      .filter((e) => e.institution || e.degree),
  };
}

export function KnowledgeBaseEditor({ initialData }: KnowledgeBaseEditorProps) {
  const [data, setData] = useState(initialData);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isSaving, startSaving] = useTransition();

  function update(patch: Partial<CareerKnowledgeBase>) {
    setData((d) => ({ ...d, ...patch }));
    setSaved(false);
    setError(null);
  }

  function handleSave() {
    setSaved(false);
    setError(null);

    const cleaned = cleanKnowledgeBase(data);
    if (!isCareerKnowledgeBase(cleaned)) {
      setError(
        "Something's missing - check the required fields (name, headline, email) and try again.",
      );
      return;
    }

    startSaving(async () => {
      const result = await saveKnowledgeBaseAction(cleaned);
      if (result.success) {
        setData(cleaned);
        setSaved(true);
      } else {
        setError(result.error ?? "Failed to save.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Career Knowledge Base</CardTitle>
            <CardDescription>
              Every job, project, skill, and education fact you have. Edit it
              below, then save.
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="shrink-0"
          >
            {isSaving ? "Saving…" : "Save"}
          </Button>
        </CardHeader>
        {(error || saved) && (
          <CardContent className="pt-0">
            {error && <p className="text-sm text-destructive">{error}</p>}
            {saved && !error && (
              <p className="text-sm text-emerald-600">Saved.</p>
            )}
          </CardContent>
        )}
      </Card>

      <PersonalInfoSection
        value={data.personal}
        onChange={(personal) => update({ personal })}
      />
      <ExperienceSection
        value={data.experience}
        onChange={(experience) => update({ experience })}
      />
      <ProjectsSection
        value={data.projects}
        onChange={(projects) => update({ projects })}
      />
      <TechnologiesSection
        value={data.technologies}
        onChange={(technologies) => update({ technologies })}
      />
      <EducationSection
        value={data.education}
        onChange={(education) => update({ education })}
      />
    </div>
  );
}
