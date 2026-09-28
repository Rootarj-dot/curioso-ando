import { Link } from "wouter";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "./AdminLayout";
import { FileText, Image, Plus, Eye, Edit, TrendingUp, X, Check, Search, Palette, Save, CalendarClock } from "lucide-react";

function isScheduledArticle(article: { status: string; publishedAt?: Date | string | null }) {
  if (article.status !== "published" || !article.publishedAt) return false;
  const publishDate = new Date(article.publishedAt);
  return !Number.isNaN(publishDate.getTime()) && publishDate.getTime() > Date.now();
}

function getArticleStatusDisplay(article: { status: string; publishedAt?: Date | string | null }) {
  if (isScheduledArticle(article)) {
    return { label: "Programado", accent: "#5b2c8f", icon: <CalendarClock /> };
  }
  if (article.status === "published") {
    return { label: "Publicado", accent: "#15803d", icon: <Eye /> };
  }
  return { label: "Borrador", accent: "#b45309", icon: null };
}

export default function AdminDashboard() {
  const utils = trpc.useUtils();
  const { data: articles } = trpc.articles.adminList.useQuery();
  const { data: media } = trpc.media.list.useQuery();
  const { data: featuredArticle, isLoading: featuredLoading } = trpc.articles.featured.useQuery();

  const setFeaturedMutation = trpc.articles.setFeatured.useMutation({
    onSuccess: () => {
      utils.articles.featured.invalidate();
      utils.articles.adminList.invalidate();
      setPickerOpen(false);
      setSearch("");
    },
  });
  const clearFeaturedMutation = trpc.articles.clearFeatured.useMutation({
    onSuccess: () => {
      utils.articles.featured.invalidate();
      utils.articles.adminList.invalidate();
    },
  });

  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Banner config
  const { data: bannerConfig } = trpc.siteConfig.getBanner.useQuery();
  const setBannerMutation = trpc.siteConfig.setBanner.useMutation({
    onSuccess: () => {
      utils.siteConfig.getBanner.invalidate();
      setBannerSaved(true);
      setTimeout(() => setBannerSaved(false), 2000);
    },
  });
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerSubtitle, setBannerSubtitle] = useState("");
  const [bannerBg, setBannerBg] = useState("");
  const [bannerSaved, setBannerSaved] = useState(false);

  useEffect(() => {
    if (bannerConfig) {
      setBannerTitle(bannerConfig.title || "");
      setBannerSubtitle(bannerConfig.subtitle || "");
      setBannerBg(bannerConfig.bgColor || "");
    }
  }, [bannerConfig]);

  const actuallyPublished = articles?.filter((a) => a.status === "published" && !isScheduledArticle(a)) ?? [];
  const scheduled = articles?.filter(isScheduledArticle) ?? [];
  const drafts = articles?.filter((a) => a.status === "draft").length ?? 0;
  const total = articles?.length ?? 0;

  const filteredPublished = actuallyPublished.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="ca-adm-page">
        <div className="ca-adm-page__head">
          <h1>Resumen</h1>
          <p>Todo lo que pasa en Curioseando Ando, de un vistazo.</p>
        </div>

        <div className="ca-adm-stats">
          {[
            { label: "Artículos", value: total, icon: <FileText />, accent: "#2b037d" },
            { label: "Publicados", value: actuallyPublished.length, icon: <Eye />, accent: "#15803d" },
            { label: "Programados", value: scheduled.length, icon: <CalendarClock />, accent: "#5b2c8f" },
            { label: "Borradores", value: drafts, icon: <Edit />, accent: "#b45309" },
          ].map(({ label, value, icon, accent }) => (
            <div key={label} className="ca-adm-stat" style={{ ["--adm-accent" as string]: accent }}>
              <span className="ca-adm-stat__icon">{icon}</span>
              <span>
                <span className="ca-adm-stat__value">{value}</span>
                <span className="ca-adm-stat__label">{label}</span>
              </span>
            </div>
          ))}
        </div>

        {/* ── Nota de la semana ─────────────────────────────────────────────── */}
        <section className="ca-adm-card">
          <div className="ca-adm-card__head">
            <div>
              <h2 className="ca-adm-card__title"><TrendingUp />Nota de la semana</h2>
              <p className="ca-adm-card__hint">La que sale en grande en la portada.</p>
            </div>
            <div className="flex items-center gap-2">
              {featuredArticle && (
                <button
                  onClick={() => clearFeaturedMutation.mutate()}
                  disabled={clearFeaturedMutation.isPending}
                  className="ca-adm-btn ca-adm-btn--danger"
                >
                  <X />
                  Quitar
                </button>
              )}
              <button onClick={() => setPickerOpen(true)} className="ca-adm-btn ca-adm-btn--primary">
                <TrendingUp />
                {featuredArticle ? "Cambiar" : "Seleccionar"}
              </button>
            </div>
          </div>

          {featuredLoading ? (
            <div className="ca-adm-card__body">
              <div className="h-14 rounded-lg animate-pulse" style={{ background: "var(--adm-line-soft)" }} />
            </div>
          ) : featuredArticle ? (
            <div className="ca-adm-row">
              <span className="ca-adm-row__thumb">
                {(featuredArticle.ogImage || featuredArticle.featuredImage)
                  ? <img src={featuredArticle.ogImage || featuredArticle.featuredImage || ""} alt="" />
                  : "CA"}
              </span>
              <span className="ca-adm-row__body">
                <span className="ca-adm-row__title">{featuredArticle.title}</span>
                <span className="ca-adm-row__meta">
                  {featuredArticle.categoryName || "Sin categoría"}
                  {featuredArticle.publishedAt ? ` · ${new Date(featuredArticle.publishedAt).toLocaleDateString("es-MX")}` : ""}
                </span>
              </span>
              <span className="ca-adm-pill">Destacada</span>
            </div>
          ) : (
            <p className="ca-adm-empty">Ninguna nota destacada. Selecciona una para mostrarla en grande en la portada.</p>
          )}
        </section>

        {/* ── Banner de la portada ──────────────────────────────────────────── */}
        <section className="ca-adm-card">
          <div className="ca-adm-card__head">
            <div>
              <h2 className="ca-adm-card__title"><Palette />Banner de la portada</h2>
              <p className="ca-adm-card__hint">El texto y el fondo de la cabecera.</p>
            </div>
          </div>
          <div className="ca-adm-card__body">
            <div className="ca-adm-field">
              <label htmlFor="banner-title">Título principal</label>
              <input
                id="banner-title"
                type="text"
                value={bannerTitle}
                onChange={(e) => setBannerTitle(e.target.value)}
                placeholder="Curioseando Ando"
                className="ca-adm-input"
              />
            </div>
            <div className="ca-adm-field">
              <label htmlFor="banner-subtitle">Subtítulo</label>
              <textarea
                id="banner-subtitle"
                value={bannerSubtitle}
                onChange={(e) => setBannerSubtitle(e.target.value)}
                placeholder="Datos raros, curiosos y sorprendentes..."
                rows={2}
                className="ca-adm-input resize-none"
              />
            </div>
            <div className="ca-adm-field">
              <label htmlFor="banner-bg">Color o gradiente de fondo</label>
              <div className="flex items-center gap-2">
                <input
                  id="banner-bg"
                  type="text"
                  value={bannerBg}
                  onChange={(e) => setBannerBg(e.target.value)}
                  placeholder="Vacío usa el gradiente morado por defecto"
                  className="ca-adm-input font-mono"
                />
                {bannerBg && <span className="ca-adm-swatch" style={{ background: bannerBg }} />}
              </div>
              <p className="ca-adm-help">
                Ejemplos: <code>#2B037D</code> · <code>linear-gradient(135deg, #1a0050, #4a0080)</code>
              </p>
            </div>
            <button
              onClick={() => setBannerMutation.mutate({ title: bannerTitle, subtitle: bannerSubtitle, bgColor: bannerBg })}
              disabled={setBannerMutation.isPending || !bannerTitle.trim()}
              className={`ca-adm-btn ${bannerSaved ? "ca-adm-btn--ok" : "ca-adm-btn--primary"}`}
              style={{ marginTop: "0.3rem" }}
            >
              {bannerSaved ? <><Check /> Guardado</> : <><Save /> Guardar banner</>}
            </button>
          </div>
        </section>

        {/* ── Atajos ────────────────────────────────────────────────────────── */}
        <div className="ca-adm-tiles">
          <Link href="/admin/nuevo" className="ca-adm-tile">
            <span className="ca-adm-tile__icon"><Plus /></span>
            <span>
              <span className="ca-adm-tile__title">Nuevo artículo</span>
              <span className="ca-adm-tile__hint">Escribir y publicar</span>
            </span>
          </Link>
          <Link href="/admin/medios" className="ca-adm-tile">
            <span className="ca-adm-tile__icon"><Image /></span>
            <span>
              <span className="ca-adm-tile__title">Galería de medios</span>
              <span className="ca-adm-tile__hint">{media?.length ?? 0} imágenes subidas</span>
            </span>
          </Link>
        </div>

        {/* ── Artículos recientes ───────────────────────────────────────────── */}
        <section className="ca-adm-card">
          <div className="ca-adm-card__head">
            <h2 className="ca-adm-card__title"><FileText />Artículos recientes</h2>
            <Link href="/admin/articulos" className="ca-adm-btn ca-adm-btn--ghost">Ver todos</Link>
          </div>
          {!articles || articles.length === 0 ? (
            <p className="ca-adm-empty">Todavía no hay artículos.</p>
          ) : (
            articles.slice(0, 5).map((article) => {
              const status = getArticleStatusDisplay(article);
              return (
                <div key={article.id} className="ca-adm-row">
                  <span className="ca-adm-row__body">
                    <span className="ca-adm-row__title">{article.title}</span>
                    <span className="ca-adm-row__meta">
                      {article.categoryName || "Sin categoría"} · {new Date(article.createdAt).toLocaleDateString("es-MX")}
                    </span>
                  </span>
                  <span className="ca-adm-pill" style={{ ["--adm-accent" as string]: status.accent }}>
                    {status.icon}
                    {status.label}
                  </span>
                  <Link href={`/admin/editar/${article.id}`} className="ca-adm-row__icon" aria-label={`Editar ${article.title}`}>
                    <Edit className="w-4 h-4" />
                  </Link>
                </div>
              );
            })
          )}
        </section>
      </div>

      {/* ── Selector de nota destacada ──────────────────────────────────────── */}
      {pickerOpen && (
        <div
          className="ca-adm-modal"
          onClick={(e) => { if (e.target === e.currentTarget) { setPickerOpen(false); setSearch(""); } }}
        >
          <div className="ca-adm-modal__panel">
            <div className="ca-adm-card__head">
              <h3 className="ca-adm-card__title"><TrendingUp />Elegir nota de la semana</h3>
              <button
                onClick={() => { setPickerOpen(false); setSearch(""); }}
                className="ca-adm-btn"
                style={{ padding: "0.35rem" }}
                aria-label="Cerrar"
              >
                <X />
              </button>
            </div>

            <div style={{ padding: "0.8rem 1.15rem", borderBottom: "1px solid var(--adm-line-soft)" }}>
              <div className="ca-adm-search">
                <Search />
                <input
                  autoFocus
                  type="text"
                  placeholder="Buscar entre los artículos publicados..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="ca-adm-modal__list">
              {filteredPublished.length === 0 ? (
                <p className="ca-adm-empty">
                  {actuallyPublished.length === 0 ? "No hay artículos publicados." : "Sin resultados para esa búsqueda."}
                </p>
              ) : (
                filteredPublished.map((article) => (
                  <button
                    key={article.id}
                    onClick={() => setFeaturedMutation.mutate({ id: article.id })}
                    disabled={setFeaturedMutation.isPending}
                    className="ca-adm-row"
                  >
                    <span className="ca-adm-row__thumb">
                      {(article.ogImage || article.featuredImage)
                        ? <img src={article.ogImage || article.featuredImage || ""} alt="" />
                        : "CA"}
                    </span>
                    <span className="ca-adm-row__body">
                      <span className="ca-adm-row__title">{article.title}</span>
                      <span className="ca-adm-row__meta">{article.categoryName || "Sin categoría"}</span>
                    </span>
                    {featuredArticle?.id === article.id && (
                      <Check className="w-4 h-4 flex-shrink-0" style={{ color: "var(--adm-brand-2)" }} />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
