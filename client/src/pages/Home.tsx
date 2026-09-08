import { Link, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ArticleCard } from "@/components/ArticleCard";
import { AlertCircle, X, TrendingUp, ArrowRight, CalendarDays, Sparkles, Compass } from "lucide-react";
import { useState } from "react";
import { useSeoMeta } from "@/hooks/useSeoMeta";

const AUTH_ERRORS: Record<string, string> = {
  auth_failed: "El inicio de sesión falló. Revisa los registros del servidor para obtener el detalle.",
  google_not_configured: "Google OAuth no está configurado en el entorno.",
  jwt_not_configured: "La firma de sesión no está configurada en el entorno.",
  google_denied: "Cancelaste el inicio de sesión con Google.",
  no_user: "No se pudo recuperar el usuario después de autenticar.",
  callback_error: "Ocurrió un error al completar el inicio de sesión.",
};

const DEFAULT_BANNER_SUBTITLE = "Datos raros, curiosos y sorprendentes. Noticias, entretenimiento, geek y tecnología en un solo lugar.";

function formatDate(ts: number | string | Date | null | undefined) {
  if (!ts) return "";
  return new Date(ts as number).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
}

export default function Home() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const errorCode = params.get("error");
  const errorDetail = params.get("detail");
  const errorMessage = errorCode ? (AUTH_ERRORS[errorCode] ?? `Error desconocido: ${errorCode}`) : null;
  const [showError, setShowError] = useState(true);

  const { data: featuredArticle } = trpc.articles.featured.useQuery();
  const { data: articles, isLoading: articlesLoading } = trpc.articles.list.useQuery({ limit: 12 });
  const { data: bannerConfig } = trpc.siteConfig.getBanner.useQuery();
  const { data: categories } = trpc.categories.list.useQuery(undefined, { staleTime: 60_000 });

  const featuredImg = featuredArticle?.ogImage || featuredArticle?.featuredImage || "";
  const hasFeaturedArticle = Boolean(featuredArticle);
  const fallbackTitle = bannerConfig?.title || "Descubre lo que nadie te cuenta.";
  const fallbackSubtitle = bannerConfig?.subtitle || DEFAULT_BANNER_SUBTITLE;
  const fallbackBackground = bannerConfig?.bgColor || "linear-gradient(118deg, #09070d 0%, #1a0e33 50%, #32126a 100%)";
  const heroCards = articles?.slice(0, 5) ?? [];
  const moreArticles = articles?.slice(5) ?? [];

  useSeoMeta({
    title: "Curioseando Ando - Historias que te cambian",
    description: DEFAULT_BANNER_SUBTITLE,
    url: window.location.origin,
    type: "website",
  });

  return (
    <div className="ca-public-shell ca-reference-home min-h-screen flex flex-col">
      <Navbar />

      {errorMessage && showError && (
        <div className="ca-alert-wrap" role="alert">
          <div className="ca-auth-alert">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" aria-hidden="true" />
            <div className="flex-1">
              <p className="font-semibold text-sm">Error de inicio de sesión</p>
              <p className="text-sm mt-0.5">{errorMessage}</p>
              {errorDetail && <p className="text-xs mt-1 font-mono">Detalle: {errorDetail}</p>}
            </div>
            <button onClick={() => setShowError(false)} aria-label="Cerrar mensaje de error"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      <main className="flex-1">
        <section className="ca-reference-hero">
          <div className="ca-mobile-home-legacy">
            <section className="relative overflow-hidden" style={{ minHeight: "clamp(280px, 50vw, 480px)" }}>
              {hasFeaturedArticle && featuredImg ? (
                <img src={featuredImg} alt="" width={1792} height={1024} loading="eager" decoding="async" fetchPriority="high" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <div className="absolute inset-0" style={{ background: fallbackBackground }} />
              )}
              <div className="absolute inset-0" style={{ background: hasFeaturedArticle && featuredImg ? "linear-gradient(to top, rgba(10,0,30,0.92) 0%, rgba(10,0,30,0.55) 50%, rgba(10,0,30,0.25) 100%)" : "linear-gradient(to top, rgba(10,0,30,0.7) 0%, rgba(10,0,30,0.2) 100%)" }} />
              <div className="relative container flex flex-col justify-end" style={{ minHeight: "clamp(280px, 50vw, 480px)", paddingBottom: "clamp(1.5rem, 4vw, 3rem)", paddingTop: "clamp(1.5rem, 4vw, 3rem)" }}>
                <div className="max-w-2xl">
                  {hasFeaturedArticle && featuredArticle ? (
                    <>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider" style={{ background: "linear-gradient(135deg, #7C3AED, #5B2C8F)", color: "#FFFFFF" }}><TrendingUp className="w-3 h-3" /> Nota de la Semana</span>
                        {featuredArticle.categoryName && <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider" style={{ background: "rgba(255,255,255,0.18)", color: "#FFFFFF", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.25)" }}>{featuredArticle.categoryName}</span>}
                      </div>
                      <Link href={`/articulo/${featuredArticle.slug}`} className="no-underline group"><h1 className="font-bold leading-tight mb-3 group-hover:opacity-90 transition-opacity" style={{ fontFamily: "Poppins, sans-serif", color: "#FFFFFF", fontSize: "clamp(1.75rem, 4vw, 2.75rem)" }}>{featuredArticle.title}</h1></Link>
                      {featuredArticle.excerpt && <p className="text-base mb-4 line-clamp-2" style={{ color: "rgba(255,255,255,0.82)" }}>{featuredArticle.excerpt}</p>}
                      <div className="flex flex-wrap items-center gap-4">
                        {featuredArticle.publishedAt && <span className="flex items-center gap-1 text-sm" style={{ color: "rgba(255,255,255,0.65)" }}><CalendarDays className="w-3.5 h-3.5" />{formatDate(featuredArticle.publishedAt)}</span>}
                        <Link href={`/articulo/${featuredArticle.slug}`} className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold no-underline transition-all hover:opacity-90" style={{ background: "linear-gradient(135deg, #7C3AED, #5B2C8F)", color: "#FFFFFF" }}>Leer nota <ArrowRight className="w-4 h-4" /></Link>
                      </div>
                    </>
                  ) : (
                    <><span className="ca-badge mb-4">Portal de Noticias</span><h1 className="text-white font-bold text-4xl md:text-5xl leading-tight mb-3" style={{ fontFamily: "Poppins, sans-serif" }}>{fallbackTitle}</h1><p className="text-base md:text-lg" style={{ color: "#D0C0FF" }}>{fallbackSubtitle}</p></>
                  )}
                </div>
              </div>
            </section>
            <section className="py-6" style={{ backgroundColor: "#F8F7F4" }}>
              <div className="container">
                <div className="flex items-center gap-2 mb-4"><Sparkles className="w-5 h-5" style={{ color: "#5B2C8F" }} /><h2 className="font-bold text-xl" style={{ fontFamily: "Poppins, sans-serif", color: "#1A1A1A" }}>Notas Recientes</h2></div>
                {articlesLoading ? (
                  <div className="grid grid-cols-1 gap-5 justify-items-center">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="w-full max-w-sm rounded-xl animate-pulse" style={{ height: 280, backgroundColor: "#E5E3DE" }} />)}</div>
                ) : articles && articles.length > 0 ? (
                  <div className="grid grid-cols-1 gap-5 justify-items-center">{articles.map((article) => <div key={article.id} className="w-full max-w-sm"><ArticleCard {...article} size="legacyMobile" /></div>)}</div>
                ) : <div className="rounded-xl p-12 text-center" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E3DE" }}><p className="text-lg font-semibold mb-2" style={{ color: "#1A1A1A" }}>Próximamente</p><p style={{ color: "#6B6B6B" }}>Los artículos aparecerán aquí una vez publicados.</p></div>}
              </div>
            </section>
          </div>
          <div className="ca-desktop-home-redesign">
          {hasFeaturedArticle && featuredImg ? (
            <img src={featuredImg} alt="" width={1792} height={1024} loading="eager" decoding="async" fetchPriority="high" className="ca-reference-hero__image" />
          ) : (
            <div className="ca-reference-hero__fallback" style={{ background: fallbackBackground }} />
          )}
          <div className="ca-reference-hero__overlay" />
          <div className="ca-reference-hero__stars" aria-hidden="true" />

          <div className="container ca-reference-hero__inner">
            <div className="ca-reference-hero__copy">
              {hasFeaturedArticle && featuredArticle ? (
                <>
                  <div className="ca-reference-hero__labels">
                    <span className="ca-reference-kicker"><TrendingUp className="w-3.5 h-3.5" aria-hidden="true" /> Historia de la semana</span>
                    {featuredArticle.categoryName && <span className="ca-reference-category">{featuredArticle.categoryName}</span>}
                  </div>
                  <Link href={`/articulo/${featuredArticle.slug}`} className="no-underline group">
                    <h1 className="ca-reference-hero__title group-hover:opacity-90">{featuredArticle.title}</h1>
                  </Link>
                  <p className="ca-reference-hero__intro">{featuredArticle.excerpt || "Historias reales, misterios increíbles y datos curiosos que expanden tu mente."}</p>
                  <div className="ca-reference-hero__actions">
                    <Link href={`/articulo/${featuredArticle.slug}`} className="ca-reference-hero__cta">
                      Explorar historias <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </Link>
                    {featuredArticle.publishedAt && <span className="ca-reference-hero__date"><CalendarDays className="w-4 h-4" aria-hidden="true" /> {formatDate(featuredArticle.publishedAt)}</span>}
                  </div>
                </>
              ) : (
                <>
                  <span className="ca-reference-kicker"><Sparkles className="w-3.5 h-3.5" aria-hidden="true" /> Historias que te cambian</span>
                  <h1 className="ca-reference-hero__title mt-5">{fallbackTitle}</h1>
                  <p className="ca-reference-hero__intro">{fallbackSubtitle}</p>
                </>
              )}
            </div>

            {articlesLoading ? (
              <div className="ca-reference-rail" aria-label="Cargando artículos">
                {Array.from({ length: 5 }).map((_, index) => <div key={index} className="ca-reference-rail__skeleton animate-pulse" />)}
              </div>
            ) : heroCards.length > 0 ? (
              <div className="ca-reference-rail" aria-label="Notas recientes">
                {heroCards.map((article) => <ArticleCard key={article.id} {...article} size="compact" />)}
              </div>
            ) : null}
          </div>
          </div>
        </section>

        <section className="ca-category-dock ca-desktop-home-redesign" aria-label="Explora por categoría">
          <div className="container ca-category-dock__inner">
            {(categories ?? []).map((category) => (
              <Link key={category.slug} href={`/categoria/${category.slug}`} className="ca-category-dock__link">
                <Compass className="w-4 h-4" aria-hidden="true" />
                {category.name}
              </Link>
            ))}
          </div>
        </section>

        {moreArticles.length > 0 && (
          <section className="ca-stories-section ca-desktop-home-redesign">
            <div className="container">
              <div className="ca-section-heading">
                <div>
                  <span className="ca-section-kicker"><Sparkles className="w-3.5 h-3.5" aria-hidden="true" /> Sigue explorando</span>
                  <h2>Más historias para descubrir</h2>
                </div>
                <p>Un vistazo a lo más reciente de Curioseando Ando.</p>
              </div>
              <div className="ca-story-grid">
                {moreArticles.map((article) => <ArticleCard key={article.id} {...article} />)}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
