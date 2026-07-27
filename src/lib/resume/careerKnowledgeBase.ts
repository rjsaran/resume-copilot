import { readFile } from "fs/promises";
import path from "path";
import { isCareerKnowledgeBase, type CareerKnowledgeBase } from "@/types/careerKnowledgeBase";

const KNOWLEDGE_BASE_PATH = path.join(process.cwd(), "resume", "career_knowledge_base.json");

export class CareerKnowledgeBaseFileError extends Error {}

/**
 * Reads the repo's local resume/career_knowledge_base.json seed file. Only
 * used by the one-time "Import from file" action on the Knowledge Base page
 * to bootstrap a user's DB-backed knowledge base — the app's actual source
 * of truth at runtime is the per-user KnowledgeBase DB row (see
 * lib/repositories/knowledgeBaseRepository.ts), not this file.
 */
export async function getCareerKnowledgeBaseFromDisk(): Promise<CareerKnowledgeBase> {
  let raw: string;
  try {
    raw = await readFile(KNOWLEDGE_BASE_PATH, "utf-8");
  } catch {
    throw new CareerKnowledgeBaseFileError("Could not read resume/career_knowledge_base.json.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new CareerKnowledgeBaseFileError("resume/career_knowledge_base.json is not valid JSON.");
  }

  if (!isCareerKnowledgeBase(parsed)) {
    throw new CareerKnowledgeBaseFileError(
      "resume/career_knowledge_base.json did not match the expected schema."
    );
  }

  return parsed;
}
