import { SectionTitle } from "@/components/resume/sections/SectionTitle";
import type { SkillsData } from "@/types/resume";
import type { ResumeTheme } from "@/components/resume/themes/types";

const CATEGORY_LABELS: Record<keyof SkillsData, string> = {
  languages: "Languages",
  frameworks: "Frameworks",
  cloud: "Cloud",
  databases: "Databases",
  tools: "Tools",
  other: "Other",
};

const CATEGORY_ORDER: (keyof SkillsData)[] = [
  "languages",
  "frameworks",
  "cloud",
  "databases",
  "tools",
  "other",
];

export function Skills({ theme, skills }: { theme: ResumeTheme; skills: SkillsData }) {
  const categories = CATEGORY_ORDER.filter(
    (key) => skills[key] && skills[key]!.length > 0
  );

  if (categories.length === 0) return null;

  const classes = theme.classes.skills;

  return (
    <section className={theme.classes.section.wrapper}>
      <SectionTitle theme={theme}>Skills</SectionTitle>
      <div className={classes.wrapper}>
        {categories.map((key) => (
          <div key={key} className={classes.category}>
            <span className={classes.categoryLabel}>{CATEGORY_LABELS[key]}:</span>
            <span className={classes.categoryValues}>{skills[key]!.join(", ")}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
