import type { ResumeTheme } from "@/components/resume/themes/types";

export function Divider({ theme }: { theme: ResumeTheme }) {
  return <hr className={theme.classes.divider} />;
}
