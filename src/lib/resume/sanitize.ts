import type { ResumeData } from "@/types/resume";

const MAX_DATE_LENGTH = 24;
const MAX_GPA_LENGTH = 16;

/**
 * Gemini occasionally corrupts a short field (most often an education
 * endDate) with runaway meta-commentary instead of the actual short value
 * (observed: reasoning-like text bleeding into `endDate`). Date/GPA fields
 * are inherently short by nature, so clamp them defensively rather than
 * rendering paragraphs of garbage on the resume. This does not fix the
 * model's occasional corruption — it only prevents it from reaching the UI.
 */
export function sanitizeResumeData(resume: ResumeData): ResumeData {
  const clamp = (value: string | undefined, max: number) =>
    value && value.length > max ? value.slice(0, max).trim() : value;

  return {
    ...resume,
    experience: resume.experience.map((entry) => ({
      ...entry,
      startDate: clamp(entry.startDate, MAX_DATE_LENGTH) ?? entry.startDate,
      endDate: clamp(entry.endDate, MAX_DATE_LENGTH) ?? entry.endDate,
    })),
    education: resume.education.map((entry) => ({
      ...entry,
      startDate: clamp(entry.startDate, MAX_DATE_LENGTH),
      endDate: clamp(entry.endDate, MAX_DATE_LENGTH),
      gpa: clamp(entry.gpa, MAX_GPA_LENGTH),
    })),
  };
}
