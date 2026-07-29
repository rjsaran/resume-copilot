export interface ResumeImportPromptInput {
  /** Raw text extracted from an uploaded resume PDF. */
  sourceText: string;
}

export interface ResumeImportPrompt {
  systemInstruction: string;
  input: string;
}

const SYSTEM_INSTRUCTION = [
  "You are transcribing a candidate's resume from raw text extracted from a resume PDF " +
    "(extraction can leave layout artifacts: odd line breaks, column text interleaved, repeated headers/footers) " +
    "into structured resume JSON.",
  "",
  "This is becoming the candidate's Base Resume - the richest, most complete source of their career history, " +
    "later used as the source material a separate tailoring step selects and rewords a subset of for any given " +
    "job application. Your only job here is faithful transcription and structuring, not tailoring, summarizing, " +
    "or trimming - keep every achievement/bullet the source text contains, even if the result would be longer " +
    "than a normal resume.",
  "",
  "Rules:",
  "- Extract every distinct fact from the source text: every role, every project, every achievement/bullet, " +
    "every skill or technology mentioned, every education entry.",
  "- Never invent, infer, or embellish anything not stated or clearly implied by the source text. If a field " +
    "(e.g. an end date, GPA, or location) isn't present, omit it rather than guessing.",
  "- One fact per bullet - split run-on bullets into separate entries rather than concatenating multiple facts " +
    "into one string.",
  '- Group technologies/skills into the schema\'s fixed categories (languages, frameworks, cloud, databases, ' +
    'tools, other) based only on what the source text actually lists - do not add skills that aren\'t ' +
    "evidenced anywhere in the source text.",
  "- If the source text has no clear professional summary, omit it rather than fabricating one.",
  "",
  "Output requirements:",
  "- Return ONLY a JSON object matching the resume schema. No commentary, no explanations, no markdown, no " +
    "code fences.",
].join("\n");

export function buildResumeImportPrompt(input: ResumeImportPromptInput): ResumeImportPrompt {
  return {
    systemInstruction: SYSTEM_INSTRUCTION,
    input: `# Source Text\n\n${input.sourceText}\n\n---\n\n# Task\n\nTranscribe the source text above into the resume JSON schema, following every rule in your system instructions exactly.`,
  };
}
