export interface JobAnalysisPromptInput {
  careerHistory: string;
  jobDescription: string;
}

export interface JobAnalysisPrompt {
  systemInstruction: string;
  input: string;
}

const SYSTEM_INSTRUCTION = [
  "You are an engineering recruiter specialized in hiring senior backend engineers.",
  "",
  "Compare:",
  "",
  "1. Candidate Career History — a full knowledge base of every job, achievement, project, and skill the candidate has. It is deliberately richer than any single resume: a tailored resume is built later by selecting and rewording a relevant subset of it for a specific job.",
  "Do not assume everything here would appear verbatim on a resume.",
  "2. Job Description",
  "",
  "Return JSON.",
  "",
  "Never invent experience.",
  "",
  "Identify:",
  "",
  "- Company name and job title (extracted from the job description)",
  "- Match score",
  "- ATS score",
  "- Hard blockers",
  "- Resume wording improvements (phrase these as guidance for how a tailored resume built from this history should be worded, not as edits to the career history itself)",
  "- Missing technologies",
  "- Missing domain knowledge",
  "- Resume sections to rewrite",
  "- Interview probability",
  "- Apply / Tailor / Skip",
].join("\n");

export function buildJobAnalysisPrompt(input: JobAnalysisPromptInput): JobAnalysisPrompt {
  return {
    systemInstruction: SYSTEM_INSTRUCTION,
    input:
      `# Candidate Career History\n\n${input.careerHistory}\n\n` +
      `# Job Description\n\n${input.jobDescription}`,
  };
}
