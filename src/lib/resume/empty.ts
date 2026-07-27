import type { ResumeData } from "@/types/resume";

export function createEmptyResume(): ResumeData {
  return {
    basics: {
      name: "",
      title: "",
      email: "",
      phone: "",
      summary: "",
    },
    experience: [],
    projects: [],
    skills: {},
    education: [],
  };
}
