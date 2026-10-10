/**
 * Turns a story's stored body and sources into HTML.
 *
 * Shared by the article page and the server: the server writes the same body
 * into the HTML it sends, because AI assistants and most crawlers never run the
 * JavaScript that would otherwise fill the page in.
 */

// ─── Lexical Content Renderer ─────────────────────────────────────────────────
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/"/g, "&quot;");
}

function renderImageNode(node: any): string {
  if (!node.src) return "";
  const src = escapeAttribute(String(node.src));
  const alt = escapeAttribute(String(node.altText || ""));
  return `<img src="${src}" alt="${alt}" />`;
}

function renderTextNode(node: any): string {
  let text = escapeHtml(node.text || "");
  if (node.format & 1) text = `<strong>${text}</strong>`;
  if (node.format & 2) text = `<em>${text}</em>`;
  if (node.format & 8) text = `<u>${text}</u>`;
  return text;
}

function renderInlineNodes(nodes: any[]): string {
  return (nodes || [])
    .map((n) => {
      if (n.type === "text") return renderTextNode(n);
      if (n.type === "image") return renderImageNode(n);
      if (n.type === "linebreak") return "<br/>";
      if (n.children) return renderInlineNodes(n.children);
      return "";
    })
    .join("");
}

export type ContentSegment =
  | { kind: "html"; html: string }
  | { kind: "articles-block"; blockType: "recent" | "recommended"; count: number };

// Splits Lexical root children into segments: either HTML strings or articles-block descriptors
export function splitContentSegments(nodes: any[]): ContentSegment[] {
  const segments: ContentSegment[] = [];

  let htmlBuffer = "";

  const flush = () => {
    if (htmlBuffer.trim()) {
      segments.push({ kind: "html", html: htmlBuffer });
      htmlBuffer = "";
    }
  };

  for (const node of nodes || []) {
    if (node.type === "articles-block") {
      flush();
      segments.push({
        kind: "articles-block",
        blockType: node.blockType as "recent" | "recommended",
        count: node.count || 3,
      });
    } else if (node.type === "paragraph") {
      htmlBuffer += `<p>${renderInlineNodes(node.children || [])}</p>`;
    } else if (node.type === "heading") {
      const tag = node.tag || "h2";
      htmlBuffer += `<${tag}>${renderInlineNodes(node.children || [])}</${tag}>`;
    } else if (node.type === "list") {
      const tag = node.listType === "number" ? "ol" : "ul";
      const items = (node.children || [])
        .map((li: any) => `<li>${renderInlineNodes(li.children || [])}</li>`)
        .join("");
      htmlBuffer += `<${tag}>${items}</${tag}>`;
    } else if (node.type === "quote") {
      htmlBuffer += `<blockquote>${renderInlineNodes(node.children || [])}</blockquote>`;
    } else if (node.type === "image") {
      htmlBuffer += renderImageNode(node);
    } else if (node.type === "linebreak") {
      htmlBuffer += "<br/>";
    } else if (node.children) {
      htmlBuffer += renderInlineNodes(node.children);
    }
  }

  flush();
  return segments;
}

/** Older rows hold raw HTML rather than Lexical JSON, so both shapes have to work. */
export function contentSegments(content: string): ContentSegment[] {
  try {
    const parsed = JSON.parse(content);
    if (parsed?.root?.children) return splitContentSegments(parsed.root.children);
    return [{ kind: "html", html: `<p>${content}</p>` }];
  } catch {
    return [{ kind: "html", html: content || "<p>Sin contenido</p>" }];
  }
}

// ─── Sources ──────────────────────────────────────────────────────────────────
// Stored as free text, one per line, optionally "Etiqueta | https://…".
export type Source = { label: string; url?: string };

export type SourceBlock = { sources: Source[]; note?: string };

export function parseSources(raw: string | null | undefined): SourceBlock {
  if (!raw) return { sources: [] };
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  // A line opening with "!" is an editorial note rather than a citation.
  // Folklore has no source to cite, and saying so plainly beats inventing one.
  const note = lines.find((l) => l.startsWith("!"))?.slice(1).trim();
  return { sources: parseSourceLines(lines.filter((l) => !l.startsWith("!"))), note };
}

function parseSourceLines(lines: string[]): Source[] {
  return lines
    .map((line) => {
      const piped = line.split("|").map((p) => p.trim());
      if (piped.length >= 2 && /^https?:\/\//i.test(piped[1])) {
        return { label: piped[0] || piped[1], url: piped[1] };
      }
      if (/^https?:\/\//i.test(line)) {
        try {
          return { label: new URL(line).hostname.replace(/^www\./, ""), url: line };
        } catch {
          return { label: line };
        }
      }
      return { label: line };
    });
}
