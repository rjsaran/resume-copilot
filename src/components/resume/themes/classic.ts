import type { ResumeTheme } from "./types";

/**
 * Classic: a minimal, black-on-white, ATS-friendly layout modeled on a
 * traditional professional resume - bold name, bordered uppercase section
 * titles, plain bullet lists. No color beyond black/neutral grays.
 */
export const classicTheme: ResumeTheme = {
  id: "classic",
  label: "Classic",
  classes: {
    page: "resume-page bg-white text-black",
    header: {
      wrapper: "flex flex-col items-center gap-1 pb-3 text-center",
      name: "text-[26px] font-bold uppercase tracking-tight",
      title: "text-[13px] font-medium text-neutral-700",
      contactRow:
        "flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[10.5px] text-neutral-600",
      contactItem: "",
      linksRow:
        "flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[10.5px] text-neutral-600",
      link: "underline underline-offset-2 hover:text-neutral-900",
    },
    section: {
      wrapper: "resume-section mb-3.5",
      title:
        "resume-heading mb-1.5 border-b border-neutral-800 pb-0.5 text-[11.5px] font-bold uppercase tracking-wide",
    },
    summary: "text-[11px] leading-relaxed text-neutral-800",
    experience: {
      wrapper: "mb-2.5",
      heading: "resume-keep-with-next flex flex-wrap items-baseline justify-between gap-x-2",
      role: "text-[11.5px] font-semibold",
      company: "text-[11.5px] font-semibold",
      meta: "resume-keep-with-next flex flex-wrap items-baseline justify-between gap-x-2 text-[10px] italic text-neutral-600",
      bullets: "mt-1 list-disc space-y-0.5 pl-4",
      bulletItem: "resume-avoid-break text-[11px] leading-snug text-neutral-800",
      technologies: "mt-1 text-[10px] text-neutral-600",
    },
    projects: {
      wrapper: "mb-2.5",
      heading:
        "resume-keep-with-next flex flex-wrap items-baseline justify-between gap-x-2 text-[11.5px] font-semibold",
      meta: "flex items-baseline gap-x-1.5 text-[10px] font-normal italic text-neutral-600",
      link: "underline underline-offset-2 hover:text-neutral-900",
      bullets: "mt-1 list-disc space-y-0.5 pl-4",
      bulletItem: "resume-avoid-break text-[11px] leading-snug text-neutral-800",
      technologies: "mt-1 text-[10px] text-neutral-600",
    },
    skills: {
      wrapper: "grid gap-1",
      category: "flex gap-1 text-[11px] leading-relaxed",
      categoryLabel: "shrink-0 font-semibold text-neutral-900",
      categoryValues: "text-neutral-800",
    },
    education: {
      wrapper: "mb-2",
      heading:
        "resume-keep-with-next flex flex-wrap items-baseline justify-between gap-x-2 text-[11.5px] font-semibold",
      meta: "resume-keep-with-next text-[10px] italic text-neutral-600",
      notes: "mt-1 list-disc space-y-0.5 pl-4 text-[11px] text-neutral-800",
    },
  },
};
