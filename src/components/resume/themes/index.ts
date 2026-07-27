import type { ResumeTheme } from "./types";
import { classicTheme } from "./classic";

/**
 * Theme registry. Every theme consumes the exact same ResumeData JSON —
 * adding a new theme (Modern, Minimal, Executive, ...) means adding a new
 * entry here plus a `classes` object; no changes to the schema, the
 * section components, or the pipeline that produces ResumeData.
 */
export const RESUME_THEMES = {
  classic: classicTheme,
} satisfies Record<string, ResumeTheme>;

export type ResumeThemeId = keyof typeof RESUME_THEMES;

export const DEFAULT_RESUME_THEME: ResumeThemeId = "classic";

export function resolveResumeTheme(id: string | undefined): ResumeTheme {
  if (id && id in RESUME_THEMES) {
    return RESUME_THEMES[id as ResumeThemeId];
  }
  return RESUME_THEMES[DEFAULT_RESUME_THEME];
}

export type { ResumeTheme } from "./types";
