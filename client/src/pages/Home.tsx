import { Link, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ArticleCard } from "@/components/ArticleCard";
import { AdSlot } from "@/components/AdSense";
import { ArrowRight, TrendingUp, AlertCircle, X } from "lucide-react";
import { useState } from "react";

const AUTH_ERRORS: Record<string, string> = {
  auth_failed: "El inicio de sesión falló. Revisa los logs del servidor (consola donde corre pnpm dev) para ver el error exacto.",
  google_not_configured: "❌ GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET no están configurados en el archivo .env",
  jwt_not_configured: "❌ JWT_SECRET no está configurado en el archivo .env",
  google_denied: "Cancelaste el inicio de sesión con Google.",
  no_user: "Error interno: no se pudo recuperar el usuario después de autenticar.",
  callback_error: "Error en el callback de OAuth. Revisa los logs del servidor.",
};

export default function Home() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const errorCode = params.get("error");
  const errorDetail = params.get("detail");
  const errorMessage = errorCode ? (AUTH_ERRORS[errorCode] ?? `Error desconocido: ${errorCode}`) : null;
  const [showError, setShowError] = useState(true);

  const { data: featuredArticle, isLoading: featuredLoading } = trpc.articles.featured.useQuery();
  const { data: articles, isLoading: articlesLoading } = trpc.articles.list.useQuery({ limit: 12 });
  const { data: categories } = trpc.categories.list.useQuery();

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
              <p className="text-xs mt-2" style={{ color: "#CC8888" }}>
                Abre la consola donde corre <code className="font-mono">pnpm dev</code> y busca las líneas que empiezan con <code className="font-mono">[GoogleAuth]</code> para ver el error exacto.
              </p>
            </div>
            <button onClick={() => setShowError(false)} style={{ color: "#FF4444" }}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* AdSense Header */}
      <div className="container py-3">
        <AdSlot slot="header" />
      </div>

      {/* Hero Section */}
      <section className="ca-gradient-hero py-12 md:py-20">
        <div className="container">
          <div className="max-w-3xl">
            <span className="ca-badge mb-4">Portal de Noticias</span>
            <h1 className="text-white font-bold text-4xl md:text-6xl leading-tight mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
              Curioso Ando
            </h1>
            <p className="text-lg md:text-xl mb-6" style={{ color: "#D0C0FF" }}>
              Datos raros, curiosos y sorprendentes. Noticias, entretenimiento, geek y tecnología en un solo lugar.
            </p>
            <div className="flex flex-wrap gap-3">
              {categories?.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/categoria/${cat.slug}`}
                  className="px-4 py-2 rounded-full text-sm font-medium no-underline transition-all"
                  style={{ background: "rgba(255,255,255,0.20)", color: "#FFFFFF", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.3)" }}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1">
        <div className="container py-10">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main content */}
            <div className="lg:col-span-3">

              {/* Featured Article */}
              {(featuredLoading || featuredArticle) && (
                <section className="mb-10">
                  <div className="flex items-center gap-2 mb-5">
                    <TrendingUp className="w-5 h-5" style={{ color: "#5B2C8F" }} />
                    <h2 className="font-bold text-xl" style={{ fontFamily: "Poppins, sans-serif", color: "#1A1A1A" }}>
                      Nota Destacada
                    </h2>
                  </div>
                  {featuredLoading ? (
                    <div className="rounded-xl animate-pulse" style={{ height: 420, backgroundColor: "#FFFFFF" }} />
                  ) : featuredArticle ? (
                    <ArticleCard {...featuredArticle} size="large" />
                  ) : null}
                </section>
              )}

              {/* Recent Articles Grid */}
              <section>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-bold text-xl" style={{ fontFamily: "Poppins, sans-serif", color: "#1A1A1A" }}>
                    Notas Recientes
                  </h2>
                  <Link href="/articulos" className="flex items-center gap-1 text-sm no-underline" style={{ color: "#7B4FB8" }}>
                    Ver todas <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                {articlesLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="rounded-xl animate-pulse" style={{ height: 280, backgroundColor: "#FFFFFF" }} />
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

              {/* Category Sections */}
              {categories?.map((cat) => {
                return <CategorySection key={cat.slug} categorySlug={cat.slug} categoryName={cat.name} />;
              })}
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-1">
              <div className="sticky top-24 flex flex-col gap-6">
                {/* AdSense Sidebar */}
                <AdSlot slot="sidebar" />

                {/* Categories Widget */}
                <div className="ca-card p-5">
                  <h3 className="font-bold text-base mb-4" style={{ fontFamily: "Poppins, sans-serif", color: "#1A1A1A" }}>
                    Categorías
                  </h3>
                  <div className="flex flex-col gap-2">
                    {categories?.map((cat) => (
                      <Link
                        key={cat.slug}
                        href={`/categoria/${cat.slug}`}
                        className="flex items-center justify-between px-3 py-2 rounded-lg no-underline transition-colors"
                        style={{ color: "#6B6B6B" }}
                      >
                        <span className="text-sm font-medium">{cat.name}</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    ))}
                  </div>
                </div>

                {/* About Widget */}
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

function CategorySection({ categorySlug, categoryName }: { categorySlug: string; categoryName: string }) {
  const { data: articles } = trpc.articles.list.useQuery({ categorySlug, limit: 3 });
  if (!articles || articles.length === 0) return null;
  return (
    <section className="mt-10">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 rounded-full" style={{ background: "linear-gradient(to bottom, #2B037D, #5B2C8F)" }} />
          <h2 className="font-bold text-xl" style={{ fontFamily: "Poppins, sans-serif", color: "#1A1A1A" }}>
            {categoryName}
          </h2>
        </div>
        <Link href={`/categoria/${categorySlug}`} className="flex items-center gap-1 text-sm no-underline" style={{ color: "#7B4FB8" }}>
          Ver más <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {articles.map((article) => (
          <ArticleCard key={article.id} {...article} />
        ))}
      </div>
    </section>
  );
}
