import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  // Normalizar solo la URL exacta del panel sin barra; /admin/ debe caer al SPA sin redirección.
  app.use((req, res, next) => {
    const originalUrl = req.originalUrl || req.url;
    if (originalUrl === "/admin" || originalUrl.startsWith("/admin?")) {
      const query = originalUrl.includes("?") ? originalUrl.slice(originalUrl.indexOf("?")) : "";
      res.redirect(302, `/admin/${query}`);
      return;
    }

    next();
  });

  app.use(
    express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith("index.html")) {
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
          res.setHeader("Pragma", "no-cache");
          res.setHeader("Expires", "0");
        }
      },
    })
  );

  // Routes the client can actually render. Valid /articulo/ and /categoria/
  // addresses are answered earlier by the SEO routes, so anything with those
  // prefixes that reaches this point does not exist.
  const CLIENT_ROUTES = new Set([
    "/",
    "/aviso-de-privacidad",
    "/terminos-y-condiciones",
    "/contacto",
  ]);

  // Fall through to index.html so the client can route, but answer 404 for
  // addresses that lead nowhere. Serving them as 200 made every mistyped URL
  // look like a real page to search engines.
  app.use("*", (req, res) => {
    const pathname = req.originalUrl.split("?")[0].replace(/\/+$/, "") || "/";
    const exists = CLIENT_ROUTES.has(pathname) || pathname.startsWith("/admin");

    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.status(exists ? 200 : 404);
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
