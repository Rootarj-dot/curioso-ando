import type { Express } from "express";
import { getPublishedArticles } from "./db";

export function registerSeoRoutes(app: Express) {
  // robots.txt
  app.get("/robots.txt", (req, res) => {
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    res.setHeader("Content-Type", "text/plain");
    res.send(`User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

Sitemap: ${baseUrl}/sitemap.xml
`);
  });

  // sitemap.xml
  app.get("/sitemap.xml", async (req, res) => {
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    try {
      const articles = await getPublishedArticles({ limit: 1000 });
      const staticPages = [
        { url: "/", priority: "1.0", changefreq: "daily" },
        { url: "/categoria/noticias", priority: "0.8", changefreq: "daily" },
        { url: "/categoria/entretenimiento", priority: "0.8", changefreq: "daily" },
        { url: "/categoria/geek", priority: "0.8", changefreq: "daily" },
        { url: "/categoria/tecnologia", priority: "0.8", changefreq: "daily" },
      ];

      const articleUrls = articles.map((a) => ({
        url: `/articulo/${a.slug}`,
        lastmod: a.publishedAt ? new Date(a.publishedAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        priority: "0.7",
        changefreq: "weekly",
      }));

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages
  .map(
    (p) => `  <url>
    <loc>${baseUrl}${p.url}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
  )
  .join("\n")}
${articleUrls
  .map(
    (a) => `  <url>
    <loc>${baseUrl}${a.url}</loc>
    <lastmod>${a.lastmod}</lastmod>
    <changefreq>${a.changefreq}</changefreq>
    <priority>${a.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

      res.setHeader("Content-Type", "application/xml");
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.send(xml);
    } catch (err) {
      console.error("[SEO] sitemap error:", err);
      res.status(500).send("Error generating sitemap");
    }
  });
}
