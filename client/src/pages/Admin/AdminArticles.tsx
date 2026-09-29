import { useState, useMemo, useEffect } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "./AdminLayout";
import { Plus, Edit, Trash2, Eye, EyeOff, Star, CalendarClock, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const PER_PAGE = 20;

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
  return { label: "Borrador", accent: "#b45309", icon: <EyeOff /> };
}

/**
 * Page numbers around the current one, with gaps as nulls. Seven pages fit
 * without collapsing; beyond that the ends stay reachable in one click.
 */
function pageWindow(current: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current, current - 1, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (current >= total - 2) [total - 3, total - 2, total - 1].forEach((p) => pages.add(p));

  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | null)[] = [];
  sorted.forEach((page, i) => {
    if (i > 0 && page - sorted[i - 1] > 1) out.push(null);
    out.push(page);
  });
  return out;
}

export default function AdminArticles() {
  const { data: articles, refetch } = trpc.articles.adminList.useQuery();
  const { data: categories } = trpc.categories.list.useQuery();
  const deleteMutation = trpc.articles.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("Artículo eliminado"); },
    onError: (e) => toast.error("Error: " + e.message),
  });
  const updateMutation = trpc.articles.update.useMutation({
    onSuccess: () => { refetch(); },
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);

  const toggleStatus = (id: number, current: string) => {
    updateMutation.mutate({
      id,
      status: current === "published" ? "draft" : "published",
      ...(current === "draft" ? { publishedAt: new Date().toISOString() } : {}),
    });
  };

  const toggleFeatured = (id: number, current: boolean) => {
    updateMutation.mutate({ id, featured: !current });
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (articles ?? []).filter((article) => {
      if (term && !article.title.toLowerCase().includes(term) && !article.slug.toLowerCase().includes(term)) return false;
      if (categoryFilter !== "all" && String(article.categoryId ?? "") !== categoryFilter) return false;
      if (statusFilter === "all") return true;
      if (statusFilter === "scheduled") return isScheduledArticle(article);
      if (statusFilter === "published") return article.status === "published" && !isScheduledArticle(article);
      return article.status === "draft";
    });
  }, [articles, search, statusFilter, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));

  // A filter that shortens the list can leave you stranded past the last page.
  useEffect(() => { setPage(1); }, [search, statusFilter, categoryFilter]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  const start = (page - 1) * PER_PAGE;
  const visible = filtered.slice(start, start + PER_PAGE);
  const isFiltering = search.trim() !== "" || statusFilter !== "all" || categoryFilter !== "all";

  return (
    <AdminLayout>
      <div className="ca-adm-page">
        <div className="ca-adm-bar">
          <div className="flex-1 min-w-0">
            <h1 className="ca-adm-bar__title">Artículos</h1>
          </div>
          <span className="ca-adm-pager__count">
            {isFiltering ? `${filtered.length} de ${articles?.length ?? 0}` : `${articles?.length ?? 0} en total`}
          </span>
          <Link href="/admin/nuevo" className="ca-adm-btn ca-adm-btn--primary">
            <Plus />
            Nuevo
          </Link>
        </div>

        <section className="ca-adm-card">
          <div className="ca-adm-toolbar">
            <div className="ca-adm-search">
              <Search />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por título o slug..."
                aria-label="Buscar artículos"
              />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="ca-adm-input" aria-label="Filtrar por estado">
              <option value="all">Todos los estados</option>
              <option value="published">Publicados</option>
              <option value="scheduled">Programados</option>
              <option value="draft">Borradores</option>
            </select>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="ca-adm-input" aria-label="Filtrar por categoría">
              <option value="all">Todas las categorías</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={String(cat.id)}>{cat.name}</option>
              ))}
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="ca-adm-empty">
              {articles && articles.length > 0 ? (
                <>Ningún artículo coincide con esa búsqueda.</>
              ) : (
                <>
                  Todavía no hay artículos.{" "}
                  <Link href="/admin/nuevo" style={{ color: "var(--adm-brand)", fontWeight: 600 }}>Crear el primero</Link>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="ca-adm-tablewrap">
                <table className="ca-adm-table">
                  <thead>
                    <tr>
                      <th>Título</th>
                      <th>Categoría</th>
                      <th>Estado</th>
                      <th>Destacado</th>
                      <th>Fecha</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((article) => {
                      const status = getArticleStatusDisplay(article);
                      return (
                        <tr key={article.id}>
                          <td>
                            <span className="ca-adm-table__title">{article.title}</span>
                            <span className="ca-adm-table__slug">/{article.slug}</span>
                          </td>
                          <td>{article.categoryName || "—"}</td>
                          <td>
                            <button
                              onClick={() => toggleStatus(article.id, article.status)}
                              className="ca-adm-pill"
                              style={{ ["--adm-accent" as string]: status.accent, border: 0, cursor: "pointer" }}
                              title="Cambiar entre publicado y borrador"
                            >
                              {status.icon}
                              {status.label}
                            </button>
                          </td>
                          <td>
                            <button
                              onClick={() => toggleFeatured(article.id, article.featured)}
                              className="ca-adm-iconbtn ca-adm-iconbtn--star"
                              data-on={article.featured}
                              aria-label={article.featured ? "Quitar de destacados" : "Marcar como destacado"}
                            >
                              <Star fill={article.featured ? "#f59e0b" : "none"} />
                            </button>
                          </td>
                          <td style={{ whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                            {new Date(article.createdAt).toLocaleDateString("es-MX")}
                          </td>
                          <td>
                            <div className="ca-adm-table__actions">
                              <a href={`/articulo/${article.slug}`} target="_blank" rel="noopener noreferrer" className="ca-adm-iconbtn" aria-label="Ver en el sitio">
                                <Eye />
                              </a>
                              <Link href={`/admin/editar/${article.id}`} className="ca-adm-iconbtn ca-adm-iconbtn--edit" aria-label="Editar">
                                <Edit />
                              </Link>
                              <button
                                onClick={() => {
                                  if (confirm(`¿Eliminar "${article.title}"? No se puede deshacer.`)) {
                                    deleteMutation.mutate({ id: article.id });
                                  }
                                }}
                                className="ca-adm-iconbtn ca-adm-iconbtn--danger"
                                aria-label="Eliminar"
                              >
                                <Trash2 />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="ca-adm-pager">
                <span className="ca-adm-pager__count">
                  {start + 1}–{Math.min(start + PER_PAGE, filtered.length)} de {filtered.length}
                </span>
                {totalPages > 1 && (
                  <div className="ca-adm-pager__pages">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="ca-adm-pager__page"
                      aria-label="Página anterior"
                    >
                      <ChevronLeft className="w-4 h-4 mx-auto" />
                    </button>
                    {pageWindow(page, totalPages).map((p, i) =>
                      p === null ? (
                        <span key={`gap-${i}`} className="ca-adm-pager__gap">…</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className="ca-adm-pager__page"
                          aria-current={p === page ? "page" : undefined}
                        >
                          {p}
                        </button>
                      )
                    )}
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="ca-adm-pager__page"
                      aria-label="Página siguiente"
                    >
                      <ChevronRight className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
