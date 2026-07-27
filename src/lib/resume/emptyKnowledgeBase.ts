import type { CareerKnowledgeBase } from "@/types/careerKnowledgeBase";

export function createEmptyKnowledgeBase(): CareerKnowledgeBase {
  return {
    personal: { fullName: "", headline: "", email: "" },
    experience: [],
    projects: [],
    technologies: [],
    education: [],
  };
}
