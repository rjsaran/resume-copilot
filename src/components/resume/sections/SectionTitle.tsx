import type { ResumeTheme } from "@/components/resume/themes/types";

export function SectionTitle({
  theme,
  children,
}: {
  theme: ResumeTheme;
  children: React.ReactNode;
}) {
  return <h2 className={theme.classes.section.title}>{children}</h2>;
}
