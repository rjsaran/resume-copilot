export interface CoverLetterBasics {
  name: string;
  email: string;
  phone: string;
  location?: string;
  linkedin?: string;
  portfolio?: string;
}

export interface CoverLetterRecipient {
  hiringManager?: string;
  company: string;
  jobTitle: string;
}

/**
 * The canonical cover letter schema. Like ResumeData, this is the only shape
 * that flows between the generator, storage, and the renderer - the model
 * never produces Markdown or HTML, only these fields.
 */
export interface CoverLetterData {
  basics: CoverLetterBasics;
  date: string;
  recipient: CoverLetterRecipient;
  salutation: string;
  paragraphs: string[];
  closing: string;
}

export const COVER_LETTER_JSON_SCHEMA = {
  type: "object",
  properties: {
    basics: {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        location: { type: "string" },
        linkedin: { type: "string" },
        portfolio: { type: "string" },
      },
      required: ["name", "email", "phone"],
    },
    date: { type: "string" },
    recipient: {
      type: "object",
      properties: {
        hiringManager: { type: "string" },
        company: { type: "string" },
        jobTitle: { type: "string" },
      },
      required: ["company", "jobTitle"],
    },
    salutation: { type: "string" },
    paragraphs: { type: "array", items: { type: "string" } },
    closing: { type: "string" },
  },
  required: ["basics", "date", "recipient", "salutation", "paragraphs", "closing"],
} as const;

function isCoverLetterBasics(value: unknown): value is CoverLetterBasics {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.name === "string" &&
    typeof v.email === "string" &&
    typeof v.phone === "string"
  );
}

function isCoverLetterRecipient(value: unknown): value is CoverLetterRecipient {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.company === "string" && typeof v.jobTitle === "string";
}

export function isCoverLetterData(value: unknown): value is CoverLetterData {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;

  return (
    isCoverLetterBasics(v.basics) &&
    typeof v.date === "string" &&
    isCoverLetterRecipient(v.recipient) &&
    typeof v.salutation === "string" &&
    Array.isArray(v.paragraphs) &&
    v.paragraphs.every((p) => typeof p === "string") &&
    typeof v.closing === "string"
  );
}
