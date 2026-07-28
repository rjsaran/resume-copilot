"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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

type ViewMode = "form" | "json";

export function KnowledgeBaseEditor({ initialData }: KnowledgeBaseEditorProps) {
  const [data, setData] = useState(initialData);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isSaving, startSaving] = useTransition();

  const [viewMode, setViewMode] = useState<ViewMode>("form");
  const [jsonText, setJsonText] = useState(() =>
    JSON.stringify(initialData, null, 2),
  );
  const [jsonError, setJsonError] = useState<string | null>(null);

  function update(patch: Partial<CareerKnowledgeBase>) {
    setData((d) => ({ ...d, ...patch }));
    setSaved(false);
    setError(null);
  }

  /**
   * The JSON view is a raw draft, not synced with `data` on every keystroke.
   * Parsing (and schema-checking) it happens on demand - switching back to
   * the form, saving, or hitting "Apply" - so a mid-edit invalid JSON
   * document never leaks into `data`.
   */
  function parseJsonInput(): CareerKnowledgeBase | null {
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch (e) {
      setJsonError(e instanceof Error ? `Invalid JSON: ${e.message}` : "Invalid JSON.");
      return null;
    }
    if (!isCareerKnowledgeBase(parsed)) {
      setJsonError(
        "That JSON doesn't match the expected knowledge base shape - check required fields (personal.fullName/headline/email, experience[].company/role/startDate/achievements, etc).",
      );
      return null;
    }
    setJsonError(null);
    return parsed;
  }

  function handleApplyJson() {
    const parsed = parseJsonInput();
    if (!parsed) return;
    setData(parsed);
    setSaved(false);
    setError(null);
  }

  function handleViewModeChange(mode: ViewMode) {
    if (mode === viewMode) return;
    if (mode === "json") {
      setJsonText(JSON.stringify(data, null, 2));
      setJsonError(null);
      setViewMode("json");
      return;
    }
    // Going json -> form: apply pending edits first, so they aren't lost.
    // Stay on the JSON view if they don't parse/validate.
    const parsed = parseJsonInput();
    if (!parsed) return;
    setData(parsed);
    setViewMode("form");
  }

  function handleSave() {
    setSaved(false);
    setError(null);

    let source = data;
    if (viewMode === "json") {
      const parsed = parseJsonInput();
      if (!parsed) return;
      source = parsed;
      setData(parsed);
    }

    const cleaned = cleanKnowledgeBase(source);
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
        if (viewMode === "json") {
          setJsonText(JSON.stringify(cleaned, null, 2));
        }
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
          <div className="flex shrink-0 items-center gap-2">
            <div className="flex rounded-lg border border-border p-0.5">
              <Button
                type="button"
                size="sm"
                variant={viewMode === "form" ? "secondary" : "ghost"}
                onClick={() => handleViewModeChange("form")}
              >
                Form
              </Button>
              <Button
                type="button"
                size="sm"
                variant={viewMode === "json" ? "secondary" : "ghost"}
                onClick={() => handleViewModeChange("json")}
              >
                JSON
              </Button>
            </div>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving…" : "Save"}
            </Button>
          </div>
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

      {viewMode === "json" ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit as JSON</CardTitle>
            <CardDescription>
              Paste or edit the knowledge base as raw JSON. Switching back to
              Form view or saving will validate it against the expected
              schema.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Textarea
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value);
                setJsonError(null);
              }}
              spellCheck={false}
              aria-invalid={jsonError ? true : undefined}
              className="min-h-[32rem] font-mono text-xs"
            />
            <div className="flex items-center gap-2">
              <Button type="button" size="sm" variant="outline" onClick={handleApplyJson}>
                Apply
              </Button>
              {jsonError && (
                <p className="text-sm text-destructive">{jsonError}</p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
