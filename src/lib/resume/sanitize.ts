import type { ResumeData } from "@/types/resume";

const MAX_DATE_LENGTH = 24;
const MAX_GPA_LENGTH = 16;

// Real dates are short and never contain a colon or a field-label word.
// Corruption bleeds in as "<value> <Some Label>: <more text>", so anything
// matching that shape is the label leak itself, not a truncated date.
const SUSPICIOUS_DATE_PATTERN = /[:]|\b(role|date|position|title)\b/i;

/**
 * Gemini occasionally corrupts a short field (most often an education
 * endDate) with runaway meta-commentary instead of the actual short value
 * (observed: reasoning-like text bleeding into `endDate`, e.g.
 * "2011-07 Role End Date: 2011"). Blindly truncating a corrupted value to
 * MAX_DATE_LENGTH just yields a shorter piece of garbage (e.g. the example
 * above truncates to "2011-07 Role End Date: 2"), so instead we detect the
 * corruption shape and drop the field entirely - no date is better than a
 * mangled one on the resume. This does not fix the model's occasional
 * corruption - it only prevents it from reaching the UI.
 */
function sanitizeDateField(value: string | undefined): string | undefined {
  if (!value) return value;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_DATE_LENGTH || SUSPICIOUS_DATE_PATTERN.test(trimmed)) {
    return undefined;
  }
  return trimmed;
}

function sanitizeGpaField(value: string | undefined): string | undefined {
  if (!value) return value;
  const trimmed = value.trim();
  return !trimmed || trimmed.length > MAX_GPA_LENGTH ? undefined : trimmed;
}

export function sanitizeResumeData(resume: ResumeData): ResumeData {
  return {
    ...resume,
    experience: resume.experience.map((entry) => ({
      ...entry,
      startDate: sanitizeDateField(entry.startDate) ?? "",
      endDate: sanitizeDateField(entry.endDate) ?? "",
    })),
    education: resume.education.map((entry) => ({
      ...entry,
      startDate: sanitizeDateField(entry.startDate),
      endDate: sanitizeDateField(entry.endDate),
      gpa: sanitizeGpaField(entry.gpa),
    })),
  };
}
