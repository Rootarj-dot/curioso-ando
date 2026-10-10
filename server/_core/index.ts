// Las variables de entorno se cargan via --env-file=.env en el script dev del package.json
// Esto garantiza que process.env esté disponible antes de cualquier import en ESM

import express from "express";
import { createServer } from "http";
import net from "net";
import compression from "compression";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { registerSeoRoutes } from "../seo";
import { setupGoogleAuth } from "../auth/googleAuth";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Gzip/Brotli compression for all responses
  app.use(compression());

  // Security & cache headers
  app.use((req, res, next) => {
    // Cache static assets aggressively (Vite adds content hashes)
    if (req.path.match(/\.(js|css|woff2?|ttf|eot|ico|png|jpg|jpeg|svg|webp|avif)(\?.*)?$/)) {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    }
    // Security headers
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    // Only device features the site never uses; AdSense's ad features stay untouched.
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
    next();
  });

  // Turn away AI-training and SEO-tool crawlers. robots.txt already asks them to
  // stay out; this enforces it for those that ignore it. Assistants that cite
  // the source (ChatGPT-User, OAI-SearchBot, PerplexityBot, ClaudeBot) and plain
  // Applebot are left alone on purpose. robots.txt stays readable so they can
  // see why.
  // Log every visit from search and AI crawlers. The host keeps no access log,
  // and this is the only way to tell whether a bot reached the app at all or
  // was stopped earlier by the CDN.
  const LOGGED_BOTS =
    /ChatGPT-User|OAI-SearchBot|GPTBot|PerplexityBot|Perplexity-User|ClaudeBot|Claude-User|Claude-SearchBot|Googlebot|Google-Extended|bingbot|Applebot|CCBot|Bytespider|meta-externalagent|DuckAssistBot/i;
  app.use((req, res, next) => {
    const ua = req.get("user-agent") || "";
    const bot = ua.match(LOGGED_BOTS)?.[0];
    if (bot) {
      res.on("finish", () => console.log(`[bot] ${bot} ${res.statusCode} ${req.originalUrl}`));
    }
    next();
  });

  const BLOCKED_BOTS =/GPTBot|CCBot|Bytespider|AhrefsBot|SemrushBot|MJ12bot|DotBot/i;
  app.use((req, res, next) => {
    if (req.path !== "/robots.txt" && BLOCKED_BOTS.test(req.get("user-agent") || "")) {
      // Never let a CDN cache this answer and hand it to readers.
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("Vary", "User-Agent");
      return res.status(403).type("text/plain").send("Forbidden");
    }
    next();
  });

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Trust proxy headers (needed for correct redirect_uri in Google OAuth behind Cloud Run / reverse proxies)
  app.set("trust proxy", true);

  // Serve the site from a single hostname. With www answering as well, search
  // engines saw two copies of every page.
  app.use((req, res, next) => {
    const host = req.get("host");
    if (host?.startsWith("www.")) {
      return res.redirect(301, `${req.protocol}://${host.slice(4)}${req.originalUrl}`);
    }
    next();
  });

  // Google OAuth 2.0
  setupGoogleAuth(app);

  // SEO routes (sitemap.xml, robots.txt)
  registerSeoRoutes(app);

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
