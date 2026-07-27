"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type {
  EducationEntry,
  ExperienceEntry,
  ProjectEntry,
  ResumeData,
  SkillsData,
} from "@/types/resume";

function linesToArray(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function arrayToLines(arr: string[] | undefined): string {
  return (arr ?? []).join("\n");
}

function csvToArray(text: string): string[] {
  return text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function arrayToCsv(arr: string[] | undefined): string {
  return (arr ?? []).join(", ");
}

const EMPTY_EXPERIENCE: ExperienceEntry = {
  company: "",
  role: "",
  startDate: "",
  endDate: "",
  bullets: [],
};

const EMPTY_PROJECT: ProjectEntry = { name: "", bullets: [] };

const EMPTY_EDUCATION: EducationEntry = { institution: "", degree: "" };

const SKILL_CATEGORIES: Array<{ key: keyof SkillsData; label: string }> = [
  { key: "languages", label: "Languages" },
  { key: "frameworks", label: "Frameworks" },
  { key: "cloud", label: "Cloud" },
  { key: "databases", label: "Databases" },
  { key: "tools", label: "Tools" },
  { key: "other", label: "Other" },
];

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className ?? ""}`}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export function ResumeEditor({
  resume,
  onChange,
}: {
  resume: ResumeData;
  onChange: (next: ResumeData) => void;
}) {
  function updateBasics(patch: Partial<ResumeData["basics"]>) {
    onChange({ ...resume, basics: { ...resume.basics, ...patch } });
  }

  function updateExperience(index: number, patch: Partial<ExperienceEntry>) {
    const next = resume.experience.slice();
    next[index] = { ...next[index], ...patch };
    onChange({ ...resume, experience: next });
  }
  function addExperience() {
    onChange({ ...resume, experience: [...resume.experience, { ...EMPTY_EXPERIENCE }] });
  }
  function removeExperience(index: number) {
    onChange({ ...resume, experience: resume.experience.filter((_, i) => i !== index) });
  }

  function updateProject(index: number, patch: Partial<ProjectEntry>) {
    const next = resume.projects.slice();
    next[index] = { ...next[index], ...patch };
    onChange({ ...resume, projects: next });
  }
  function addProject() {
    onChange({ ...resume, projects: [...resume.projects, { ...EMPTY_PROJECT }] });
  }
  function removeProject(index: number) {
    onChange({ ...resume, projects: resume.projects.filter((_, i) => i !== index) });
  }

  function updateEducation(index: number, patch: Partial<EducationEntry>) {
    const next = resume.education.slice();
    next[index] = { ...next[index], ...patch };
    onChange({ ...resume, education: next });
  }
  function addEducation() {
    onChange({ ...resume, education: [...resume.education, { ...EMPTY_EDUCATION }] });
  }
  function removeEducation(index: number) {
    onChange({ ...resume, education: resume.education.filter((_, i) => i !== index) });
  }

  function updateSkillCategory(key: keyof SkillsData, text: string) {
    onChange({ ...resume, skills: { ...resume.skills, [key]: csvToArray(text) } });
  }

  return (
    <div className="flex flex-col gap-6 text-sm">
      <section className="flex flex-col gap-3">
        <h3 className="font-semibold">Basics</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name">
            <Input
              value={resume.basics.name}
              onChange={(e) => updateBasics({ name: e.target.value })}
            />
          </Field>
          <Field label="Title">
            <Input
              value={resume.basics.title}
              onChange={(e) => updateBasics({ title: e.target.value })}
            />
          </Field>
          <Field label="Email">
            <Input
              value={resume.basics.email}
              onChange={(e) => updateBasics({ email: e.target.value })}
            />
          </Field>
          <Field label="Phone">
            <Input
              value={resume.basics.phone}
              onChange={(e) => updateBasics({ phone: e.target.value })}
            />
          </Field>
          <Field label="Location">
            <Input
              value={resume.basics.location ?? ""}
              onChange={(e) => updateBasics({ location: e.target.value })}
            />
          </Field>
          <Field label="LinkedIn">
            <Input
              value={resume.basics.linkedin ?? ""}
              onChange={(e) => updateBasics({ linkedin: e.target.value })}
            />
          </Field>
          <Field label="GitHub">
            <Input
              value={resume.basics.github ?? ""}
              onChange={(e) => updateBasics({ github: e.target.value })}
            />
          </Field>
          <Field label="Portfolio">
            <Input
              value={resume.basics.portfolio ?? ""}
              onChange={(e) => updateBasics({ portfolio: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Summary">
          <Textarea
            rows={4}
            value={resume.basics.summary}
            onChange={(e) => updateBasics({ summary: e.target.value })}
          />
        </Field>
      </section>

      <Separator />

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Experience</h3>
          <Button type="button" size="sm" variant="outline" onClick={addExperience}>
            <Plus className="size-3.5" />
            Add
          </Button>
        </div>
        {resume.experience.map((entry, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-md border p-3">
            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => removeExperience(i)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Field label="Role">
                <Input
                  value={entry.role}
                  onChange={(e) => updateExperience(i, { role: e.target.value })}
                />
              </Field>
              <Field label="Company">
                <Input
                  value={entry.company}
                  onChange={(e) => updateExperience(i, { company: e.target.value })}
                />
              </Field>
              <Field label="Location">
                <Input
                  value={entry.location ?? ""}
                  onChange={(e) => updateExperience(i, { location: e.target.value })}
                />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Start date">
                  <Input
                    value={entry.startDate}
                    onChange={(e) => updateExperience(i, { startDate: e.target.value })}
                  />
                </Field>
                <Field label="End date">
                  <Input
                    value={entry.endDate}
                    onChange={(e) => updateExperience(i, { endDate: e.target.value })}
                  />
                </Field>
              </div>
            </div>
            <Field label="Bullets (one per line)">
              <Textarea
                rows={4}
                value={arrayToLines(entry.bullets)}
                onChange={(e) =>
                  updateExperience(i, { bullets: linesToArray(e.target.value) })
                }
              />
            </Field>
            <Field label="Technologies (comma-separated)">
              <Input
                value={arrayToCsv(entry.technologies)}
                onChange={(e) =>
                  updateExperience(i, { technologies: csvToArray(e.target.value) })
                }
              />
            </Field>
          </div>
        ))}
      </section>

      <Separator />

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Projects</h3>
          <Button type="button" size="sm" variant="outline" onClick={addProject}>
            <Plus className="size-3.5" />
            Add
          </Button>
        </div>
        {resume.projects.map((project, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-md border p-3">
            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => removeProject(i)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Field label="Name">
                <Input
                  value={project.name}
                  onChange={(e) => updateProject(i, { name: e.target.value })}
                />
              </Field>
              <Field label="Link">
                <Input
                  value={project.link ?? ""}
                  onChange={(e) => updateProject(i, { link: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Bullets (one per line)">
              <Textarea
                rows={3}
                value={arrayToLines(project.bullets)}
                onChange={(e) =>
                  updateProject(i, { bullets: linesToArray(e.target.value) })
                }
              />
            </Field>
            <Field label="Technologies (comma-separated)">
              <Input
                value={arrayToCsv(project.technologies)}
                onChange={(e) =>
                  updateProject(i, { technologies: csvToArray(e.target.value) })
                }
              />
            </Field>
          </div>
        ))}
      </section>

      <Separator />

      <section className="flex flex-col gap-3">
        <h3 className="font-semibold">Skills</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {SKILL_CATEGORIES.map(({ key, label }) => (
            <Field key={key} label={`${label} (comma-separated)`}>
              <Input
                value={arrayToCsv(resume.skills[key])}
                onChange={(e) => updateSkillCategory(key, e.target.value)}
              />
            </Field>
          ))}
        </div>
      </section>

      <Separator />

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Education</h3>
          <Button type="button" size="sm" variant="outline" onClick={addEducation}>
            <Plus className="size-3.5" />
            Add
          </Button>
        </div>
        {resume.education.map((entry, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-md border p-3">
            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => removeEducation(i)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Field label="Degree">
                <Input
                  value={entry.degree}
                  onChange={(e) => updateEducation(i, { degree: e.target.value })}
                />
              </Field>
              <Field label="Institution">
                <Input
                  value={entry.institution}
                  onChange={(e) => updateEducation(i, { institution: e.target.value })}
                />
              </Field>
              <Field label="Location">
                <Input
                  value={entry.location ?? ""}
                  onChange={(e) => updateEducation(i, { location: e.target.value })}
                />
              </Field>
              <Field label="GPA">
                <Input
                  value={entry.gpa ?? ""}
                  onChange={(e) => updateEducation(i, { gpa: e.target.value })}
                />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Start date">
                  <Input
                    value={entry.startDate ?? ""}
                    onChange={(e) => updateEducation(i, { startDate: e.target.value })}
                  />
                </Field>
                <Field label="End date">
                  <Input
                    value={entry.endDate ?? ""}
                    onChange={(e) => updateEducation(i, { endDate: e.target.value })}
                  />
                </Field>
              </div>
            </div>
            <Field label="Notes (one per line)">
              <Textarea
                rows={2}
                value={arrayToLines(entry.notes)}
                onChange={(e) =>
                  updateEducation(i, { notes: linesToArray(e.target.value) })
                }
              />
            </Field>
          </div>
        ))}
      </section>
    </div>
  );
}
