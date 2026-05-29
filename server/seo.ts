import fs from "fs";
import path from "path";
import type { Express, NextFunction, Request, Response } from "express";
import { getPublishedArticles, getAllCategories, getArticleBySlug } from "./db";

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
}): string {
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

  const jsonLd = JSON.stringify({
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
  }).replace(/</g, "\\u003c");

  return `
    <!-- ── Server-rendered social preview meta ─────────────────────────────── -->
    <title>${escapedFullTitle}</title>
    <meta name="description" content="${escapedDescription}" />
    <meta name="author" content="${escapedAuthor}" />
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
    <meta name="theme-color" content="#2B037D" />

    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />
    <meta property="og:title" content="${escapedTitle}" />
    <meta property="og:description" content="${escapedDescription}" />
    <meta property="og:url" content="${escapedCanonicalUrl}" />
    <meta property="og:locale" content="es_ES" />${imageTags}${articleDateTags}

    <meta name="twitter:card" content="${escapedImageUrl ? "summary_large_image" : "summary"}" />
    <meta name="twitter:title" content="${escapedTitle}" />
    <meta name="twitter:description" content="${escapedDescription}" />

    <link rel="canonical" href="${escapedCanonicalUrl}" />
    <script type="application/ld+json">${jsonLd}</script>`;
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
      if (!article || article.status !== "published") {
        return next();
      }

      const canonicalUrl = `${baseUrl}/articulo/${article.slug}`;
      const imageUrl = absoluteUrl(article.ogImage || article.featuredImage, baseUrl);
      const metaTags = renderArticleMetaTags({
        title: article.ogTitle || article.title || SITE_NAME,
        description: article.ogDescription || article.excerpt || DEFAULT_DESCRIPTION,
        canonicalUrl,
        imageUrl,
        publishedAt: article.publishedAt,
        updatedAt: article.updatedAt,
        authorName: article.authorName,
      });

      const template = await fs.promises.readFile(getIndexHtmlPath(), "utf-8");
      const html = injectMetaTags(template, metaTags);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=300");
      res.send(html);
    } catch (err) {
      console.error("[SEO] article social preview error:", err);
      next();
    }
  });

  // ── robots.txt ────────────────────────────────────────────────────────────
  app.get("/robots.txt", (req, res) => {
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Cache-Control", "public, max-age=86400"); // 1 day
    res.send(
      `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /*.json$

# Google AdSense verification
User-agent: Mediapartners-Google
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
`
    );
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
