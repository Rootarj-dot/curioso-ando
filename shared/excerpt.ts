/**
 * Builds a description from a story's own body.
 *
 * Most articles carry no excerpt, and without this every one of them falls back
 * to the site-wide description — which leaves search engines looking at a set of
 * pages that all describe themselves identically.
 */

const MAX_LENGTH = 155;

function collectText(node: unknown, out: string[]): void {
  if (!node || typeof node !== "object") return;
  const n = node as { type?: string; text?: string; children?: unknown[] };

  if (n.type === "text" && typeof n.text === "string") {
    out.push(n.text);
    return;
  }
  if (Array.isArray(n.children)) {
    for (const child of n.children) collectText(child, out);
    // Keep separate blocks from running into each other as one word.
    if (n.type === "paragraph" || n.type === "heading" || n.type === "quote") out.push(" ");
  }
}

/** Trim to a whole word, never mid-word, and only add the ellipsis if cut. */
function truncate(text: string, max = MAX_LENGTH): string {
  if (text.length <= max) return text;
  const clipped = text.slice(0, max);
  const lastSpace = clipped.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? clipped.slice(0, lastSpace) : clipped).trimEnd()}…`;
}

/**
 * Returns a one-line summary taken from Lexical content, or undefined when the
 * body holds no usable text.
 */
export function excerptFromContent(content: string | null | undefined): string | undefined {
  if (!content) return undefined;

  let text = "";
  try {
    const parsed = JSON.parse(content);
    const out: string[] = [];
    collectText(parsed?.root, out);
    text = out.join("");
  } catch {
    // Older rows hold raw HTML rather than Lexical JSON.
    text = String(content).replace(/<[^>]*>/g, " ");
  }

  text = text.replace(/\s+/g, " ").trim();
  if (text.length < 40) return undefined;
  return truncate(text);
}
