import { Link, useSearch, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ArticleCard } from "@/components/ArticleCard";
import { ArrowRight, TrendingUp, Clock, AlertCircle, X, Search } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const AUTH_ERRORS: Record<string, string> = {
  auth_failed: "El inicio de sesión falló. Revisa los logs del servidor (consola donde corre pnpm dev) para ver el error exacto.",
  google_not_configured: "❌ GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET no están configurados en el archivo .env",
  jwt_not_configured: "❌ JWT_SECRET no está configurado en el archivo .env",
  google_denied: "Cancelaste el inicio de sesión con Google.",
  no_user: "Error interno: no se pudo recuperar el usuario después de autenticar.",
  callback_error: "Error en el callback de OAuth. Revisa los logs del servidor.",
};

function HeroSearch() {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { data: results, isFetching } = trpc.articles.search.useQuery(
    { q: query },
    { enabled: query.trim().length >= 2 }
  );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && query.trim()) {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-xl">
      <div
        className="flex items-center gap-2 px-4 py-3 rounded-xl"
        style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", backdropFilter: "blur(8px)" }}
      >
        <Search className="w-5 h-5 flex-shrink-0" style={{ color: "rgba(255,255,255,0.7)" }} />
        <input
          type="text"
          placeholder="Buscar artículos..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => query.trim().length >= 2 && setOpen(true)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-white/50"
          style={{ color: "#FFFFFF" }}
        />
        {query && (
          <button onClick={() => { setQuery(""); setOpen(false); }} style={{ color: "rgba(255,255,255,0.6)" }}>
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown results */}
      {open && query.trim().length >= 2 && (
        <div
          className="absolute top-full mt-2 w-full rounded-xl overflow-hidden z-50"
          style={{ background: "#FFFFFF", boxShadow: "0 8px 32px rgba(0,0,0,0.18)", border: "1px solid #E5E3DE" }}
        >
          {isFetching ? (
            <div className="p-4 text-sm text-center" style={{ color: "#9B9B9B" }}>Buscando...</div>
          ) : results && results.length > 0 ? (
            <ul>
              {results.map((r) => (
                <li key={r.id} style={{ borderBottom: "1px solid #F0EEE9" }}>
                  <Link
                    href={`/articulo/${r.slug}`}
                    onClick={() => { setOpen(false); setQuery(""); }}
                    className="flex items-center gap-3 px-4 py-3 no-underline hover:bg-gray-50 transition-colors"
                  >
                    {(r.ogImage || r.featuredImage) ? (
                      <img src={r.ogImage || r.featuredImage || ""} alt={r.title} className="w-12 h-9 object-cover rounded-lg flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-9 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #2B037D, #5B2C8F)" }}>
                        <span className="text-white text-xs font-bold">CA</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "#1A1A1A" }}>{r.title}</p>
                      {r.categoryName && (
                        <p className="text-xs mt-0.5" style={{ color: "#9B9B9B" }}>{r.categoryName}</p>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-sm text-center" style={{ color: "#9B9B9B" }}>
              No se encontraron artículos para "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
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

  const bannerTitle = bannerConfig?.title || "Curioso Ando";
  const bannerSubtitle = bannerConfig?.subtitle || "Datos raros, curiosos y sorprendentes. Noticias, entretenimiento, geek y tecnología en un solo lugar.";
  const bannerBg = bannerConfig?.bgColor || "";

  const heroStyle: React.CSSProperties = bannerBg
    ? { background: bannerBg }
    : {};

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

      {/* Hero Section */}
      <section className={bannerBg ? "" : "ca-gradient-hero"} style={{ ...heroStyle, paddingTop: "2.5rem", paddingBottom: "2.5rem" }}>
        <div className="container">
          <div className="max-w-3xl">
            <span className="ca-badge mb-4">Portal de Noticias</span>
            <h1 className="text-white font-bold text-4xl md:text-5xl leading-tight mb-3" style={{ fontFamily: "Poppins, sans-serif" }}>
              {bannerTitle}
            </h1>
            {bannerSubtitle && (
              <p className="text-base md:text-lg mb-6" style={{ color: "#D0C0FF" }}>
                {bannerSubtitle}
              </p>
            )}
            {/* Search bar */}
            <HeroSearch />
          </div>
        </div>
      </section>

      <main className="flex-1">
        <div className="container py-10">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

            {/* Main content — single panel */}
            <div className="lg:col-span-3 space-y-10">

              {/* ── Nota de la Semana ─────────────────────────────────── */}
              {(featuredLoading || featuredArticle) && (
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5" style={{ color: "#5B2C8F" }} />
                    <h2 className="font-bold text-xl" style={{ fontFamily: "Poppins, sans-serif", color: "#1A1A1A" }}>
                      Nota de la Semana
                    </h2>
                  </div>
                  {featuredLoading ? (
                    <div className="rounded-2xl animate-pulse" style={{ height: 460, backgroundColor: "#E5E3DE" }} />
                  ) : featuredArticle ? (
                    <ArticleCard {...featuredArticle} size="large" />
                  ) : null}
                </section>
              )}

              {/* ── Notas Recientes ───────────────────────────────────── */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" style={{ color: "#5B2C8F" }} />
                    <h2 className="font-bold text-xl" style={{ fontFamily: "Poppins, sans-serif", color: "#1A1A1A" }}>
                      Notas Recientes
                    </h2>
                  </div>
                </div>

                {articlesLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="rounded-xl animate-pulse" style={{ height: 280, backgroundColor: "#E5E3DE" }} />
                    ))}
                  </div>
                ) : articles && articles.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {articles.map((article) => (
                      <ArticleCard key={article.id} {...article} />
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

            {/* Sidebar */}
            <aside className="lg:col-span-1">
              <div className="sticky top-24 flex flex-col gap-6">
                <div className="ca-card p-5">
                  <h3 className="font-bold text-base mb-3" style={{ fontFamily: "Poppins, sans-serif", color: "#1A1A1A" }}>
                    Sobre Curioso Ando
                  </h3>
                  <p className="text-sm" style={{ color: "#6B6B6B" }}>
                    Datos raros, curiosos y sorprendentes en un scroll. Aprende, ríe y di "¡no lo sabía!".
                  </p>
                </div>
              </div>
            </aside>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
