import { Link, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ArticleCard } from "@/components/ArticleCard";
import { Clock, AlertCircle, X, TrendingUp, ArrowRight, Calendar } from "lucide-react";
import { useState } from "react";
import { useSeoMeta } from "@/hooks/useSeoMeta";

const AUTH_ERRORS: Record<string, string> = {
  auth_failed: "El inicio de sesión falló. Revisa los logs del servidor (consola donde corre pnpm dev) para ver el error exacto.",
  google_not_configured: "❌ GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET no están configurados en el archivo .env",
  jwt_not_configured: "❌ JWT_SECRET no está configurado en el archivo .env",
  google_denied: "Cancelaste el inicio de sesión con Google.",
  no_user: "Error interno: no se pudo recuperar el usuario después de autenticar.",
  callback_error: "Error en el callback de OAuth. Revisa los logs del servidor.",
};

function formatDate(ts: number | string | Date | null | undefined) {
  if (!ts) return "";
  return new Date(ts as number).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

export default function Home() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const errorCode = params.get("error");
  const errorDetail = params.get("detail");
  const errorMessage = errorCode ? (AUTH_ERRORS[errorCode] ?? `Error desconocido: ${errorCode}`) : null;
  const [showError, setShowError] = useState(true);

  const { data: featuredArticle, isLoading: featuredLoading } = trpc.articles.featured.useQuery();
  const { data: articles, isLoading: articlesLoading } = trpc.articles.list.useQuery({ limit: 12 });
  const { data: bannerConfig } = trpc.siteConfig.getBanner.useQuery();

  const bannerBg = bannerConfig?.bgColor || "";

  // Hero background: if featured article has image, use it as bg; else use banner color or default gradient
  const featuredImg = featuredArticle?.ogImage || featuredArticle?.featuredImage || "";

  // SEO meta tags for home page
  useSeoMeta({
    title: "Curioseando Ando - Blog de Noticias",
    description: "Datos raros, curiosos y sorprendentes. Noticias, entretenimiento, geek y tecnología en un solo lugar.",
    url: window.location.origin,
    type: "website",
  });

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F8F7F4" }}>
      <Navbar />

      {/* Banner de error de login */}
      {errorMessage && showError && (
        <div className="container py-2">
          <div
            className="flex items-start gap-3 p-4 rounded-lg"
            style={{ backgroundColor: "#3D0000", border: "1px solid #FF4444", color: "#FFAAAA" }}
          >
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" style={{ color: "#FF4444" }} />
            <div className="flex-1">
              <p className="font-semibold text-sm" style={{ color: "#FF6666" }}>Error de inicio de sesión</p>
              <p className="text-sm mt-0.5">{errorMessage}</p>
              {errorDetail && (
                <p className="text-xs mt-1 font-mono" style={{ color: "#FF8888" }}>Detalle: {errorDetail}</p>
              )}
            </div>
            <button onClick={() => setShowError(false)} style={{ color: "#FF4444" }}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Hero / Nota de la Semana ───────────────────────────────────── */}
      {featuredLoading ? (
        /* Skeleton mientras carga */
        <div className="animate-pulse" style={{ height: "clamp(280px, 50vw, 480px)", background: "linear-gradient(135deg, #2B037D, #5B2C8F)" }} />
      ) : featuredArticle ? (
        /* Hero con artículo destacado */
        <section
          className="relative overflow-hidden"
          style={{ minHeight: "clamp(280px, 50vw, 480px)" }}
        >
          {/* Imagen de fondo */}
          {featuredImg ? (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${featuredImg})` }}
            />
          ) : (
            <div
              className="absolute inset-0"
              style={bannerBg ? { background: bannerBg } : { background: "linear-gradient(135deg, #2B037D 0%, #5B2C8F 60%, #8B5CF6 100%)" }}
            />
          )}
          {/* Overlay oscuro para legibilidad */}
          <div
            className="absolute inset-0"
            style={{ background: featuredImg ? "linear-gradient(to top, rgba(10,0,30,0.92) 0%, rgba(10,0,30,0.55) 50%, rgba(10,0,30,0.25) 100%)" : "linear-gradient(to top, rgba(10,0,30,0.7) 0%, rgba(10,0,30,0.2) 100%)" }}
          />

          {/* Content */}
          <div className="relative container flex flex-col justify-end" style={{ minHeight: "clamp(280px, 50vw, 480px)", paddingBottom: "clamp(1.5rem, 4vw, 3rem)", paddingTop: "clamp(1.5rem, 4vw, 3rem)" }}>
            <div className="max-w-2xl">
              {/* Badge */}
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                  style={{ background: "linear-gradient(135deg, #7C3AED, #5B2C8F)", color: "#FFFFFF" }}
                >
                  <TrendingUp className="w-3 h-3" />
                  Nota de la Semana
                </span>
                {featuredArticle.categoryName && (
                  <span
                    className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider"
                    style={{ background: "rgba(255,255,255,0.18)", color: "#FFFFFF", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.25)" }}
                  >
                    {featuredArticle.categoryName}
                  </span>
                )}
              </div>

              {/* Title */}
              <Link href={`/articulo/${featuredArticle.slug}`} className="no-underline group">
                <h1
                  className="font-bold leading-tight mb-3 group-hover:opacity-90 transition-opacity"
                  style={{ fontFamily: "Poppins, sans-serif", color: "#FFFFFF", fontSize: "clamp(1.75rem, 4vw, 2.75rem)" }}
                >
                  {featuredArticle.title}
                </h1>
              </Link>

              {/* Excerpt */}
              {featuredArticle.excerpt && (
                <p
                  className="text-base mb-4 line-clamp-2"
                  style={{ color: "rgba(255,255,255,0.82)" }}
                >
                  {featuredArticle.excerpt}
                </p>
              )}

              {/* Meta + CTA */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3 text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
                  {featuredArticle.publishedAt && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(featuredArticle.publishedAt)}
                    </span>
                  )}
                </div>
                <Link
                  href={`/articulo/${featuredArticle.slug}`}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold no-underline transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #7C3AED, #5B2C8F)", color: "#FFFFFF" }}
                >
                  Leer nota <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : (
        /* Sin artículo destacado: banner simple */
        <section
          className={bannerBg ? "" : "ca-gradient-hero"}
          style={{ ...(bannerBg ? { background: bannerBg } : {}), paddingTop: "2.5rem", paddingBottom: "2.5rem" }}
        >
          <div className="container">
            <div className="max-w-3xl">
              <span className="ca-badge mb-4">Portal de Noticias</span>
              <h1 className="text-white font-bold text-4xl md:text-5xl leading-tight mb-3" style={{ fontFamily: "Poppins, sans-serif" }}>
                {bannerConfig?.title || "Curioseando Ando"}
              </h1>
              {bannerConfig?.subtitle && (
                <p className="text-base md:text-lg" style={{ color: "#D0C0FF" }}>
                  {bannerConfig.subtitle}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      <main className="flex-1">
        <div className="container py-6 md:py-10">
          <div className="max-w-7xl mx-auto">

            {/* Main content */}
            <div className="space-y-8">

              {/* ── Notas Recientes ───────────────────────────────────── */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5" style={{ color: "#5B2C8F" }} />
                  <h2 className="font-bold text-xl" style={{ fontFamily: "Poppins, sans-serif", color: "#1A1A1A" }}>
                    Notas Recientes
                  </h2>
                </div>

                {articlesLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 justify-items-center">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="w-full max-w-sm rounded-xl animate-pulse" style={{ height: 280, backgroundColor: "#E5E3DE" }} />
                    ))}
                  </div>
                ) : articles && articles.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 justify-items-center">
                    {articles.map((article) => (
                      <div key={article.id} className="w-full max-w-sm">
                        <ArticleCard {...article} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl p-12 text-center" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E3DE" }}>
                    <p className="text-lg font-semibold mb-2" style={{ color: "#1A1A1A" }}>Próximamente</p>
                    <p style={{ color: "#6B6B6B" }}>Los artículos aparecerán aquí una vez publicados.</p>
                  </div>
                )}
              </section>

            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
