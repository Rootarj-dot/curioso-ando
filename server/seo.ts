import fs from "fs";
import path from "path";
import type { Express, NextFunction, Request, Response } from "express";
import { getPublishedArticles, getAllCategories, getArticleBySlug, isArticleCurrentlyPublished } from "./db";
import { excerptFromContent } from "@shared/excerpt";
import { categoryIntro } from "@shared/categories";
import { contentSegments, parseSources } from "@shared/articleHtml";
import { INDEXNOW_KEY } from "./indexNow";

const SITE_NAME = "Curioseando Ando";
const DEFAULT_DESCRIPTION = "Datos raros, curiosos y sorprendentes. Noticias, entretenimiento, geek y tecnología en un solo lugar.";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function absoluteUrl(value: string | null | undefined, baseUrl: string): string | undefined {
  if (!value) return undefined;
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return undefined;
  }
}

function getIndexHtmlPath(): string {
  if (process.env.NODE_ENV === "development") {
    return path.resolve(import.meta.dirname, "..", "client", "index.html");
  }
  return path.resolve(import.meta.dirname, "public", "index.html");
}

function renderArticleMetaTags(params: {
  title: string;
  description: string;
  canonicalUrl: string;
  imageUrl?: string;
  publishedAt?: Date | string | null;
  updatedAt?: Date | string | null;
  authorName?: string | null;
  /** "article" for stories, "website" for listings and static pages. */
  ogType?: "article" | "website";
  /** Overrides the robots directive; used to keep search results out of the index. */
  robots?: string;
}): string {
  const ogType = params.ogType ?? "article";
  const robots =
    params.robots ?? "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";
  const fullTitle = params.title.includes(SITE_NAME) ? params.title : `${params.title} | ${SITE_NAME}`;
  const escapedTitle = escapeHtml(params.title);
  const escapedFullTitle = escapeHtml(fullTitle);
  const escapedDescription = escapeHtml(params.description || DEFAULT_DESCRIPTION);
  const escapedCanonicalUrl = escapeHtml(params.canonicalUrl);
  const escapedAuthor = escapeHtml(params.authorName || SITE_NAME);
  const escapedImageUrl = params.imageUrl ? escapeHtml(params.imageUrl) : undefined;
  const publishedAt = params.publishedAt ? new Date(params.publishedAt).toISOString() : undefined;
  const updatedAt = params.updatedAt ? new Date(params.updatedAt).toISOString() : publishedAt;

  const imageTags = escapedImageUrl
    ? `
    <meta property="og:image" content="${escapedImageUrl}" />
    <meta property="og:image:secure_url" content="${escapedImageUrl}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapedTitle}" />
    <meta name="twitter:image" content="${escapedImageUrl}" />
    <meta name="twitter:image:alt" content="${escapedTitle}" />`
    : "";

  const articleDateTags = `${publishedAt ? `
    <meta property="article:published_time" content="${escapeHtml(publishedAt)}" />` : ""}${updatedAt ? `
    <meta property="article:modified_time" content="${escapeHtml(updatedAt)}" />` : ""}`;

  const jsonLd = JSON.stringify(
    ogType === "article"
      ? {
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          headline: params.title,
          description: params.description || DEFAULT_DESCRIPTION,
          image: params.imageUrl ? [params.imageUrl] : undefined,
          datePublished: publishedAt,
          dateModified: updatedAt,
          author: { "@type": "Person", name: params.authorName || SITE_NAME },
          publisher: { "@type": "Organization", name: SITE_NAME, url: new URL("/", params.canonicalUrl).toString() },
          mainEntityOfPage: { "@type": "WebPage", "@id": params.canonicalUrl },
        }
      : {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: params.title,
          description: params.description || DEFAULT_DESCRIPTION,
          url: params.canonicalUrl,
          isPartOf: { "@type": "WebSite", name: SITE_NAME, url: new URL("/", params.canonicalUrl).toString() },
        }
  ).replace(/</g, "\\u003c");

  return `
    <!-- ── Server-rendered social preview meta ─────────────────────────────── -->
    <title>${escapedFullTitle}</title>
    <meta name="description" content="${escapedDescription}" />
    <meta name="author" content="${escapedAuthor}" />
    <meta name="robots" content="${escapeHtml(robots)}" />
    <meta name="theme-color" content="#2B037D" />

    <meta property="og:type" content="${ogType}" />
    <meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />
    <meta property="og:title" content="${escapedTitle}" />
    <meta property="og:description" content="${escapedDescription}" />
    <meta property="og:url" content="${escapedCanonicalUrl}" />
    <meta property="og:locale" content="es_MX" />${imageTags}${articleDateTags}

    <meta name="twitter:card" content="${escapedImageUrl ? "summary_large_image" : "summary"}" />
    <meta name="twitter:title" content="${escapedTitle}" />
    <meta name="twitter:description" content="${escapedDescription}" />

    <link rel="canonical" href="${escapedCanonicalUrl}" />
    <script type="application/ld+json">${jsonLd}</script>`;
}

// ── Server-written body ──────────────────────────────────────────────────────
// The client mounts with createRoot, which replaces whatever is inside #root, so
// readers still get the React page. Crawlers and AI assistants that never run
// JavaScript get this instead of an empty div.

type ListedArticle = { title: string; slug: string; excerpt?: string | null };

function injectBody(template: string, bodyHtml: string): string {
  return template.replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`);
}

function prerenderShell(inner: string): string {
  return `<main class="ca-prerender" style="max-width:760px;margin:0 auto;padding:24px 16px">${inner}</main>`;
}

function articleListHtml(items: ListedArticle[]): string {
  if (items.length === 0) return "";
  const rows = items
    .map((a) => `<li><a href="/articulo/${escapeHtml(a.slug)}">${escapeHtml(a.title)}</a></li>`)
    .join("");
  return `<ul>${rows}</ul>`;
}

function formatDate(value: Date | string | null | undefined): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Mexico_City" });
}

function renderArticleBody(article: {
  title: string;
  content: string | null;
  fuentes: string | null;
  publishedAt: Date | string | null;
  authorName: string | null;
  categoryName: string | null;
  categorySlug: string | null;
}): string {
  const category =
    article.categorySlug && article.categoryName
      ? `<p><a href="/categoria/${escapeHtml(article.categorySlug)}">${escapeHtml(article.categoryName)}</a></p>`
      : "";
  const date = formatDate(article.publishedAt);
  const byline = `<p>Por ${escapeHtml(article.authorName || SITE_NAME)}${date ? ` · ${escapeHtml(date)}` : ""}</p>`;
  const body = contentSegments(article.content ?? "{}")
    .map((seg) => (seg.kind === "html" ? `<div class="article-content">${seg.html}</div>` : ""))
    .join("");

  const { sources, note } = parseSources(article.fuentes);
  let sourcesHtml = "";
  if (sources.length > 0 || note) {
    const items = sources
      .map((s) =>
        s.url
          ? `<li><a href="${escapeHtml(s.url)}" rel="noopener noreferrer nofollow">${escapeHtml(s.label)}</a></li>`
          : `<li>${escapeHtml(s.label)}</li>`
      )
      .join("");
    sourcesHtml = `<section><h2>${sources.length > 0 ? "Fuentes consultadas" : "Sobre esta historia"}</h2>${
      note ? `<p>${escapeHtml(note)}</p>` : ""
    }${items ? `<ol>${items}</ol>` : ""}</section>`;
  }

  return prerenderShell(`<article>${category}<h1>${escapeHtml(article.title)}</h1>${byline}${body}${sourcesHtml}</article>`);
}

function injectMetaTags(template: string, metaTags: string): string {
  const metaBlockPattern = /\s*<!-- ── Primary Meta Tags[\s\S]*?<!-- ── Canonical[\s\S]*?<link rel="canonical"[^>]*>\s*/;
  if (metaBlockPattern.test(template)) {
    return template.replace(metaBlockPattern, `\n${metaTags}\n`);
  }
  return template.replace("</head>", `${metaTags}\n  </head>`);
}

export function registerSeoRoutes(app: Express) {
  // ── Article social preview HTML ────────────────────────────────────────────
  app.get("/articulo/:slug", async (req: Request, res: Response, next: NextFunction) => {
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const slug = req.params.slug;

    try {
      const article = await getArticleBySlug(slug);
      if (!article || !isArticleCurrentlyPublished(article)) {
        return next();
      }

      const canonicalUrl = `${baseUrl}/articulo/${article.slug}`;
      const imageUrl = absoluteUrl(article.ogImage || article.featuredImage, baseUrl);
      const metaTags = renderArticleMetaTags({
        title: article.ogTitle || article.title || SITE_NAME,
        description:
          article.ogDescription ||
          article.excerpt ||
          excerptFromContent(article.content) ||
          DEFAULT_DESCRIPTION,
        canonicalUrl,
        imageUrl,
        publishedAt: article.publishedAt,
        updatedAt: article.updatedAt,
        authorName: article.authorName,
      });

      const template = await fs.promises.readFile(getIndexHtmlPath(), "utf-8");
      const html = injectBody(injectMetaTags(template, metaTags), renderArticleBody(article));
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=300");
      res.send(html);
    } catch (err) {
      console.error("[SEO] article social preview error:", err);
      next();
    }
  });

  // ── robots.txt ────────────────────────────────────────────────────────────
  // ── Home page ──────────────────────────────────────────────────────────────
  // The template's own meta tags already describe the home page; only the body
  // is added. Exact "/" only, so express.static keeps serving everything else.
  app.get("/", async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const [articles, categories] = await Promise.all([
        getPublishedArticles({ limit: 60 }),
        getAllCategories(),
      ]);
      const nav = categories
        .map((c) => `<li><a href="/categoria/${escapeHtml(c.slug)}">${escapeHtml(c.name)}</a></li>`)
        .join("");
      const body = prerenderShell(
        `<h1>${escapeHtml(SITE_NAME)}</h1><p>${escapeHtml(DEFAULT_DESCRIPTION)}</p>` +
          (nav ? `<nav><h2>Categorías</h2><ul>${nav}</ul></nav>` : "") +
          `<h2>Historias recientes</h2>${articleListHtml(articles)}` +
          `<p><a href="/acerca-de">Acerca de</a> · <a href="/contacto">Contacto</a></p>`
      );

      const template = await fs.promises.readFile(getIndexHtmlPath(), "utf-8");
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=300");
      res.send(injectBody(template, body));
    } catch (err) {
      console.error("[SEO] home page error:", err);
      next();
    }
  });

  // ── Category listings ──────────────────────────────────────────────────────
  // Without this the static template's canonical, which points at the home page,
  // would tell search engines every category is a duplicate of the home page.
  app.get("/categoria/:slug", async (req: Request, res: Response, next: NextFunction) => {
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    try {
      const categories = await getAllCategories();
      const category = categories.find((c) => c.slug === req.params.slug);
      if (!category) return next();

      const intro = categoryIntro(category.slug, category.name);
      const metaTags = renderArticleMetaTags({
        title: category.name,
        description: intro,
        canonicalUrl: `${baseUrl}/categoria/${category.slug}`,
        ogType: "website",
      });

      const articles = await getPublishedArticles({ categorySlug: category.slug, limit: 500 });
      const body = prerenderShell(
        `<h1>${escapeHtml(category.name)}</h1><p>${escapeHtml(intro)}</p>${articleListHtml(articles)}`
      );

      const template = await fs.promises.readFile(getIndexHtmlPath(), "utf-8");
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=300");
      res.send(injectBody(injectMetaTags(template, metaTags), body));
    } catch (err) {
      console.error("[SEO] category preview error:", err);
      next();
    }
  });

  // ── Static pages ───────────────────────────────────────────────────────────
  const STATIC_PAGES: Record<string, { title: string; description: string }> = {
    "/aviso-de-privacidad": {
      title: "Aviso de privacidad",
      description: `Cómo trata ${SITE_NAME} los datos de quienes visitan el sitio.`,
    },
    "/terminos-y-condiciones": {
      title: "Términos y condiciones",
      description: `Condiciones de uso del sitio ${SITE_NAME}.`,
    },
    "/acerca-de": {
      title: "Acerca de",
      description: `Quién está detrás de ${SITE_NAME}, por qué existe y cómo se eligen y verifican las historias que se publican.`,
    },
    "/contacto": {
      title: "Contacto",
      description: `Escríbenos: dudas, sugerencias y colaboraciones con ${SITE_NAME}.`,
    },
  };

  for (const [route, meta] of Object.entries(STATIC_PAGES)) {
    app.get(route, async (req: Request, res: Response, next: NextFunction) => {
      try {
        const baseUrl = `${req.protocol}://${req.get("host")}`;
        const metaTags = renderArticleMetaTags({
          title: meta.title,
          description: meta.description,
          canonicalUrl: `${baseUrl}${route}`,
          ogType: "website",
        });
        const template = await fs.promises.readFile(getIndexHtmlPath(), "utf-8");
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.setHeader("Cache-Control", "public, max-age=300");
        res.send(injectMetaTags(template, metaTags));
      } catch (err) {
        console.error(`[SEO] static page error for ${route}:`, err);
        next();
      }
    });
  }

  // ── Internal search ────────────────────────────────────────────────────────
  // Search results are thin and endless: every ?q= is a different URL. robots.txt
  // keeps crawlers out; this handler stops the page from inheriting the home
  // page's title and canonical for anything that walks in anyway.
  app.get("/buscar", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const metaTags = renderArticleMetaTags({
        title: "Buscar",
        description: `Busca entre las historias y datos curiosos publicados en ${SITE_NAME}.`,
        canonicalUrl: `${baseUrl}/buscar`,
        ogType: "website",
        robots: "noindex, follow",
      });
      const template = await fs.promises.readFile(getIndexHtmlPath(), "utf-8");
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("X-Robots-Tag", "noindex, follow");
      res.setHeader("Cache-Control", "public, max-age=300");
      res.send(injectMetaTags(template, metaTags));
    } catch (err) {
      console.error("[SEO] search page error:", err);
      next();
    }
  });

  app.get("/robots.txt", (req, res) => {
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Cache-Control", "public, max-age=86400"); // 1 day
    res.send(
      `# Politica de IA: citar si, entrenar no.
# Los buscadores y asistentes que citan la fuente (Googlebot, Bingbot,
# ChatGPT-User, OAI-SearchBot, PerplexityBot, ClaudeBot, Applebot) pueden leer
# el sitio; los rastreadores que solo recogen texto para entrenar modelos, no.

User-agent: *
Content-Signal: search=yes, ai-input=yes, ai-train=no
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /*.json$
Disallow: /buscar

# Google AdSense verification
User-agent: Mediapartners-Google
Allow: /

# Entrenamiento de modelos de IA
User-agent: GPTBot
User-agent: CCBot
User-agent: Bytespider
User-agent: Google-Extended
User-agent: Applebot-Extended
Disallow: /

# Rastreadores de herramientas SEO
User-agent: AhrefsBot
User-agent: SemrushBot
User-agent: MJ12bot
User-agent: DotBot
Disallow: /

Sitemap: ${baseUrl}/sitemap.xml
`
    );
  });

  // ── IndexNow key ──────────────────────────────────────────────────────────
  app.get(`/${INDEXNOW_KEY}.txt`, (_req, res) => {
    res.type("text/plain").send(INDEXNOW_KEY);
  });

  // ── llms.txt ──────────────────────────────────────────────────────────────
  // A plain-text map of the site for AI assistants (https://llmstxt.org).
  app.get("/llms.txt", async (req, res) => {
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    try {
      const [articles, categories] = await Promise.all([
        getPublishedArticles({ limit: 1000 }),
        getAllCategories(),
      ]);

      const line = (title: string, url: string, note?: string | null) =>
        `- [${title.replace(/[\[\]]/g, "")}](${url})${note ? `: ${note.replace(/\s+/g, " ").trim()}` : ""}`;

      const sections = categories
        .map((c) => {
          const items = articles.filter((a) => a.categorySlug === c.slug);
          if (items.length === 0) return "";
          return [
            `## ${c.name}`,
            "",
            categoryIntro(c.slug, c.name),
            "",
            line(`Todas las historias de ${c.name}`, `${baseUrl}/categoria/${c.slug}`),
            ...items.map((a) => line(a.title, `${baseUrl}/articulo/${a.slug}`, a.excerpt)),
          ].join("\n");
        })
        .filter(Boolean);

      const body = [
        `# ${SITE_NAME}`,
        "",
        `> ${DEFAULT_DESCRIPTION}`,
        "",
        "Historias y datos curiosos en español, escritos y revisados por Alberto S. Cada nota lista sus fuentes al final. Se puede citar con enlace a la nota original; no se autoriza su uso para entrenar modelos de IA.",
        "",
        "## Sobre el sitio",
        "",
        line("Acerca de", `${baseUrl}/acerca-de`, "quién escribe, cómo se eligen y verifican las historias"),
        line("Contacto", `${baseUrl}/contacto`),
        "",
        ...sections.flatMap((s) => [s, ""]),
      ].join("\n");

      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.send(body);
    } catch (err) {
      console.error("[SEO] llms.txt error:", err);
      res.status(500).send("Error generating llms.txt");
    }
  });

  // ── sitemap.xml ───────────────────────────────────────────────────────────
  app.get("/sitemap.xml", async (req, res) => {
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    try {
      const [articles, categories] = await Promise.all([
        getPublishedArticles({ limit: 1000 }),
        getAllCategories(),
      ]);

      const today = new Date().toISOString().split("T")[0];

      const staticPages = [
        { url: "/", priority: "1.0", changefreq: "daily", lastmod: today },
        { url: "/acerca-de", priority: "0.6", changefreq: "monthly", lastmod: today },
        { url: "/contacto", priority: "0.4", changefreq: "yearly", lastmod: today },
        { url: "/aviso-de-privacidad", priority: "0.3", changefreq: "yearly", lastmod: today },
        { url: "/terminos-y-condiciones", priority: "0.3", changefreq: "yearly", lastmod: today },
      ];

      // Dynamic category pages
      const categoryUrls = categories.map((c) => ({
        url: `/categoria/${c.slug}`,
        priority: "0.8",
        changefreq: "daily",
        lastmod: today,
      }));

      // Article pages — higher priority for recent articles
      const now = Date.now();
      const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
      const ONE_MONTH = 30 * 24 * 60 * 60 * 1000;

      const articleUrls = articles.map((a) => {
        const pubTs = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const age = now - pubTs;
        const priority = age < ONE_WEEK ? "0.9" : age < ONE_MONTH ? "0.8" : "0.7";
        const changefreq = age < ONE_WEEK ? "daily" : age < ONE_MONTH ? "weekly" : "monthly";
        const lastmod = a.publishedAt
          ? new Date(a.publishedAt).toISOString().split("T")[0]
          : today;
        return { url: `/articulo/${a.slug}`, lastmod, priority, changefreq };
      });

      const allUrls = [...staticPages, ...categoryUrls, ...articleUrls];

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${allUrls
  .map(
    (p) => `  <url>
    <loc>${baseUrl}${p.url}</loc>
    <lastmod>${p.lastmod}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

      res.setHeader("Content-Type", "application/xml; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=3600"); // 1 hour
      res.send(xml);
    } catch (err) {
      console.error("[SEO] sitemap error:", err);
      res.status(500).send("Error generating sitemap");
    }
  });

  // ── Google AdSense site verification ─────────────────────────────────────
  // Uncomment and replace with your actual verification file content from AdSense
  // app.get("/googlepublishingverification.html", (req, res) => {
  //   res.send("google-site-verification: googleXXXXXXXXXXXXXXXX.html");
  // });
}
