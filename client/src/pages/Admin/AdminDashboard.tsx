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
    return {
      label: "Programado",
      background: "rgba(91,44,143,0.15)",
      color: "#5B2C8F",
      icon: <CalendarClock className="w-3 h-3" />,
    };
  }

  if (article.status === "published") {
    return {
      label: "Publicado",
      background: "rgba(22,163,74,0.2)",
      color: "#16a34a",
      icon: <Eye className="w-3 h-3" />,
    };
  }

  return {
    label: "Borrador",
    background: "rgba(217,119,6,0.2)",
    color: "#d97706",
    icon: null,
  };
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
      <div className="p-6 space-y-8">
        <div>
          <h1 className="font-bold text-2xl" style={{ fontFamily: "Poppins, sans-serif", color: "#1A1A1A" }}>
            Dashboard
          </h1>
          <p style={{ color: "#6B6B6B" }}>Bienvenido al panel de administración de Curioseando Ando.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total artículos", value: total, icon: FileText, color: "#2B037D" },
            { label: "Publicados", value: actuallyPublished.length, icon: Eye, color: "#16a34a" },
            { label: "Programados", value: scheduled.length, icon: CalendarClock, color: "#5B2C8F" },
            { label: "Borradores", value: drafts, icon: Edit, color: "#d97706" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="ca-card p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: color }}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: "#1A1A1A" }}>{value}</p>
                <p className="text-sm" style={{ color: "#6B6B6B" }}>{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Nota de la Semana ─────────────────────────────────────────── */}
        <div className="ca-card overflow-hidden">
          <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid #E5E3DE" }}>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" style={{ color: "#5B2C8F" }} />
              <h2 className="font-bold" style={{ color: "#1A1A1A" }}>Nota de la Semana</h2>
            </div>
            <div className="flex items-center gap-2">
              {featuredArticle && (
                <button
                  onClick={() => clearFeaturedMutation.mutate()}
                  disabled={clearFeaturedMutation.isPending}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-70"
                  style={{ background: "rgba(229,62,62,0.1)", color: "#e53e3e" }}
                >
                  <X className="w-3.5 h-3.5" />
                  Quitar destacado
                </button>
              )}
              <button
                onClick={() => setPickerOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
                style={{ background: "linear-gradient(135deg, #2B037D, #5B2C8F)", color: "#fff" }}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                {featuredArticle ? "Cambiar" : "Seleccionar"}
              </button>
            </div>
          </div>

          <div className="p-4">
            {featuredLoading ? (
              <div className="h-16 rounded-lg animate-pulse" style={{ background: "#E5E3DE" }} />
            ) : featuredArticle ? (
              <div className="flex items-center gap-4">
                {(featuredArticle.ogImage || featuredArticle.featuredImage) && (
                  <img
                    src={featuredArticle.ogImage || featuredArticle.featuredImage || ""}
                    alt={featuredArticle.title}
                    className="w-20 h-14 object-cover rounded-lg flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: "#1A1A1A" }}>{featuredArticle.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#6B6B6B" }}>
                    {featuredArticle.categoryName || "Sin categoría"} ·{" "}
                    {featuredArticle.publishedAt ? new Date(featuredArticle.publishedAt).toLocaleDateString("es-ES") : ""}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full font-medium flex-shrink-0" style={{ background: "rgba(91,44,143,0.15)", color: "#5B2C8F" }}>
                  Destacada
                </span>
              </div>
            ) : (
              <p className="text-sm text-center py-4" style={{ color: "#9B9B9B" }}>
                No hay ninguna nota destacada. Selecciona una para mostrarla en grande en la portada.
              </p>
            )}
          </div>
        </div>

        {/* ── Banner Personalizable ───────────────────────────────────────────────────── */}
        <div className="ca-card overflow-hidden">
          <div className="flex items-center gap-2 p-4" style={{ borderBottom: "1px solid #E5E3DE" }}>
            <Palette className="w-5 h-5" style={{ color: "#5B2C8F" }} />
            <h2 className="font-bold" style={{ color: "#1A1A1A" }}>Banner de la Portada</h2>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "#6B6B6B" }}>Título principal</label>
              <input
                type="text"
                value={bannerTitle}
                onChange={(e) => setBannerTitle(e.target.value)}
                placeholder="Curioseando Ando"
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: "#F8F7F4", border: "1px solid #E5E3DE", color: "#1A1A1A" }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "#6B6B6B" }}>Subtítulo / descripción</label>
              <textarea
                value={bannerSubtitle}
                onChange={(e) => setBannerSubtitle(e.target.value)}
                placeholder="Datos raros, curiosos y sorprendentes..."
                rows={2}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                style={{ background: "#F8F7F4", border: "1px solid #E5E3DE", color: "#1A1A1A" }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "#6B6B6B" }}>Color / gradiente de fondo (CSS)</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={bannerBg}
                  onChange={(e) => setBannerBg(e.target.value)}
                  placeholder="Dejar vacío para usar el gradiente morado por defecto"
                  className="flex-1 px-3 py-2 rounded-lg text-sm outline-none font-mono"
                  style={{ background: "#F8F7F4", border: "1px solid #E5E3DE", color: "#1A1A1A" }}
                />
                {bannerBg && (
                  <div className="w-9 h-9 rounded-lg flex-shrink-0" style={{ background: bannerBg, border: "1px solid #E5E3DE" }} />
                )}
              </div>
              <p className="text-xs mt-1" style={{ color: "#9B9B9B" }}>Ejemplos: <code>#2B037D</code> · <code>linear-gradient(135deg, #1a0050, #4a0080)</code></p>
            </div>
            <button
              onClick={() => setBannerMutation.mutate({ title: bannerTitle, subtitle: bannerSubtitle, bgColor: bannerBg })}
              disabled={setBannerMutation.isPending || !bannerTitle.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ background: bannerSaved ? "#16a34a" : "linear-gradient(135deg, #2B037D, #5B2C8F)", color: "#fff" }}
            >
              {bannerSaved ? <><Check className="w-4 h-4" /> Guardado</> : <><Save className="w-4 h-4" /> Guardar banner</>}
            </button>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/admin/nuevo"
            className="ca-card p-5 flex items-center gap-4 no-underline group transition-all hover:-translate-y-1"
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #2B037D, #5B2C8F)" }}>
              <Plus className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold" style={{ color: "#1A1A1A" }}>Nuevo Artículo</p>
              <p className="text-sm" style={{ color: "#6B6B6B" }}>Crear y publicar contenido</p>
            </div>
          </Link>
          <Link
            href="/admin/medios"
            className="ca-card p-5 flex items-center gap-4 no-underline group transition-all hover:-translate-y-1"
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3D0FA0, #5B2C8F)" }}>
              <Image className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold" style={{ color: "#1A1A1A" }}>Galería de Medios</p>
              <p className="text-sm" style={{ color: "#6B6B6B" }}>{media?.length ?? 0} imágenes subidas</p>
            </div>
          </Link>
        </div>

        {/* Recent articles */}
        <div className="ca-card overflow-hidden">
          <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid #E5E3DE" }}>
            <h2 className="font-bold" style={{ color: "#1A1A1A" }}>Artículos Recientes</h2>
            <Link href="/admin/articulos" className="text-sm no-underline" style={{ color: "#7B4FB8" }}>
              Ver todos
            </Link>
          </div>
          <div>
            {!articles || articles.length === 0 ? (
              <div className="p-8 text-center" style={{ color: "#6B6B6B" }}>
                <p>No hay artículos aún.</p>
              </div>
            ) : (
              articles.slice(0, 5).map((article) => {
                const statusDisplay = getArticleStatusDisplay(article);
                return (
                <div
                  key={article.id}
                  className="flex items-center gap-4 p-4 transition-colors"
                  style={{ borderBottom: "1px solid #E5E3DE" }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate" style={{ color: "#1A1A1A" }}>{article.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#6B6B6B" }}>
                      {article.categoryName || "Sin categoría"} ·{" "}
                      {new Date(article.createdAt).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                  <span
                    className="text-xs px-2 py-1 rounded-full font-medium inline-flex items-center gap-1"
                    style={{
                      background: statusDisplay.background,
                      color: statusDisplay.color,
                    }}
                  >
                    {statusDisplay.icon}
                    {statusDisplay.label}
                  </span>
                  <Link href={`/admin/editar/${article.id}`} className="p-1.5 rounded no-underline" style={{ color: "#6B6B6B" }}>
                    <Edit className="w-4 h-4" />
                  </Link>
                </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Picker modal ─────────────────────────────────────────────────── */}
      {pickerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.55)" }}
          onClick={(e) => { if (e.target === e.currentTarget) { setPickerOpen(false); setSearch(""); } }}
        >
          <div
            className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col"
            style={{ background: "#fff", maxHeight: "80vh" }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid #E5E3DE" }}>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" style={{ color: "#5B2C8F" }} />
                <h3 className="font-bold" style={{ color: "#1A1A1A" }}>Seleccionar Nota de la Semana</h3>
              </div>
              <button
                onClick={() => { setPickerOpen(false); setSearch(""); }}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                style={{ color: "#6B6B6B" }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search */}
            <div className="p-3" style={{ borderBottom: "1px solid #E5E3DE" }}>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "#F8F7F4", border: "1px solid #E5E3DE" }}>
                <Search className="w-4 h-4 flex-shrink-0" style={{ color: "#9B9B9B" }} />
                <input
                  autoFocus
                  type="text"
                  placeholder="Buscar artículo publicado..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: "#1A1A1A" }}
                />
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1">
              {filteredPublished.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: "#9B9B9B" }}>
                  {actuallyPublished.length === 0 ? "No hay artículos publicados." : "Sin resultados para esa búsqueda."}
                </p>
              ) : (
                filteredPublished.map((article) => {
                  const isCurrent = featuredArticle?.id === article.id;
                  return (
                    <button
                      key={article.id}
                      onClick={() => setFeaturedMutation.mutate({ id: article.id })}
                      disabled={setFeaturedMutation.isPending}
                      className="w-full flex items-center gap-3 p-3 text-left transition-colors hover:bg-gray-50 disabled:opacity-50"
                      style={{ borderBottom: "1px solid #F0EEE9" }}
                    >
                      {(article.ogImage || article.featuredImage) ? (
                        <img
                          src={article.ogImage || article.featuredImage || ""}
                          alt={article.title}
                          className="w-14 h-10 object-cover rounded-lg flex-shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-10 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #2B037D, #5B2C8F)" }}>
                          <span className="text-white text-xs font-bold">CA</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "#1A1A1A" }}>{article.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#9B9B9B" }}>
                          {article.categoryName || "Sin categoría"}
                        </p>
                      </div>
                      {isCurrent && (
                        <Check className="w-4 h-4 flex-shrink-0" style={{ color: "#5B2C8F" }} />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
