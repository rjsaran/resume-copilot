import { extractText, getDocumentProxy } from "unpdf";

export class PdfTextExtractionError extends Error {}

const MAX_PDF_BYTES = 10 * 1024 * 1024;

/**
 * Extracts plain text from an uploaded resume PDF, for the knowledge base
 * import flow. Uses `unpdf` (a PDF.js build packaged for serverless/edge
 * runtimes, no native bindings) rather than `pdfjs-dist` directly, matching
 * this project's other serverless-runtime workaround
 * (@sparticuz/chromium in generateResumePdf.ts).
 */
export async function extractResumeTextFromPdf(fileBuffer: ArrayBuffer): Promise<string> {
  if (fileBuffer.byteLength === 0) {
    throw new PdfTextExtractionError("That PDF appears to be empty.");
  }
  if (fileBuffer.byteLength > MAX_PDF_BYTES) {
    throw new PdfTextExtractionError("That PDF is too large (max 10 MB).");
  }

  let text: string;
  try {
    const pdf = await getDocumentProxy(new Uint8Array(fileBuffer));
    const result = await extractText(pdf, { mergePages: true });
    text = result.text;
  } catch {
    throw new PdfTextExtractionError(
      "Could not read that PDF — it may be corrupt or password-protected."
    );
  }

  if (!text.trim()) {
    throw new PdfTextExtractionError(
      "No extractable text found in that PDF — it may be a scanned image rather than a text-based PDF."
    );
  }

  return text;
}
