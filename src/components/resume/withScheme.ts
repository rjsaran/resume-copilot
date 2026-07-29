/** Adds a scheme so a bare "linkedin.com/in/x" still resolves as a real link. */
export function withScheme(url: string): string {
  return /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(url) ? url : `https://${url}`;
}
