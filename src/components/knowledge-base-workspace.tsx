"use client";

import { useState } from "react";
import { KnowledgeBaseImportPanel } from "@/components/knowledge-base-import-panel";
import { KnowledgeBaseEditor } from "@/components/knowledge-base-editor";
import type { CareerKnowledgeBase } from "@/types/careerKnowledgeBase";

/**
 * Owns the "which knowledge base draft is the editor showing" state so an
 * AI import can hand its result to the editor without the editor needing to
 * know imports exist. Remounting the (uncontrolled) editor via `key` on
 * import is simpler than lifting its whole text/JSON-parsing state up here.
 */
export function KnowledgeBaseWorkspace({ initialData }: { initialData: CareerKnowledgeBase }) {
  const [data, setData] = useState(initialData);
  const [editorKey, setEditorKey] = useState(0);

  function handleImported(knowledgeBase: CareerKnowledgeBase) {
    setData(knowledgeBase);
    setEditorKey((key) => key + 1);
  }

  return (
    <div className="flex flex-col gap-4">
      <KnowledgeBaseImportPanel onImported={handleImported} />
      <KnowledgeBaseEditor key={editorKey} initialData={data} />
    </div>
  );
}
