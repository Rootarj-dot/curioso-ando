import type { Express } from "express";
import { getPublishedArticles, getAllCategories } from "./db";

export function registerSeoRoutes(app: Express) {
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
