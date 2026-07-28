import type { CoverLetterData } from "@/types/coverLetter";

export function createEmptyCoverLetter(): CoverLetterData {
  return {
    basics: { name: "", email: "", phone: "" },
    date: "",
    recipient: { company: "", jobTitle: "" },
    salutation: "",
    paragraphs: [],
    closing: "",
  };
}
