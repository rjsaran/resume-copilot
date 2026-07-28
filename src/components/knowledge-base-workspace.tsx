"use client";

import { useState } from "react";
import { Download, ExternalLink } from "lucide-react";
import { KnowledgeBaseImportPanel } from "@/components/knowledge-base-import-panel";
import { KnowledgeBaseEditor } from "@/components/knowledge-base-editor";
import { Button } from "@/components/ui/button";
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
      <div className="flex flex-wrap items-center gap-2">
        <KnowledgeBaseImportPanel onImported={handleImported} />
        <Button
          variant="outline"
          render={
            <a href="/knowledge-base/resume/preview" target="_blank" rel="noopener noreferrer" />
          }
        >
          <ExternalLink className="size-4" />
          Preview master resume
        </Button>
        <Button
          variant="outline"
          onClick={() => window.open("/api/resume/knowledge-base/pdf", "_blank")}
        >
          <Download className="size-4" />
          Download master resume
        </Button>
      </div>
      <KnowledgeBaseEditor key={editorKey} initialData={data} />
    </div>
  );
}
